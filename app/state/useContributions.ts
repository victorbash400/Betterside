import { useCallback, useEffect, useState } from "react";
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
  const [records, setRecords] = useState<z.infer<typeof recordSchema>[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/contributions", {
        signal,
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const result = z
        .object({ contributions: z.array(recordSchema) })
        .parse(data);
      if (!signal?.aborted) setRecords(result.contributions);
    } catch (error) {
      if (!signal?.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "Could not load contributions.",
        );
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  return { records, busy, error, refresh: () => void load() };
}
