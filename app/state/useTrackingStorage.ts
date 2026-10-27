import { useEffect, useRef, useState } from "react";
import { interestCategories } from "../lib/interestCategories";
import { z } from "zod";
import {
  emptyTracking,
  trackingSchema,
  trackingResponseSchema,
  type Tracking,
} from "../lib/tracking";
async function responseData(response: Response) {
  const body: unknown = await response.json();
  if (!response.ok)
    throw new Error(z.object({ error: z.string() }).parse(body).error);
  return trackingResponseSchema.parse(body);
}
export function useTrackingStorage() {
  const [state, setState] = useState<Tracking>(emptyTracking),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const revision = useRef(0),
    desired = useRef<Tracking>(emptyTracking),
    persisted = useRef<Tracking>(emptyTracking),
    saving = useRef(false),
    live = useRef(true),
    conflict = useRef(false);
  useEffect(() => {
    live.current = true;
    const controller = new AbortController();
    async function load() {
      try {
        const remote = await responseData(
          await fetch("/api/tracking", {
            cache: "no-store",
            signal: controller.signal,
          }),
        );
        if (controller.signal.aborted) return;
        let snapshot = remote.snapshot;
        revision.current = remote.revision;
        persisted.current = snapshot ?? emptyTracking;
        if (!snapshot) {
          const saved = localStorage.getItem("betterside-tracking"),
            legacy = localStorage.getItem("betterside-following");
          snapshot = saved
            ? trackingSchema.parse(JSON.parse(saved))
            : legacy
              ? trackingSchema.parse({
                  ...emptyTracking,
                  following: JSON.parse(legacy),
                })
              : emptyTracking;
        }
        if (
          snapshot.interests.some(
            (interest) =>
              !interest.categoryId &&
              interestCategories.some(
                (category) => category.name === interest.name,
              ),
          )
        ) {
          snapshot = {
            ...snapshot,
            interests: snapshot.interests.map((interest) =>
              interest.categoryId
                ? interest
                : {
                    ...interest,
                    categoryId: interestCategories.find(
                      (category) => category.name === interest.name,
                    )?.id,
                  },
            ),
          };
        }
        desired.current = snapshot;
        setState(snapshot);
        setReady(true);
        if (snapshot !== persisted.current) void flush();
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not restore interests.",
          );
      }
    }
    void load();
    return () => {
      live.current = false;
      controller.abort();
    };
  }, []);
  async function flush() {
    if (saving.current) return;
    saving.current = true;
    try {
      // Drain changes triggered by user actions; failures wait for explicit retry.
      while (desired.current !== persisted.current) {
        const snapshot = desired.current;
        const response = await fetch("/api/tracking", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snapshot, revision: revision.current }),
        });
        conflict.current = response.status === 409;
        const saved = await responseData(response);
        revision.current = saved.revision;
        persisted.current = snapshot;
        localStorage.setItem("betterside-tracking", JSON.stringify(snapshot));
      }
      if (live.current) setError("");
    } catch (error) {
      if (live.current)
        setError(
          error instanceof Error ? error.message : "Could not save interests.",
        );
    } finally {
      saving.current = false;
    }
  }
  function update(transform: (previous: Tracking) => Tracking) {
    if (!ready || error) return;
    try {
      const next = trackingSchema.parse(transform(desired.current));
      desired.current = next;
      setState(next);
      void flush();
    } catch {
      setError("Could not update interests.");
    }
  }
  function retry() {
    if (!ready || conflict.current) {
      window.location.reload();
      return;
    }
    void flush();
  }
  return { state, update, ready, error, retry };
}
