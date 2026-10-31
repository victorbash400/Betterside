import { useState } from "react";
import {
  contributionGoalSchema,
  goalCategories,
  type ContributionGoal,
} from "../../lib/profile";
import SettingsPicker from "../settings/SettingsPicker";
import styles from "./GoalEditor.module.css";
export default function GoalEditor({
  goal,
  busy,
  onSave,
  onClose,
}: {
  goal?: ContributionGoal;
  busy: boolean;
  onSave: (goal: ContributionGoal) => Promise<void>;
  onClose: () => void;
}) {
  const [category, setCategory] = useState(goal?.category ?? "All causes");
  const [amount, setAmount] = useState(
    goal ? String(goal.targetCents / 100) : "100",
  );
  const [period, setPeriod] = useState<ContributionGoal["period"]>(
    goal?.period ?? "monthly",
  );
  const [error, setError] = useState("");
  async function submit() {
    setError("");
    try {
      const parts = amount.split(".");
      if (
        parts.length > 2 ||
        parts[0].length === 0 ||
        parts.some(
          (part) =>
            part.length === 0 ||
            !Array.from(part).every((char) => char >= "0" && char <= "9"),
        ) ||
        (parts[1]?.length ?? 0) > 2
      )
        throw new Error("Enter a valid USD target.");
      const targetCents =
        Number(parts[0]) * 100 + Number((parts[1] ?? "").padEnd(2, "0"));
      const next = contributionGoalSchema.parse({
        id: goal?.id ?? crypto.randomUUID(),
        category,
        period,
        targetCents,
        createdAt: goal?.createdAt ?? new Date().toISOString(),
      });
      await onSave(next);
      onClose();
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name !== "ZodError"
          ? failure.message
          : "Enter a target from $1 to $1,000,000.",
      );
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
      <label>Cause</label>
      {goal ? (
        <strong>{goal.category}</strong>
      ) : (
        <SettingsPicker
          label="Goal cause"
          disabled={busy}
          value={category}
          options={goalCategories.map((value) => ({ value, label: value }))}
          onChange={(value) =>
            setCategory(contributionGoalSchema.shape.category.parse(value))
          }
          width={240}
        />
      )}
      <label htmlFor="goal-target">Target · USD</label>
      <input
        id="goal-target"
        aria-label="Goal target in USD"
        type="number"
        min="1"
        max="1000000"
        step="0.01"
        required
        disabled={busy}
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <SettingsPicker
        label="Goal period"
        disabled={busy}
        value={period}
        options={[
          { value: "monthly", label: "Monthly" },
          { value: "once", label: "One-time" },
        ]}
        onChange={(value) =>
          setPeriod(contributionGoalSchema.shape.period.parse(value))
        }
      />
      {error && <span role="alert">{error}</span>}
      <div className={styles.actions}>
        <button type="button" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={busy}>
          {busy ? "Saving" : "Save goal"}
        </button>
      </div>
    </form>
  );
}
