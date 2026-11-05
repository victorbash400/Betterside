import LoadingRegion from "../controls/LoadingRegion";
import styles from "./ChatDrawer.module.css";

export default function ChatDrawerLoading() {
  return (
    <aside className={styles.drawer} aria-label="Chat">
      <LoadingRegion label="Loading chat" />
    </aside>
  );
}
