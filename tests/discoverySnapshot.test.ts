import test from "node:test";
import assert from "node:assert/strict";
import {
  discoverySnapshotSchema,
  mergeDiscoverySnapshot,
  cachedDiscoverySnapshot,
  discoveryRetryDelay,
  discoveryRetentionMs,
} from "../app/lib/discoverySnapshot.ts";
const now = Date.parse("2026-10-29T12:00:00Z");
const previous = discoverySnapshotSchema.parse({
  fetchedAt: new Date(now).toISOString(),
  sources: [
    {
      id: "usgs",
      state: "ready",
      count: 1,
      fetchedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 300000).toISOString(),
    },
  ],
  issues: [
    {
      id: "usgs:1",
      location: "Reported event",
      country: "Kenya",
      coordinates: [36, -1],
      kind: "Disaster response",
      severity: "Insufficient data",
      summary: "",
      dataset: "usgs",
      geographicPrecision: "Event location",
      source: {
        label: "USGS",
        url: "https://earthquake.usgs.gov/",
        published: null,
        reviewed: new Date(now).toISOString(),
      },
    },
  ],
});
test("failed feeds retain dated records and expose cache use instead of replacing the map with zero", () => {
  const failed = {
    ...previous,
    issues: [],
    sources: [
      {
        ...previous.sources[0],
        count: 0,
        state: "error" as const,
        fetchedAt: new Date(now + 600000).toISOString(),
        retryAt: new Date(now + 720000).toISOString(),
        message: "HTTP 503",
      },
    ],
  };
  const merged = mergeDiscoverySnapshot(previous, failed, now + 600000);
  assert.deepEqual(merged.issues, previous.issues);
  assert.equal(merged.sources[0].state, "stale");
  assert.equal(merged.sources[0].count, 1);
  assert.equal(merged.sources[0].fetchedAt, previous.sources[0].fetchedAt);
  assert.equal(merged.sources[0].message, "HTTP 503");
  assert.equal(discoveryRetryDelay(merged, now + 600000), 120000);
});
test("a verified empty result replaces old records and successful data ends automatic recovery", () => {
  const empty = {
    ...previous,
    issues: [],
    sources: [{ ...previous.sources[0], count: 0 }],
  };
  assert.deepEqual(mergeDiscoverySnapshot(previous, empty, now).issues, []);
  assert.equal(discoveryRetryDelay(empty, now), undefined);
});
test("persisted expired records are marked cached and removed at the bounded retention limit", () => {
  const restored = cachedDiscoverySnapshot(previous, now + 600000);
  assert.equal(restored.issues.length, 1);
  assert.equal(restored.sources[0].state, "stale");
  const expired = cachedDiscoverySnapshot(
    previous,
    now + discoveryRetentionMs + 1,
  );
  assert.equal(expired.issues.length, 0);
  assert.equal(expired.sources[0].state, "error");
});
test("failed providers cannot duplicate another provider's records or extend saved freshness", () => {
  const failed = {
    ...previous,
    issues: [],
    sources: [
      {
        ...previous.sources[0],
        state: "error" as const,
        fetchedAt: new Date(now + 1000).toISOString(),
      },
    ],
  };
  const merged = mergeDiscoverySnapshot(previous, failed, now + 1000);
  const repeated = mergeDiscoverySnapshot(merged, failed, now + 2000);
  assert.equal(repeated.issues.length, 1);
  assert.equal(repeated.sources[0].fetchedAt, previous.sources[0].fetchedAt);
  assert.equal(
    mergeDiscoverySnapshot(previous, failed, now + discoveryRetentionMs + 1)
      .issues.length,
    0,
  );
});
