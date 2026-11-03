import test from "node:test";
import assert from "node:assert/strict";
import { chatPins, pinChatItems, unpinChatItems } from "../app/lib/chatPins.ts";
import { emptyTracking } from "../app/lib/tracking.ts";
import { saveChatRecords } from "../app/lib/saveChatRecords.ts";
import type { MapItem } from "../app/lib/types.ts";
const record: MapItem = {
  id: "food-pak", country: "Pakistan", location: "Food insecurity", coordinates: [70, 30], kind: "Hunger",
  severity: "Insufficient data", summary: "", dataset: "hapi-food",
  reportingArea: { countryCode: "PAK", adminLevel: 0, admin1Code: null, admin2Code: null },
  source: { label: "IPC", url: "https://example.org/ipc", published: null, reviewed: "2026-11-03" },
};
test("chat pins canonical country/cause scopes and records without conflating global causes", () => {
  const input = { targets: [
    { kind: "scope" as const, countryCode: "PAK", country: "Incorrect model name", concern: "hunger" as const },
    { kind: "cause" as const, concern: "hunger" as const },
    { kind: "record" as const, recordId: record.id },
  ] };
  const saved = pinChatItems(emptyTracking, [record], input, "call");
  assert.equal(saved.result.changed, 3);
  assert.equal(saved.snapshot.interests[0].name, "Hunger · Pakistan");
  assert.equal(saved.snapshot.interests[0].target?.kind, "scope");
  assert.deepEqual(saved.snapshot.following, [record.id]);
  assert.equal(saved.snapshot.savedItems[0].id, record.id);
  const repeated = pinChatItems(saved.snapshot, [record], input, "another-call");
  assert.equal(repeated.result.changed, 0);
  assert.equal(repeated.snapshot.interests.length, 2);
  assert.equal(repeated.result.pins.length, 3);
  assert.equal(emptyTracking.interests.length, 0);
});
test("unavailable source targets fail the entire requested pin action", () => {
  assert.throws(() => pinChatItems(emptyTracking, [record], { targets: [
    { kind: "record", recordId: record.id }, { kind: "country", countryCode: "KEN", country: "Kenya" },
  ] }, "call"), (error: unknown) => error instanceof Error && error.message.includes("Country unavailable"));
  assert.equal(emptyTracking.following.length, 0);
  assert.throws(() => pinChatItems(emptyTracking, [record], { targets: [{ kind: "organization", organizationId: "invented" }] }, "call"), (error: unknown) => error instanceof Error && error.message.includes("Organization unavailable"));
});
test("removing a saved folder archives descendants and preserves sourced records", () => {
  const snapshot = { ...structuredClone(emptyTracking), following: [record.id], savedItems: [record], interests: [
    { id: "folder", name: "Folder", hiddenKinds: [], issueIds: [] },
    { id: "child", name: "Child", parentId: "folder", hiddenKinds: [], issueIds: [record.id] },
  ] };
  const saved = unpinChatItems(snapshot, [record], { ids: ["folder"] });
  assert.equal(saved.snapshot.interests.every((pin) => pin.archived), true);
  assert.deepEqual(saved.snapshot.following, [record.id]);
  assert.equal(chatPins(saved.snapshot, [record])[0].recordId, record.id);
  assert.throws(() => unpinChatItems(snapshot, [record], { ids: ["missing"] }), (error: unknown) => error instanceof Error && error.message.includes("Pin unavailable"));
});
test("saving a record folder never repurposes a scoped pin with the same name", () => {
  const snapshot = pinChatItems(emptyTracking, [record], { targets: [{ kind: "scope", countryCode: "PAK", country: "Pakistan", concern: "hunger" }] }, "scope").snapshot;
  const saved = saveChatRecords(snapshot, [record], { name: "Hunger · Pakistan", recordIds: [record.id] }, "folder");
  assert.equal(saved.snapshot.interests.length, 2);
  assert.equal(saved.snapshot.interests.find((pin) => pin.id === "folder")?.target, undefined);
});

test("record pin actions retain existing folder placement and unpin removes all associations", () => {
  const snapshot = { ...structuredClone(emptyTracking), following: [record.id], savedItems: [record], interests: [
    { id: "folder", name: "Folder", hiddenKinds: [], issueIds: [record.id] },
  ] };
  const pinned = pinChatItems(snapshot, [record], { targets: [{ kind: "record", recordId: record.id }] }, "call");
  assert.equal(pinned.result.changed, 0);
  assert.equal(pinned.result.pins[0].recordId, record.id);
  assert.deepEqual(pinned.snapshot.interests[0].issueIds, [record.id]);
  const removed = unpinChatItems(snapshot, [record], { ids: [record.id] });
  assert.deepEqual(removed.snapshot.following, []);
  assert.deepEqual(removed.snapshot.interests[0].issueIds, []);
});
