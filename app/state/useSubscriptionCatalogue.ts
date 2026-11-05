import { useEffect, useState } from "react";
import { z } from "zod";
import { issueSchema } from "../lib/catalogueSchema";
import { useAccount } from "./AccountContext";
export function useSubscriptionCatalogue() {
  const { fetch } = useAccount();
  const [projects, setProjects] = useState<z.infer<typeof issueSchema>[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    void (async () => {
      try {
        const response = await fetch("/api/catalogue", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "Payment recipients unavailable.");
        const result = z.object({ issues: z.array(issueSchema) }).parse(body);
        if (!controller.signal.aborted) setProjects(result.issues);
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : "Payment recipients unavailable.",
          );
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    })();
    return () => controller.abort();
  }, [fetch, attempt]);
  return {
    projects,
    error,
    busy,
    retry: () => setAttempt((value) => value + 1),
  };
}
