import "server-only";
import { createHash } from "node:crypto";
import { createAsyncCache } from "../../lib/asyncCache";
import { feedRequestKey } from "../../lib/feedRequestKey";
import { cacheLifetimes } from "../../lib/feedCachePolicy";
import { createRequestQueue } from "../../lib/requestQueue";
const hapiQueue = createRequestQueue(2);
const responses = createAsyncCache<unknown>({
  maxEntries: 128,
  maxBytes: 32 * 1024 * 1024,
});
export async function feedJson(
  url: string | URL,
  headers?: Record<string, string>,
  ttlMs = cacheLifetimes.metadata,
  validate?: (value: unknown) => unknown,
) {
  const key = createHash("sha256")
    .update(feedRequestKey(url, headers))
    .digest("hex");
  const request = async () => {
    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
    } catch (error) {
      const cause = error instanceof Error ? error.cause : undefined;
      const timedOut =
        (error instanceof Error && error.name === "TimeoutError") ||
        (cause instanceof Error &&
          "code" in cause &&
          ["UND_ERR_CONNECT_TIMEOUT", "ETIMEDOUT"].includes(
            String(cause.code),
          ));
      throw new Error(
        timedOut
          ? "Source connection timed out. Retry."
          : "Source connection failed. Retry.",
        { cause: error },
      );
    }
    if (!response.ok)
      throw new Error(`Source returned HTTP ${response.status}. Retry.`);
    const body = response.status === 204 ? "null" : await response.text();
    const value: unknown = JSON.parse(body);
    validate?.(value);
    return value;
  };
  const result = await responses.get(
    key,
    () =>
      new URL(url).hostname === "hapi.humdata.org"
        ? hapiQueue(request)
        : request(),
    { ttlMs, errorTtlMs: cacheLifetimes.failure },
  );
  return result.value;
}
