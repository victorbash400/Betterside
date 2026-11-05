import LoadingRegion from "./components/controls/LoadingRegion";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.page}>
      <LoadingRegion label="Loading page" />
    </main>
  );
}
