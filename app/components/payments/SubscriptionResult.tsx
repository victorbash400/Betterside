"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingRegion from "../controls/LoadingRegion";
import { subscriptionSchema } from "../../lib/paypalSubscription";
import styles from "./PaymentResult.module.css";
export default function SubscriptionResult() {
  const [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        setError("");
        setStatus("");
        const params = new URL(window.location.href).searchParams;
        const goalId = params.get("goalId");
        if (!goalId) throw new Error("Goal is missing.");
        const response = await fetch("/api/paypal/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "refresh", goalId }),
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "Subscription unavailable.");
        const record = subscriptionSchema.parse(body.subscription);
        if (!controller.signal.aborted)
          setStatus(
            record.pendingChange
              ? params.get("cancelled") === "1"
                ? "Amount change not approved"
                : "Amount change awaiting approval"
              : record.status === "ACTIVE"
                ? "Subscription active"
                : record.status === "SUSPENDED"
                  ? "Subscription paused"
                  : record.status === "CANCELLED"
                    ? "Subscription cancelled"
                    : params.get("cancelled") === "1"
                      ? "PayPal approval cancelled"
                      : "Subscription awaiting approval",
          );
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : "Subscription unavailable.",
          );
      }
    })();
    return () => controller.abort();
  }, [attempt]);
  return (
    <main className={styles.page}>
      <section className={styles.result}>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={() => setAttempt((value) => value + 1)}>
              Retry
            </button>
          </>
        ) : status ? (
          <>
            <h1>{status}</h1>
            <small>Sandbox · No real money</small>
          </>
        ) : (
          <LoadingRegion label="Checking subscription" />
        )}
        <Link href="/">Return to BetterSide</Link>
      </section>
    </main>
  );
}
