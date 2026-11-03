import "server-only";
import { createHash } from "node:crypto";
import { CachedLoadError } from "../../lib/asyncCache";
import { publicFeeds } from "./cache";
import { feedRequestKey } from "../../lib/feedRequestKey";
import { cacheLifetimes } from "../../lib/feedCachePolicy";
const { responses, hapiQueue } = publicFeeds;
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
    if (!response.ok) {
      if (response.status === 429) {
        const now = Date.now(),
          header = response.headers.get("retry-after");
        const seconds = header === null ? NaN : Number(header);
        const date = header === null ? NaN : Date.parse(header);
        const retryAt =
          Number.isFinite(seconds) && seconds >= 0
            ? now + seconds * 1000
            : Number.isFinite(date) && date > now
              ? date
              : now + cacheLifetimes.failure;
        throw new CachedLoadError(
          new Error(
            `Source rate limited. Retry after ${new Date(retryAt).toISOString()}.`,
          ),
          now,
          retryAt,
        );
      }
      throw new Error(`Source returned HTTP ${response.status}. Retry.`);
    }
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
