import "server-only";
import { createAsyncCache } from "../../lib/asyncCache";
import { createRequestQueue } from "../../lib/requestQueue";
function createFeedCache() {
  return {
    responses: createAsyncCache<{ value: unknown; validUntil: number }>({
      maxEntries: 128,
      maxBytes: 32 * 1024 * 1024,
    }),
    hapiQueue: createRequestQueue(2),
  };
}
// Public provider requests share their cache and concurrency limit across route bundles.
const shared = globalThis as typeof globalThis & {
  bettersidePublicFeedsV2?: ReturnType<typeof createFeedCache>;
};
export const publicFeeds = (shared.bettersidePublicFeedsV2 ??= createFeedCache());
