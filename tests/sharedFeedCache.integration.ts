import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { feedCacheItems } from "./helpers/feedCacheDatabase.ts";
import { sharedFeed, assertProviderAvailable, storeProviderCooldown } from "../app/server/feeds/sharedCache.ts";
import { CachedLoadError } from "../app/lib/asyncCache.ts";

test("shared feed storage survives process-local cache misses and expires on the provider TTL", async () => {
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  let calls = 0;
  const load = async () => ({ observations: [++calls, 0] });
  try {
    const first = await sharedFeed("shared-success", 60_000, load);
    now += 59_000;
    const reused = await sharedFeed("shared-success", 60_000, load);
    assert.deepEqual(reused, first);
    assert.equal(calls, 1);
    now += 1000;
    assert.deepEqual((await sharedFeed("shared-success", 60_000, load)).value, { observations: [2, 0] });
    assert.equal(calls, 2);
  } finally { Date.now = originalNow; }
});

test("large validated provider responses round-trip through bounded compressed chunks", async () => {
  const value = { data: randomBytes(750_000).toString("base64") };
  await sharedFeed("shared-large", 60_000, async () => value);
  const reused = await sharedFeed("shared-large", 60_000, async () => { throw new Error("Must not fetch twice"); });
  assert.deepEqual(reused.value, value);
  const chunks = [...feedCacheItems.values()].filter(item => item.pk === "PUBLIC_FEED#v1#shared-large" && item.data);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(item => (item.data as Uint8Array).byteLength <= 300 * 1024));
});

test("another instance cannot duplicate an in-flight refresh, and refresh completion releases its lease", async () => {
  let finish!: (value: unknown) => void;
  let entered!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const first = sharedFeed("shared-concurrent", 60_000, () => {
    entered();
    return new Promise(resolve => { finish = resolve; });
  });
  await started;
  await assert.rejects(sharedFeed("shared-concurrent", 60_000, async () => { throw new Error("Duplicate fetch"); }),
    { message: "Source refresh in progress. Retry shortly." });
  finish({ data: [12] });
  await first;
  assert.deepEqual((await sharedFeed("shared-concurrent", 60_000, async () => null)).value, { data: [12] });
});

test("shared failures and provider-wide Retry-After cooldowns survive cold requests without repeated upstream calls", async () => {
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  let calls = 0;
  const error = new CachedLoadError(new Error("Source rate limited"), now, now + 120_000);
  const load = async () => { calls++; throw error; };
  try {
    await assert.rejects(sharedFeed("shared-error", 60_000, load), { message: error.message });
    await assert.rejects(sharedFeed("shared-error", 60_000, load), { message: error.message });
    assert.equal(calls, 1);
    await storeProviderCooldown("hapi-test", error);
    await storeProviderCooldown("hapi-test", new CachedLoadError(new Error("Shorter cooldown"), now, now + 1000));
    await assert.rejects(assertProviderAvailable("hapi-test"), { message: error.message });
    now += 120_000;
    await assertProviderAvailable("hapi-test");
    assert.deepEqual((await sharedFeed("shared-error", 60_000, async () => ({ data: [] }))).value, { data: [] });
  } finally { Date.now = originalNow; }
});

test("local network and validation failures release the lease without poisoning other instances", async () => {
  await assert.rejects(sharedFeed("shared-local-failure", 60_000, async () => {
    throw new Error("Source connection timed out. Retry.");
  }), { message: "Source connection timed out. Retry." });
  const metadata = [...feedCacheItems.values()].find(item => item.pk === "PUBLIC_FEED#v1#shared-local-failure");
  assert.equal(metadata?.lockOwner, undefined);
  assert.equal(metadata?.error, undefined);
  assert.deepEqual((await sharedFeed("shared-local-failure", 60_000, async () => ({ data: [1] }))).value, { data: [1] });
});

test("a HAPI rate limit suppresses different uncached queries using the same app identifier", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(null, { status: 429, headers: { "Retry-After": "120" } });
  };
  try {
    const { feedJson } = await import("../app/server/feeds/request.ts");
    const headers = { "X-HDX-HAPI-APP-IDENTIFIER": "shared-cooldown-test" };
    await assert.rejects(feedJson("https://hapi.humdata.org/api/v2/affected-people/idps?location_code=SDN", headers),
      error => error instanceof Error && error.message.includes("rate limited"));
    await assert.rejects(feedJson("https://hapi.humdata.org/api/v2/affected-people/idps?location_code=TCD", headers),
      error => error instanceof Error && error.message.includes("rate limited"));
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});
