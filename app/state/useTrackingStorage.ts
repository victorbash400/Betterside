import { useAccount } from "../state/AccountContext";
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
  const { fetch, beforeSignOut } = useAccount();
  const [state, setState] = useState<Tracking>(emptyTracking),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const revision = useRef(0),
    desired = useRef<Tracking>(emptyTracking),
    persisted = useRef<Tracking>(emptyTracking),
    writing = useRef<Promise<void> | undefined>(undefined),
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
        snapshot ??= emptyTracking;
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
        if (snapshot !== persisted.current) void flush().catch(() => {});
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not restore pins.",
          );
      }
    }
    void load();
    return () => {
      live.current = false;
      controller.abort();
    };
  }, [fetch]);
  useEffect(
    () =>
      beforeSignOut(async () => {
        if (desired.current === persisted.current) return;
        if (error) throw new Error(error);
        await flush();
      }),
    [beforeSignOut, error, fetch],
  );
  function flush(): Promise<void> {
    if (writing.current) return writing.current;
    const operation = drain().finally(() => {
      writing.current = undefined;
    });
    writing.current = operation;
    return operation;
  }
  async function drain() {
    try {
      // Drain changes triggered by user actions; failures wait for explicit retry.
      while (live.current && desired.current !== persisted.current) {
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
      }
      if (live.current) setError("");
    } catch (error) {
      if (live.current)
        setError(
          error instanceof Error ? error.message : "Could not save pins.",
        );
      throw error;
    }
  }
  function update(transform: (previous: Tracking) => Tracking) {
    if (!ready || error) return;
    try {
      const next = trackingSchema.parse(transform(desired.current));
      desired.current = next;
      setState(next);
      void flush().catch(() => {});
    } catch {
      setError("Could not update pins.");
    }
  }
  function retry() {
    if (!ready || conflict.current) {
      window.location.reload();
      return;
    }
    void flush().catch(() => {});
  }
  async function commit(transform: (previous: Tracking) => Tracking) {
    if (!ready || error)
      throw new Error(error || "Saved pins unavailable.");
    const next = trackingSchema.parse(transform(desired.current));
    desired.current = next;
    setState(next);
    await flush();
  }
  return { state, update, commit, ready, error, retry };
}
