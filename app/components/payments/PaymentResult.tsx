"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import styles from "./PaymentResult.module.css";
export default function PaymentResult({
  cancelled = false,
}: {
  cancelled?: boolean;
}) {
  const started = useRef(false),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [result, setResult] = useState<{
      status: string;
      amount?: string;
      projectName?: string;
    }>();
  const finish = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const orderId = new URL(window.location.href).searchParams.get("token");
      if (!orderId) throw new Error("PayPal order ID missing.");
      const response = await fetch(
        cancelled ? "/api/paypal/cancel" : "/api/paypal/capture",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Payment confirmation failed.");
      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Payment confirmation failed.",
      );
    } finally {
      setBusy(false);
    }
  }, [cancelled]);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void finish();
  }, [finish]);
  return (
    <main className={styles.page}>
      <section className={styles.result}>
        {busy ? (
          <span role="status">
            {cancelled ? "Recording cancellation" : "Confirming contribution"}
          </span>
        ) : error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={() => void finish()}>Retry</button>
          </>
        ) : (
          <>
            {result?.status === "COMPLETED" ? (
              <Check size={25} />
            ) : (
              <X size={25} />
            )}
            <h1>
              {result?.status === "COMPLETED"
                ? "Contribution confirmed"
                : "Contribution cancelled"}
            </h1>
            {result?.projectName && <span>{result.projectName}</span>}
            {result?.amount && <strong>USD {result.amount}</strong>}
            <small>Sandbox · No real money</small>
          </>
        )}
        <Link href="/">Return to BetterSide</Link>
      </section>
    </main>
  );
}
