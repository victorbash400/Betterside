import {
  PanelLeft,
  ArrowLeft,
  House,
  ChevronRight,
  UsersRound,
} from "lucide-react";
import IconButton from "../controls/IconButton";
import type { View } from "../../lib/types";
import styles from "./WorkspaceHeader.module.css";
export default function WorkspaceHeader({
  view,
  interestName,
  onMenu,
  onChat,
  chatOpen,
  onHome,
}: {
  view: View;
  interestName?: string;
  onMenu: () => void;
  onChat: () => void;
  chatOpen: boolean;
  onHome: () => void;
}) {
  return (
    <header className={styles.toolbar}>
      <div className={styles.navigation}>
        <div className={styles.mobile}>
          <IconButton label="Open navigation" onClick={onMenu}>
            <PanelLeft />
          </IconButton>
        </div>
        <IconButton className={styles.back} label="Home" onClick={onHome}>
          <ArrowLeft />
        </IconButton>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <button onClick={onHome}>Home</button>
          <ChevronRight size={12} />
          <span>{view === "Explore" ? "Map" : (interestName ?? view)}</span>
        </nav>
      </div>
      <div className={styles.actions}>
        <div className={styles.group}>
          <IconButton
            className={styles.chat}
            label="Chat"
            selected={chatOpen}
            onClick={onChat}
          >
            <UsersRound />
            <span>Chat</span>
          </IconButton>
        </div>
      </div>
    </header>
  );
}
