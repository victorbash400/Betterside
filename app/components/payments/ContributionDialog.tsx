import { useCheckoutGoal } from "../../state/useCheckoutGoal";
import { goalMatchesProject } from "../../lib/profile";
import { useState } from "react";
import { Check, HeartHandshake, LockKeyhole } from "lucide-react";
import Dialog from "../controls/Dialog";
import ContributionAmount from "./ContributionAmount";
import PaymentProjectPicker from "./PaymentProjectPicker";
import PayPalCheckoutButton, {
  type PaymentCompletion,
} from "./PayPalCheckoutButton";
import { amountInCents, decimalAmount } from "../../lib/payment";
import type { CheckoutInput } from "../../lib/chatWorkspace";
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
  const goalState = useCheckoutGoal(initial.goalId);
  const projectRecords = initial.goalId
    ? goalState.goal
      ? records.filter((record) => goalMatchesProject(goalState.goal!, record))
      : []
    : records;
  const projects = Array.from(
    new Map(
      projectRecords.flatMap((record) =>
        record.project ? [[record.project.id, record.project] as const] : [],
      ),
    ).values(),
  );
  const [projectId, setProjectId] = useState(initial.projectId ?? "");
  const [amount, setAmount] = useState(initial.amount ?? "25");
  const [choosing, setChoosing] = useState(!initial.projectId);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PaymentCompletion>();
  let total = "—",
    amountError = "";
  try {
    total = decimalAmount(amountInCents(amount));
  } catch (failure) {
    amountError =
      failure instanceof Error ? failure.message : "Enter a valid amount.";
  }
  const valid =
    projects.some((project) => project.id === projectId) &&
    !amountError &&
    !goalState.loading &&
    !goalState.error;
  return (
    <Dialog
      title="PayPal checkout"
      size="payment"
      onClose={() => {
        if (!busy) onClose();
      }}
      footer={
        result ? (
          <button className={styles.done} onClick={onClose}>
            Done
          </button>
        ) : (
          <div className={styles.footer}>
            <div className={styles.total}>
              <span>Total</span>
              <strong>
                <small>USD</small> {total}
              </strong>
            </div>
            <PayPalCheckoutButton
              projectId={projectId}
              goalId={initial.goalId}
              amount={amount}
              disabled={!valid || busy}
              onBusy={setBusy}
              onComplete={setResult}
            />
            <span className={styles.security}>
              <LockKeyhole size={12} aria-hidden="true" />
              Sandbox · No real money
            </span>
          </div>
        )
      }
    >
      {result ? (
        <div className={styles.confirmation}>
          <Check size={24} aria-hidden="true" />
          <strong>Contribution confirmed</strong>
          <span>{result.projectName}</span>
          <b>USD {result.amount}</b>
        </div>
      ) : (
        <div className={styles.sheet}>
          <div className={styles.merchant}>
            <HeartHandshake size={24} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <strong>BetterSide</strong>
              <span>Sandbox contribution</span>
            </div>
          </div>
          {goalState.goal && (
            <span className={styles.status}>
              Goal · {goalState.goal.category} ·{" "}
              {goalState.goal.period === "monthly" ? "Monthly" : "One-time"}
            </span>
          )}
          {goalState.loading && <span role="status">Loading goal</span>}
          {goalState.error && (
            <span className={styles.error} role="alert">
              {goalState.error}
            </span>
          )}
          <PaymentProjectPicker
            projects={projects}
            selectedId={projectId}
            open={choosing}
            disabled={busy}
            onToggle={() => setChoosing(!choosing)}
            onSelect={(id) => {
              setProjectId(id);
              setChoosing(false);
            }}
          />
          <ContributionAmount
            amount={amount}
            disabled={busy}
            onChange={setAmount}
          />
          {amountError && (
            <span role="alert" className={styles.error}>
              {amountError}
            </span>
          )}
          {busy && (
            <span role="status" className={styles.status}>
              Complete checkout in PayPal
            </span>
          )}
        </div>
      )}
    </Dialog>
  );
}
