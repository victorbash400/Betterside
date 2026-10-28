import test from "node:test";
import assert from "node:assert/strict";
import { createAsyncCache, CachedLoadError } from "../app/lib/asyncCache.ts";
import { feedRequestKey } from "../app/lib/feedRequestKey.ts";
import { sourceTtl, cacheLifetimes } from "../app/lib/feedCachePolicy.ts";
import { dataSources } from "../app/lib/dataSources.ts";
const policy = { ttlMs: 100, errorTtlMs: 20 };
function fixture(maxEntries = 4, maxBytes = 1024) {
  let time = 1000;
  return {
    cache: createAsyncCache<unknown>({ maxEntries, maxBytes, now: () => time }),
    advance: (milliseconds: number) => {
      time += milliseconds;
    },
  };
}
test("repeated reads reuse data and preserve original freshness until exact expiry", async () => {
  const { cache, advance } = fixture();
  let calls = 0;
  const load = async () => ({ version: ++calls });
  const first = await cache.get("a", load, policy);
  advance(99);
  assert.deepEqual(await cache.get("a", load, policy), first);
  assert.equal(calls, 1);
  advance(1);
  const next = await cache.get("a", load, policy);
  assert.equal(calls, 2);
  assert.equal(next.storedAt, 1100);
  assert.equal(next.expiresAt, 1200);
});
test("a concurrent burst shares one in-flight request", async () => {
  const { cache } = fixture();
  let calls = 0;
  let release!: (value: unknown) => void;
  const load = () => {
    calls++;
    return new Promise<unknown>((resolve) => {
      release = resolve;
    });
  };
  const requests = Array.from({ length: 30 }, () =>
    cache.get("a", load, policy),
  );
  await Promise.resolve();
  assert.equal(calls, 1);
  release({ version: 1 });
  const results = await Promise.all(requests);
  assert.ok(results.every((result) => result === results[0]));
});
test("failed bursts stay explicit and retry only after the cooldown", async () => {
  const { cache, advance } = fixture();
  let calls = 0;
  const load = async () => {
    calls++;
    if (calls === 1) throw new Error("Upstream unavailable");
    return "recovered";
  };
  const results = await Promise.allSettled(
    Array.from({ length: 20 }, () => cache.get("a", load, policy)),
  );
  assert.equal(calls, 1);
  assert.ok(
    results.every(
      (result) =>
        result.status === "rejected" &&
        result.reason instanceof CachedLoadError &&
        result.reason.retryAt === 1020,
    ),
  );
  advance(19);
  await assert.rejects(cache.get("a", load, policy), {
    message: "Upstream unavailable",
  });
  assert.equal(calls, 1);
  advance(1);
  assert.equal((await cache.get("a", load, policy)).value, "recovered");
  assert.equal(calls, 2);
});
test("expired success is never returned as fresh when the replacement fails", async () => {
  const { cache, advance } = fixture();
  await cache.get("a", async () => "old", policy);
  advance(100);
  await assert.rejects(
    cache.get(
      "a",
      async () => {
        throw new Error("offline");
      },
      policy,
    ),
    { message: "offline" },
  );
});
test("nested caches preserve the original retry deadline instead of extending it", async () => {
  const { cache, advance } = fixture();
  await assert.rejects(
    cache.get(
      "raw",
      async () => {
        throw new Error("offline");
      },
      policy,
    ),
  );
  advance(10);
  await assert.rejects(
    cache.get(
      "source",
      () => cache.get("raw", async () => "not called", policy),
      policy,
    ),
    (error: unknown) =>
      error instanceof CachedLoadError &&
      error.attemptedAt === 1000 &&
      error.retryAt === 1020,
  );
});
test("LRU entry bounds retain recently read entries", async () => {
  const { cache } = fixture(2);
  const calls: string[] = [];
  const read = (key: string) =>
    cache.get(
      key,
      async () => {
        calls.push(key);
        return key;
      },
      policy,
    );
  await read("a");
  await read("b");
  await read("a");
  await read("c");
  await read("a");
  await read("b");
  assert.deepEqual(calls, ["a", "b", "c", "b"]);
});
test("byte bounds evict payloads and oversized responses do not enter the cache", async () => {
  const { cache } = fixture(10, 10);
  let calls = 0;
  const read = (key: string, value: string) =>
    cache.get(
      key,
      async () => {
        calls++;
        return value;
      },
      policy,
    );
  await read("a", "aaaa");
  await read("b", "bbbb");
  await read("a", "aaaa");
  assert.equal(calls, 3);
  await read("large", "12345678901234567890");
  await read("large", "12345678901234567890");
  assert.equal(calls, 5);
});
test("partial payloads can have shorter lifetimes and validation errors cannot poison a successful cache entry", async () => {
  const { cache, advance } = fixture();
  let calls = 0;
  const partial = { ttlMs: () => 10, errorTtlMs: 5 };
  await cache.get("partial", async () => ++calls, partial);
  advance(10);
  await cache.get("partial", async () => ++calls, partial);
  assert.equal(calls, 2);
  await assert.rejects(
    cache.get(
      "invalid",
      async () => {
        throw new Error("Invalid source data");
      },
      partial,
    ),
  );
  advance(5);
  assert.equal(
    (await cache.get("invalid", async () => "valid", partial)).value,
    "valid",
  );
});
test("request keys normalize URL and header ordering but isolate credentials and query values", () => {
  const a = feedRequestKey("https://example.test/data?b=2&a=1", {
    "X-Application": "example-a",
    Accept: "application/json",
  });
  const b = feedRequestKey("https://example.test/data?a=1&b=2", {
    accept: "application/json",
    "x-application": "example-a",
  });
  assert.equal(a, b);
  assert.notEqual(
    a,
    feedRequestKey("https://example.test/data?b=2&a=1", {
      "X-Application": "example-b",
      Accept: "application/json",
    }),
  );
  assert.notEqual(a, feedRequestKey("https://example.test/data?b=3&a=1"));
});
test("every public feed has a finite freshness policy, with slower metadata refreshed less often", () => {
  for (const { id } of dataSources)
    if (id !== "catalogue")
      assert.ok(Number.isFinite(sourceTtl[id]) && sourceTtl[id] > 0);
  assert.ok(sourceTtl.usgs < sourceTtl.eonet);
  assert.ok(sourceTtl.eonet < sourceTtl["hapi-conflict"]);
  assert.ok(sourceTtl["hapi-conflict"] < sourceTtl["hapi-risk"]);
  assert.ok(cacheLifetimes.geography > cacheLifetimes.organizations);
});

test("refreshing all feeds after five minutes refetches only the fast earthquake feed", async () => {
  let time = 0;
  const cache = createAsyncCache<string>({
    maxEntries: 32,
    maxBytes: 4096,
    now: () => time,
  });
  const calls = new Map<string, number>();
  const feeds = dataSources.filter((source) => source.id !== "catalogue");
  const refresh = () =>
    Promise.all(
      feeds.map(({ id }) =>
        cache.get(
          id,
          async () => {
            calls.set(id, (calls.get(id) ?? 0) + 1);
            return id;
          },
          { ttlMs: sourceTtl[id], errorTtlMs: cacheLifetimes.failure },
        ),
      ),
    );
  await refresh();
  await refresh();
  assert.ok(feeds.every(({ id }) => calls.get(id) === 1));
  time = sourceTtl.usgs;
  await refresh();
  assert.equal(calls.get("usgs"), 2);
  assert.ok(
    feeds
      .filter(({ id }) => id !== "usgs")
      .every(({ id }) => calls.get(id) === 1),
  );
});
