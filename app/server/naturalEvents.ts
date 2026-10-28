import "server-only";
import { naturalEvents, eventFeedSchema } from "../lib/naturalEvents";
import { sourceTtl } from "../lib/feedCachePolicy";
import { feedJson } from "./feeds/request";
export async function loadNaturalEvents() {
  const response = await feedJson(
    "https://eonet.gsfc.nasa.gov/api/v3/events?status=all&days=60&limit=1000",
    undefined,
    sourceTtl.eonet,
    (raw) => eventFeedSchema.parse(raw),
  );
  return naturalEvents(response, new Date().toISOString());
}
