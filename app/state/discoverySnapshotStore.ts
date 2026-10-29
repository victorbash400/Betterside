import {
  discoverySnapshotSchema,
  type DiscoverySnapshot,
} from "../lib/discoverySnapshot";
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("betterside-public-discovery", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("snapshots");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Local data cache unavailable."));
    request.onblocked = () =>
      reject(
        new Error(
          "Close older BetterSide tabs to enable the local data cache.",
        ),
      );
  });
}
export async function readDiscoverySnapshot(): Promise<
  DiscoverySnapshot | undefined
> {
  const db = await database();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db
        .transaction("snapshots")
        .objectStore("snapshots")
        .get("events");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("Local data cache could not be read."));
    });
    if (value === undefined) return undefined;
    const parsed = discoverySnapshotSchema.safeParse(value);
    if (!parsed.success)
      throw new Error("Saved data cache is invalid. Refresh sources.");
    return parsed.data;
  } finally {
    db.close();
  }
}
export async function writeDiscoverySnapshot(snapshot: DiscoverySnapshot) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("snapshots", "readwrite");
      transaction.objectStore("snapshots").put(snapshot, "events");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(new Error("Local data cache could not be saved."));
      transaction.onabort = () =>
        reject(new Error("Local data cache could not be saved."));
    });
  } finally {
    db.close();
  }
}
