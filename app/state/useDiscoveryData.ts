import { useEffect, useRef, useState } from "react";
import { feedProblemSummary } from "../lib/feedStatus";
import {
  discoverySnapshotSchema,
  cachedDiscoverySnapshot,
  mergeDiscoverySnapshot,
  discoveryRetryDelay,
  type DiscoverySnapshot,
} from "../lib/discoverySnapshot";
import type { FeedStatus } from "../lib/dataSources";
import type { MapItem } from "../lib/types";
import {
  readDiscoverySnapshot,
  writeDiscoverySnapshot,
} from "./discoverySnapshotStore";
export function useDiscoveryData() {
  const [catalogue, setCatalogue] = useState<MapItem[]>([]),
    [events, setEvents] = useState<MapItem[]>([]),
    [sources, setSources] = useState<FeedStatus[]>([]),
    [error, setError] = useState(""),
    [eventError, setEventError] = useState(""),
    [cacheError, setCacheError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [busy, setBusy] = useState(true);
  const latest = useRef<DiscoverySnapshot | undefined>(undefined);
  useEffect(() => {
    const controller = new AbortController();
    let loading = false;
    function apply(snapshot: DiscoverySnapshot) {
      latest.current = snapshot;
      setEvents(snapshot.issues);
      setSources(snapshot.sources);
      setEventError(feedProblemSummary(snapshot.sources));
    }
    async function loadEvents() {
      if (loading || controller.signal.aborted) return;
      loading = true;
      setBusy(true);
      try {
        const response = await fetch("/api/events", {
          signal: controller.signal,
        });
        const raw: unknown = await response.json();
        const parsed = discoverySnapshotSchema.safeParse(raw);
        if (!parsed.success) throw new Error("Invalid event response. Retry.");
        const incoming = parsed.data;
        if (!response.ok && response.status !== 503)
          throw new Error("Event data request failed.");
        const snapshot = mergeDiscoverySnapshot(latest.current, incoming);
        if (controller.signal.aborted) return;
        apply(snapshot);
        if (snapshot.issues.length) {
          try {
            await writeDiscoverySnapshot(snapshot);
            setCacheError("");
          } catch (error) {
            if (!controller.signal.aborted)
              setCacheError(
                error instanceof Error
                  ? error.message
                  : "Local data cache unavailable.",
              );
          }
        }
        if (controller.signal.aborted) return;
      } catch (error) {
        if (!controller.signal.aborted) {
          if (latest.current) apply(cachedDiscoverySnapshot(latest.current));
          setEventError(
            error instanceof Error ? error.message : "Event data unavailable.",
          );
        }
      } finally {
        loading = false;
        if (!controller.signal.aborted) setBusy(false);
      }
    }
    async function start() {
      try {
        if (!latest.current) {
          const snapshot = await readDiscoverySnapshot();
          if (snapshot && !controller.signal.aborted)
            apply(cachedDiscoverySnapshot(snapshot));
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setCacheError(
            error instanceof Error
              ? error.message
              : "Local data cache unavailable.",
          );
      }
      if (!controller.signal.aborted) await loadEvents();
    }
    void start();
    void fetch("/api/catalogue", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) {
          setCatalogue(data.issues);
          setError("");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Catalogue unavailable.",
          );
      });
    function recover() {
      if (document.visibilityState !== "visible") return;
      if (latest.current && discoveryRetryDelay(latest.current) === undefined)
        return;
      if (
        latest.current?.sources.some(
          (source) => source.retryAt && Date.parse(source.retryAt) > Date.now(),
        )
      )
        return;
      void loadEvents();
    }
    window.addEventListener("online", recover);
    window.addEventListener("focus", recover);
    return () => {
      controller.abort();
      window.removeEventListener("online", recover);
      window.removeEventListener("focus", recover);
    };
  }, [attempt]);
  return {
    catalogue,
    events,
    sources,
    error,
    eventError: [eventError, cacheError].filter(Boolean).join(" "),
    busy,
    refresh: () => setAttempt((value) => value + 1),
  };
}
