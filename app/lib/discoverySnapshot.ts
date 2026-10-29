import { z } from "zod";
import { trackingSchema } from "./tracking.ts";
import { datasetIds } from "./dataSources.ts";
const sourceSchema = z.object({
  id: z.enum(datasetIds).exclude(["catalogue"]),
  state: z.enum(["ready", "partial", "stale", "error", "unconfigured"]),
  count: z.number().int().nonnegative(),
  fetchedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime().optional(),
  retryAt: z.iso.datetime().optional(),
  excludedRecords: z.number().int().nonnegative().optional(),
  truncated: z.boolean().optional(),
  message: z.string().optional(),
});
export const discoverySnapshotSchema = z.object({
  issues: z.array(trackingSchema.shape.savedItems.unwrap().element).max(100000),
  sources: z.array(sourceSchema).max(datasetIds.length),
  fetchedAt: z.iso.datetime(),
});
export type DiscoverySnapshot = z.infer<typeof discoverySnapshotSchema>;
export const discoveryRetentionMs = 7 * 24 * 60 * 60 * 1000;
export function mergeDiscoverySnapshot(
  previous: DiscoverySnapshot | undefined,
  incoming: DiscoverySnapshot,
  now = Date.now(),
): DiscoverySnapshot {
  const retained = incoming.sources.flatMap((source) => {
    if (!["error", "stale"].includes(source.state) || !previous) return [];
    const prior = previous.sources.find((item) => item.id === source.id);
    if (!prior || now - Date.parse(prior.fetchedAt) > discoveryRetentionMs)
      return [];
    if (incoming.issues.some((item) => item.dataset === source.id)) return [];
    const issues = previous.issues.filter((item) => item.dataset === source.id);
    return issues.length ? [{ id: source.id, issues, prior }] : [];
  });
  return {
    ...incoming,
    issues: [...incoming.issues, ...retained.flatMap((item) => item.issues)],
    sources: incoming.sources.map((source) => {
      const saved = retained.find((item) => item.id === source.id);
      return saved
        ? {
            ...source,
            state: "stale",
            count: saved.issues.length,
            fetchedAt: saved.prior.fetchedAt,
            expiresAt: saved.prior.expiresAt,
          }
        : source;
    }),
  };
}
export function cachedDiscoverySnapshot(
  snapshot: DiscoverySnapshot,
  now = Date.now(),
): DiscoverySnapshot {
  const sources = snapshot.sources.map((source) => {
    const expired = !source.expiresAt || Date.parse(source.expiresAt) <= now;
    const tooOld = now - Date.parse(source.fetchedAt) > discoveryRetentionMs;
    return {
      ...source,
      state: tooOld
        ? ("error" as const)
        : expired && source.count > 0
          ? ("stale" as const)
          : source.state,
      ...(tooOld
        ? { count: 0, message: "Cached data expired. Refresh sources." }
        : {}),
    };
  });
  const available = new Set(
    sources
      .filter(
        (source) => source.state !== "error" && source.state !== "unconfigured",
      )
      .map((source) => source.id),
  );
  return {
    ...snapshot,
    sources,
    issues: snapshot.issues.filter(
      (item) =>
        item.dataset &&
        available.has(
          item.dataset as Exclude<typeof item.dataset, "catalogue">,
        ),
    ),
  };
}
export function discoveryRetryDelay(
  snapshot: DiscoverySnapshot,
  now = Date.now(),
) {
  const failed = snapshot.sources.filter(
    (source) =>
      source.state === "error" ||
      source.state === "stale" ||
      source.state === "partial",
  );
  if (!failed.length) return undefined;
  return Math.max(
    1000,
    ...failed.map((source) =>
      source.retryAt || (source.state === "partial" && source.expiresAt)
        ? Date.parse((source.retryAt ?? source.expiresAt)!) - now
        : 10000,
    ),
  );
}
