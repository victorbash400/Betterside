import { trackingSchema, type Tracking } from "./tracking.ts";
import { saveRecordsSchema, type SaveRecordsAction } from "./chatWorkspace.ts";
import type { MapItem } from "./types.ts";
export function saveChatRecords(
  previous: Tracking,
  records: MapItem[],
  input: SaveRecordsAction,
  callId: string,
) {
  const { name, recordIds } = saveRecordsSchema.parse(input);
  const ids = new Set(recordIds);
  if (ids.size !== recordIds.length) throw new Error("Duplicate record IDs.");
  const selected = records.filter((record) => ids.has(record.id));
  if (selected.length !== ids.size)
    throw new Error("A requested record is unavailable. Search again.");
  const existing = previous.interests.find(
    (interest) => interest.name === name && !interest.archived && !interest.target,
  );
  const id = existing?.id ?? callId;
  const snapshot = trackingSchema.parse({
    ...previous,
    following: [...new Set([...previous.following, ...recordIds])],
    savedItems: [
      ...previous.savedItems.filter((record) => !ids.has(record.id)),
      ...selected,
    ],
    interests: [
      ...previous.interests
        .filter((interest) => interest.id !== id)
        .map((interest) => ({
          ...interest,
          issueIds: interest.issueIds.filter((recordId) => !ids.has(recordId)),
        })),
      {
        ...(existing ?? { id, hiddenKinds: [] }),
        name,
        issueIds: [...new Set([...(existing?.issueIds ?? []), ...recordIds])],
      },
    ],
  });
  return {
    snapshot,
    result: { kind: "saved" as const, id, name, count: ids.size },
  };
}
