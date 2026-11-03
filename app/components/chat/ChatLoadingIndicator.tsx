import styles from "./ChatLoadingIndicator.module.css";

export default function ChatLoadingIndicator({
  label = "Waiting for answer",
}: {
  label?: string;
}) {
  return (
    <span className={styles.indicator} role="status" aria-label={label}>
      <span />
    </span>
  );
}
