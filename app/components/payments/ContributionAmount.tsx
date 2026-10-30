import { useId } from "react";
import styles from "./ContributionAmount.module.css";
export default function ContributionAmount({
  amount,
  disabled,
  onChange,
}: {
  amount: string;
  disabled: boolean;
  onChange: (amount: string) => void;
}) {
  const id = useId();
  return (
    <div className={styles.amount}>
      <label htmlFor={id}>Contribution</label>
      <div className={styles.value}>
        <span>USD</span>
        <input
          id={id}
          aria-label="Contribution amount"
          type="number"
          inputMode="decimal"
          min="1"
          max="10000"
          step="0.01"
          required
          disabled={disabled}
          value={amount}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div
        className={styles.presets}
        role="group"
        aria-label="Contribution presets"
      >
        {["10", "25", "50", "100"].map((value) => (
          <button
            type="button"
            key={value}
            disabled={disabled}
            aria-pressed={Number(amount) === Number(value)}
            onClick={() => onChange(value)}
          >
            ${value}
          </button>
        ))}
      </div>
    </div>
  );
}
