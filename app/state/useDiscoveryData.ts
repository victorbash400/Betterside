import { useEffect, useState } from "react";
import type { MapItem } from "../lib/types";
export function useDiscoveryData() {
  const [catalogue, setCatalogue] = useState<MapItem[]>([]),
    [events, setEvents] = useState<MapItem[]>([]),
    [error, setError] = useState(""),
    [eventError, setEventError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    async function load(
      path: string,
      apply: (items: MapItem[]) => void,
      fail: (message: string) => void,
    ) {
      try {
        const response = await fetch(path, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        apply(data.issues);
        fail("");
      } catch (error) {
        if (!controller.signal.aborted)
          fail(
            error instanceof Error ? error.message : "Data unavailable. Retry.",
          );
      }
    }
    void Promise.all([
      load("/api/catalogue", setCatalogue, setError),
      load("/api/events", setEvents, setEventError),
    ]).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [attempt]);
  return {
    catalogue,
    events,
    error,
    eventError,
    busy,
    refresh: () => setAttempt((value) => value + 1),
  };
}
