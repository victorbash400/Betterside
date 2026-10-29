import type { FeedStatus } from "./dataSources.ts";
export function feedResultStatus(
  base: FeedStatus,
  result: { count: number; skipped: number; truncated: boolean },
): FeedStatus {
  const unusable = result.count === 0 && result.skipped > 0;
  const messages = [
    ...(result.truncated
      ? ["Source download stopped before all pages were received."]
      : []),
    ...(result.skipped
      ? [
          `${result.skipped} records excluded because geography or source metadata is missing.`,
        ]
      : []),
  ];
  return {
    ...base,
    count: result.count,
    state: unusable ? "error" : result.truncated ? "partial" : "ready",
    excludedRecords: result.skipped,
    truncated: result.truncated,
    ...(messages.length ? { message: messages.join(" ") } : {}),
  };
}
export function feedProblemSummary(sources: FeedStatus[]) {
  const unavailable = sources.filter(
    (source) => source.state === "error" || source.state === "unconfigured",
  ).length;
  const cached = sources.filter((source) => source.state === "stale").length;
  const partial = sources.filter((source) => source.state === "partial").length;
  return [
    ...(cached
      ? [
          `${cached} ${cached === 1 ? "source using" : "sources using"} cached records.`,
        ]
      : []),
    ...(unavailable
      ? [
          `${unavailable} ${unavailable === 1 ? "source" : "sources"} unavailable.`,
        ]
      : []),
    ...(partial
      ? [
          `${partial} ${partial === 1 ? "source" : "sources"} partially downloaded.`,
        ]
      : []),
  ].join(" ");
}
