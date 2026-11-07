import { useState } from "react";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsRow from "../settings/SettingsRow";
import SettingsPicker from "../settings/SettingsPicker";
import LoadingSpinner from "../controls/LoadingSpinner";
import { useAccount } from "../../state/AccountContext";
import { pendingApprovalPath, subscriptionSchema } from "../../lib/paypalSubscription";
import { subscriptionProjects } from "../../lib/subscriptionSetup";
import { amountInCents, decimalAmount } from "../../lib/payment";
import type { ContributionGoal } from "../../lib/profile";
import type { MapItem } from "../../lib/types";
import styles from "./GoalEditor.module.css";

export default function GoalEditor({
  goal,
  projects,
  onClose,
  onPrepared,
}: {
  goal?: ContributionGoal;
  projects: MapItem[];
  onClose: () => void;
  onPrepared: () => void;
}) {
  const { fetch } = useAccount();
  const [goalId] = useState(() => goal?.id ?? crypto.randomUUID());
  const causes = Array.from(
    new Set(projects.filter((item) => item.project).map((item) => item.kind)),
  );
  const [cause, setCause] = useState<string>(
    goal && causes.includes(goal.category as MapItem["kind"])
      ? goal.category
      : "",
  );
  const matching = subscriptionProjects(projects, cause);
  const [selected, setSelected] = useState(goal?.projectId ?? "");
  const project = matching.find((item) => item.project?.id === selected);
  const [amount, setAmount] = useState(
    goal ? String(goal.targetCents / 100) : "25",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (!project?.project) throw new Error("Choose a payment recipient.");
      const validatedAmount = decimalAmount(amountInCents(amount));
      const response = await fetch("/api/paypal/subscriptions/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId,
          category: cause,
          projectId: project.project.id,
          amount: validatedAmount,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "PayPal setup failed. Retry.");
      const record = subscriptionSchema.parse(body.subscription);
      if (record.approvalUrl) window.location.assign(pendingApprovalPath(record.goalId));
      else {
        onPrepared();
        onClose();
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "PayPal setup failed. Retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <SettingsGroup>
        <SettingsRow label="Cause">
          <SettingsPicker
            label="Subscription cause"
            width="100%"
            value={cause}
            disabled={busy || !causes.length}
            options={[
              { value: "", label: "Choose a cause" },
              ...causes.map((value) => ({ value, label: value })),
            ]}
            onChange={(value) => {
              setCause(value);
              setSelected("");
            }}
          />
        </SettingsRow>
        <SettingsRow label="Project">
          <SettingsPicker
            label="Subscription project"
            width="100%"
            value={project?.project?.id ?? ""}
            disabled={busy || !matching.length}
            options={[
              { value: "", label: "Choose a project" },
              ...matching.flatMap((item) =>
                item.project
                  ? [
                      {
                        value: item.project.id,
                        label: `${item.project.name} · ${item.country}`,
                      },
                    ]
                  : [],
              ),
            ]}
            onChange={setSelected}
          />
        </SettingsRow>
        {project?.project && (
          <SettingsRow label="Recipient">
            <span>{project.project.organisation}</span>
          </SettingsRow>
        )}
        <SettingsRow label="Monthly · USD">
          <input
            className={styles.input}
            aria-label="Monthly amount in USD"
            inputMode="decimal"
            required
            value={amount}
            disabled={busy}
            onChange={(event) => setAmount(event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label="Payment">
          <span>PayPal · Sandbox</span>
        </SettingsRow>
      </SettingsGroup>
      {error && <span role="alert">{error}</span>}
      {!projects.length && (
        <span role="alert">No payment recipients available.</span>
      )}
      <div className={styles.actions}>
        <button type="button" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={busy || !project} aria-busy={busy}>
          {busy ? (
            <LoadingSpinner size={18} label="Preparing PayPal approval" />
          ) : (
            "Set up with PayPal"
          )}
        </button>
      </div>
    </form>
  );
}
