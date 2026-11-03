import SettingsInlineButton from "../settings/SettingsInlineButton";
import LoadingSpinner from "../controls/LoadingSpinner";
import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";
import {
  paymentStatusSchema,
  type paymentResultSchema,
} from "../../lib/chatWorkspace";
import styles from "./ChatResult.module.css";
export default function ChatPaymentCard({
  order,
}: {
  order: z.infer<typeof paymentResultSchema>;
}) {
  const requestVersion = useRef(0);
  const [payment, setPayment] = useState<z.infer<typeof paymentStatusSchema>>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      const version = ++requestVersion.current;
      setBusy(true);
      setError("");
      try {
        const response = await fetch(
          `/api/paypal/orders?${new URLSearchParams({ orderId: order.id })}`,
          { cache: "no-store", signal },
        );
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "Order status unavailable.");
        const next = paymentStatusSchema.parse(body);
        if (next.id !== order.id || next.amount !== order.amount)
          throw new Error("Order details do not match.");
        if (!signal?.aborted && version === requestVersion.current)
          setPayment(next);
      } catch (failure) {
        if (!signal?.aborted && version === requestVersion.current)
          setError(
            failure instanceof Error
              ? failure.message
              : "Order status unavailable.",
          );
      } finally {
        if (!signal?.aborted && version === requestVersion.current)
          setBusy(false);
      }
    },
    [order.id, order.amount],
  );
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const focus = () => {
      void refresh(controller.signal);
    };
    window.addEventListener("focus", focus);
    return () => {
      controller.abort();
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  return (
    <section className={styles.result} aria-label="PayPal sandbox checkout">
      <div className={styles.heading}>
        <strong>{payment?.projectName ?? order.projectName}</strong>
        <span>USD {order.amount}</span>
      </div>
      <small>BetterSide Sandbox · No real money</small>
      {payment && (
        <span role="status">
          {
            {
              CREATED: "Awaiting approval",
              COMPLETED: "Completed",
              CANCELLED: "Cancelled",
              FAILED: "Failed",
              REFUNDED: "Refunded",
            }[payment.status]
          }
        </span>
      )}
      {error && (
        <span role="alert" className={styles.error}>
          {error}
        </span>
      )}
      <div className={styles.actions}>
        {payment?.status === "CREATED" && !error && (
          <a href={order.approvalUrl} target="_blank" rel="noopener noreferrer">
            Continue to PayPal
          </a>
        )}
        <SettingsInlineButton
          aria-label="Check payment"
          aria-busy={busy}
          onClick={() => void refresh()}
          disabled={busy}
        >
          {busy ? (
            <LoadingSpinner size={24} label="Checking payment" />
          ) : (
            "Check payment"
          )}
        </SettingsInlineButton>
      </div>
    </section>
  );
}
