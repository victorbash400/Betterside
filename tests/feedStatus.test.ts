import test from "node:test";
import assert from "node:assert/strict";
import { feedResultStatus, feedProblemSummary } from "../app/lib/feedStatus.ts";
import type { FeedStatus } from "../app/lib/dataSources.ts";
const base: FeedStatus = {
  id: "hapi-refugees",
  state: "ready",
  count: 0,
  fetchedAt: "2026-10-28T12:00:00Z",
};
test("usable source data stays available when individual records cannot be mapped", () => {
  const status = feedResultStatus(base, {
    count: 4864,
    skipped: 43,
    truncated: false,
  });
  assert.equal(status.state, "ready");
  assert.equal(status.excludedRecords, 43);
  assert.equal(status.count, 4864);
  assert.ok(status.message?.includes("43 records excluded"));
  assert.equal(feedProblemSummary([status]), "");
});
test("unfinished pages and feeds with no usable records remain visible problems", () => {
  const partial = feedResultStatus(base, {
    count: 100,
    skipped: 3,
    truncated: true,
  });
  const unusable = feedResultStatus(base, {
    count: 0,
    skipped: 5,
    truncated: false,
  });
  assert.equal(partial.state, "partial");
  assert.equal(unusable.state, "error");
  assert.equal(
    feedProblemSummary([partial, unusable]),
    "1 source unavailable. 1 source partially downloaded.",
  );
});
test("an empty successful feed is available and failed feeds are never counted as ready", () => {
  assert.equal(
    feedResultStatus(base, { count: 0, skipped: 0, truncated: false }).state,
    "ready",
  );
  assert.equal(
    feedProblemSummary([
      { ...base, state: "error" },
      { ...base, state: "unconfigured" },
    ]),
    "2 sources unavailable.",
  );
});
