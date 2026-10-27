import test from "node:test";
import assert from "node:assert/strict";
import { naturalEvents } from "../app/lib/naturalEvents.ts";
import { formatDate } from "../app/lib/dates.ts";
import { trackingSchema } from "../app/lib/tracking.ts";
import { interestPath, canMoveInterest } from "../app/lib/interestTree.ts";
test("natural events use latest observations and never fabricate funding", () => {
  const records = naturalEvents(
    {
      events: [
        {
          id: "EONET_TEST",
          title: "Test storm",
          description: null,
          link: "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_TEST",
          closed: null,
          categories: [{ id: "severeStorms", title: "Severe Storms" }],
          sources: [],
          geometry: [
            {
              date: "2026-10-25T00:00:00Z",
              type: "Point",
              coordinates: [1, 2],
            },
            {
              date: "2026-10-27T00:00:00Z",
              type: "Point",
              coordinates: [3, 4],
            },
          ],
        },
      ],
    },
    "2026-10-27",
  );
  assert.equal(records.length, 1);
  assert.deepEqual(records[0].coordinates, [3, 4]);
  assert.equal(records[0].project, undefined);
  assert.equal(records[0].severity, "Insufficient data");
  assert.deepEqual(records[0].categoryIds, ["storm-response"]);
});
test("invalid or missing timestamps remain displayable", () => {
  assert.equal(formatDate(undefined), "Date unavailable");
  assert.equal(formatDate("invalid"), "Date unavailable");
  assert.equal(formatDate(""), "Date unavailable");
  assert.equal(formatDate("2026-10-27T00:00:00Z"), "Oct 27, 2026");
});
test("folder paths preserve hierarchy and prohibit cycles", () => {
  const snapshot = trackingSchema.parse({
    version: 1,
    following: [],
    interests: [
      { id: "root", name: "Water", issueIds: [] },
      { id: "child", parentId: "root", name: "Drinking water", issueIds: [] },
    ],
  });
  assert.deepEqual(
    interestPath(snapshot.interests, "child").map((item) => item.name),
    ["Water", "Drinking water"],
  );
  assert.equal(canMoveInterest(snapshot.interests, "root", "child"), false);
  assert.equal(canMoveInterest(snapshot.interests, "child", "root"), true);
  assert.equal(
    trackingSchema.safeParse({
      ...snapshot,
      interests: snapshot.interests.map((item) =>
        item.id === "root" ? { ...item, parentId: "child" } : item,
      ),
    }).success,
    false,
  );
});
