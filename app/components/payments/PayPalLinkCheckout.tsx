import { useCallback, useEffect, useState } from "react";
import {
  paymentResultSchema,
  paymentStatusSchema,
} from "../../lib/chatWorkspace";
import { amountInCents, decimalAmount } from "../../lib/payment";
import styles from "./PayPalLinkCheckout.module.css";
export default function PayPalLinkCheckout({
  projectId,
  goalId,
  amount,
  disabled,
  onBusy,
}: {
  projectId: string;
  goalId?: string;
  amount: string;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const [error, setError] = useState("");
  const [order, setOrder] = useState<{
    id: string;
    amount: string;
    status: string;
  }>();
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (!order?.id) return;
      try {
        const response = await fetch(
          `/api/paypal/orders?${new URLSearchParams({ orderId: order.id })}`,
          { cache: "no-store", signal },
        );
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "Order status unavailable.");
        const payment = paymentStatusSchema.parse(body);
        if (payment.id !== order.id || payment.amount !== order.amount)
          throw new Error("Order details do not match.");
        if (!signal?.aborted)
          setOrder({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
          });
      } catch (failure) {
        if (!signal?.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : "Order status unavailable.",
          );
      }
    },
    [order?.id, order?.amount, fetch],
  );
  useEffect(() => {
    const controller = new AbortController();
    const focus = () => {
      void refresh(controller.signal);
    };
    window.addEventListener("focus", focus);
    return () => {
      controller.abort();
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  async function open() {
    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      setError("Allow the PayPal popup and retry.");
      return;
    }
    popup.opener = null;
    onBusy(true);
    setError("");
    setOrder(undefined);
    try {
      const response = await fetch("/api/paypal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          goalId,
          amount: decimalAmount(amountInCents(amount)),
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "PayPal checkout failed.");
      const order = paymentResultSchema.parse(body);
      popup.location.replace(order.approvalUrl);
      setOrder({ id: order.id, amount: order.amount, status: "CREATED" });
    } catch (failure) {
      popup.close();
      setError(
        failure instanceof Error ? failure.message : "PayPal checkout failed.",
      );
    } finally {
      onBusy(false);
    }
  }
  return (
    <div className={styles.checkout}>
      <button type="button" disabled={disabled} onClick={() => void open()}>
        Continue in PayPal
      </button>
      {order && (
        <span role="status">
          USD {order.amount} ·{" "}
          {
            {
              CREATED: "Awaiting PayPal approval",
              COMPLETED: "Completed",
              CANCELLED: "Payment cancelled",
              FAILED: "Payment failed",
              REFUNDED: "Refunded",
            }[order.status]
          }
        </span>
      )}
      {order && (
        <button
          className={styles.check}
          type="button"
          onClick={() => void refresh()}
        >
          Check payment
        </button>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
