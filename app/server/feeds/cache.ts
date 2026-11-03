import "server-only";
import { createAsyncCache } from "../../lib/asyncCache";
import { createRequestQueue } from "../../lib/requestQueue";
function createFeedCache() {
  return {
    responses: createAsyncCache<unknown>({
      maxEntries: 128,
      maxBytes: 32 * 1024 * 1024,
    }),
    hapiQueue: createRequestQueue(2),
  };
}
// Public provider requests share their cache and concurrency limit across route bundles.
const shared = globalThis as typeof globalThis & {
  bettersidePublicFeeds?: ReturnType<typeof createFeedCache>;
};
export const publicFeeds = (shared.bettersidePublicFeeds ??= createFeedCache());
