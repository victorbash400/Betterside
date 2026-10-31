import { useEffect, useState } from "react";
import { profileResponseSchema, type ContributionGoal } from "../lib/profile";
export function useCheckoutGoal(id?: string) {
  const [result, setResult] = useState<{
    id: string;
    goal?: ContributionGoal;
    error?: string;
  }>();
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/profile", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Goal unavailable.");
        const found = profileResponseSchema
          .parse(body)
          .profile.goals.find((goal) => goal.id === id);
        if (!found) throw new Error("Goal unavailable. Reopen profile.");
        if (!controller.signal.aborted) setResult({ id, goal: found });
      } catch (failure) {
        if (!controller.signal.aborted)
          setResult({
            id,
            error: failure instanceof Error ? failure.message : "Goal unavailable.",
          });
      }
    })();
    return () => controller.abort();
  }, [id, fetch]);
  const current = result?.id === id ? result : undefined;
  return {
    goal: current?.goal,
    error: current?.error ?? "",
    loading: Boolean(id && !current),
  };
}
