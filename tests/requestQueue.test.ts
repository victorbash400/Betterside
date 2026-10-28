import test from "node:test";
import assert from "node:assert/strict";
import { createRequestQueue } from "../app/lib/requestQueue.ts";
test("provider queue bounds concurrency, releases failures, and never repeats requests", async () => {
  const run = createRequestQueue(2);
  const releases: Array<() => void> = [];
  let active = 0, peak = 0, started = 0;
  const requests = Array.from({ length: 4 }, (_, index) => run(async () => {
    started++; active++; peak = Math.max(peak, active);
    await new Promise<void>((resolve) => releases.push(resolve));
    active--;
    if (index === 0) throw new Error("Source unavailable");
    return index;
  }));
  const results = Promise.allSettled(requests);
  await Promise.resolve();
  assert.equal(started, 2);
  releases[0](); releases[1]();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(started, 4);
  releases[2](); releases[3]();
  const settled = await results;
  assert.equal(peak, 2);
  assert.equal(settled[0].status, "rejected");
  assert.equal(settled.filter((result) => result.status === "fulfilled").length, 3);
  assert.equal(started, 4);
});
