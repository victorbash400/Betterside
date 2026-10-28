import "server-only";
import { countryFeedSchema } from "../../lib/feeds/shared";
import { cacheLifetimes } from "../../lib/feedCachePolicy";
import { feedJson } from "./request";
export async function loadCountries() {
  const feed = countryFeedSchema.parse(
    await feedJson(
      "https://goadmin.ifrc.org/api/v2/country/?limit=500",
      undefined,
      cacheLifetimes.geography,
      (raw) => countryFeedSchema.parse(raw),
    ),
  );
  if (feed.next) throw new Error("Country geography incomplete.");
  return feed.results;
}
