import styles from "./LogoLoading.module.css";

export default function LogoLoading({
  size = 64,
  label = "Loading",
}: {
  size?: number;
  label?: string;
}) {
  return (
    <span
      className={styles.indicator}
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    />
  );
}
