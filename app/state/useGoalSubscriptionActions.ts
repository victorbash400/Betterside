import { useState } from "react";
import { useAccount } from "./AccountContext";
import { subscriptionSchema } from "../lib/paypalSubscription";

export function useGoalSubscriptionActions(goalId: string) {
  const { fetch } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(
    action: "pause" | "resume" | "cancel" | "adjust" | "refresh",
    amount?: string,
  ) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/paypal/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          goalId,
          ...(action === "adjust" ? { amount } : {}),
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Subscription update failed.");
      const record = subscriptionSchema.parse(body.subscription);
      window.dispatchEvent(new Event("betterside-payments-changed"));
      if (action === "adjust" && record.pendingChange?.approvalUrl)
        window.location.assign(record.pendingChange.approvalUrl);
      return record;
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Subscription update failed.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}
