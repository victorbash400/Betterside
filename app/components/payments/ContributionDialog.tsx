import { useId, useState } from "react";
import Dialog from "../controls/Dialog";
import ChatPaymentCard from "../chat/ChatPaymentCard";
import {
  paymentResultSchema,
  type CheckoutInput,
} from "../../lib/chatWorkspace";
import type { z } from "zod";
import type { MapItem } from "../../lib/types";
import styles from "./ContributionDialog.module.css";
export default function ContributionDialog({
  records,
  initial,
  onClose,
}: {
  records: MapItem[];
  initial: CheckoutInput;
  onClose: () => void;
}) {
  const formId = useId();
  const projects = Array.from(
    new Map(
      records.flatMap((record) =>
        record.project ? [[record.project.id, record.project] as const] : [],
      ),
    ).values(),
  );
  const [projectId, setProjectId] = useState(initial.projectId ?? "");
  const [amount, setAmount] = useState(initial.amount ?? "25");
  const [choosing, setChoosing] = useState(!initial.projectId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<z.infer<typeof paymentResultSchema>>();
  const project = projects.find((item) => item.id === projectId);
  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/paypal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, amount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Checkout failed.");
      setOrder(paymentResultSchema.parse(data));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title="PayPal checkout"
      size="profile"
      onClose={onClose}
      footer={
        !order && (
          <button
            type="submit"
            form={formId}
            className={styles.checkout}
            disabled={busy || !project}
          >
            {busy ? "Creating order" : "Create sandbox order"}
          </button>
        )
      }
    >
      {order ? (
        <ChatPaymentCard order={order} />
      ) : (
        <form
          id={formId}
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void checkout();
          }}
        >
          <button
            type="button"
            className={styles.project}
            aria-expanded={choosing}
            onClick={() => setChoosing(!choosing)}
          >
            <span>Project</span>
            <strong>{project?.name ?? "Choose project"}</strong>
          </button>
          {choosing && (
            <div
              className={styles.projects}
              role="group"
              aria-label="Demonstration projects"
            >
              {projects.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={projectId === item.id}
                  onClick={() => {
                    setProjectId(item.id);
                    setChoosing(false);
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
          <div
            className={styles.amounts}
            role="group"
            aria-label="Contribution amount"
          >
            {["10", "25", "50", "100"].map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={amount === value}
                onClick={() => setAmount(value)}
              >
                ${value}
              </button>
            ))}
          </div>
          <label className={styles.custom}>
            <span>USD</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              max="10000"
              step="0.01"
              required
              aria-label="Custom contribution amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <span className={styles.test}>
            BetterSide Sandbox · No real money
          </span>
          {error && (
            <span className={styles.error} role="alert">
              {error}
            </span>
          )}
        </form>
      )}
    </Dialog>
  );
}
