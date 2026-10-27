import "server-only";
import { naturalEvents } from "../lib/naturalEvents";
export async function loadNaturalEvents() {
  const response = await fetch(
    "https://eonet.gsfc.nasa.gov/api/v3/events?status=all&days=60&limit=100",
    { next: { revalidate: 900 }, signal: AbortSignal.timeout(20000) },
  );
  if (!response.ok) throw new Error("NASA EONET unavailable. Retry.");
  return naturalEvents(await response.json(), new Date().toISOString());
}
