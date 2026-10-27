import { Menu, MessageCircle, SlidersHorizontal } from "lucide-react";
import IconButton from "../controls/IconButton";
import type { View } from "../../lib/types";
import styles from "./WorkspaceHeader.module.css";
export default function WorkspaceHeader({
  view,
  onMenu,
  onChat,
  onSettings,
  chatOpen,
}: {
  view: View;
  onMenu: () => void;
  onChat: () => void;
  onSettings: () => void;
  chatOpen: boolean;
}) {
  return (
    <header className={styles.header}>
      <IconButton
        label="Open navigation"
        className={styles.menu}
        onClick={onMenu}
      >
        <Menu />
      </IconButton>
      <span>{view}</span>
      <div className={styles.actions}>
        <IconButton label="Map settings" onClick={onSettings}>
          <SlidersHorizontal />
        </IconButton>
        <IconButton
          label={chatOpen ? "Close chat" : "Open chat"}
          selected={chatOpen}
          onClick={onChat}
        >
          <MessageCircle />
        </IconButton>
      </div>
    </header>
  );
}
