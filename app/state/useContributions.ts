import { useAccount } from "./AccountContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
const recordSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  amount: z.string(),
  currency: z.literal("USD"),
  status: z.enum(["CREATED", "COMPLETED", "CANCELLED", "FAILED", "REFUNDED"]),
  createdAt: z.string(),
  captureId: z.string().optional(),
});
export function useContributions() {
  const { fetch } = useAccount();
  const version = useRef(0);
  const syncing = useRef(false);
  const [records, setRecords] = useState<z.infer<typeof recordSchema>[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(
    async (signal?: AbortSignal, sync = false) => {
      if (syncing.current) return;
      const request = ++version.current;
      if (sync) syncing.current = true;
      setBusy(true);
      setError("");
      try {
        const response = await fetch("/api/contributions", {
          method: sync ? "POST" : "GET",
          signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        const result = z
          .object({ contributions: z.array(recordSchema) })
          .parse(data);
        if (!signal?.aborted && request === version.current)
          setRecords(result.contributions);
      } catch (error) {
        if (!signal?.aborted && request === version.current)
          setError(
            error instanceof Error
              ? error.message
              : "Could not load contributions.",
          );
      } finally {
        if (sync) syncing.current = false;
        if (!signal?.aborted && request === version.current) setBusy(false);
      }
    },
    [fetch],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const refresh = () => {
      void load(controller.signal);
    };
    window.addEventListener("betterside-payments-changed", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("betterside-payments-changed", refresh);
    };
  }, [load]);
  return { records, busy, error, refresh: () => void load(undefined, true) };
}
