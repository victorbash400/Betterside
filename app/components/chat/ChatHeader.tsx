import { PanelLeft, PanelLeftClose, SquarePen, X } from "lucide-react";
import IconButton from "../controls/IconButton";
import ActionMenu from "../controls/ActionMenu";
import styles from "./ChatHeader.module.css";
export default function ChatHeader({
  historyOpen,
  onHistory,
  onNew,
  onClose,
  onRename,
  onDelete,
}: {
  historyOpen: boolean;
  onHistory: () => void;
  onNew: () => void;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const Icon = historyOpen ? PanelLeftClose : PanelLeft;
  return (
    <header className={styles.header}>
      <div className={styles.chatControls}>
        <IconButton
          label={historyOpen ? "Close chats" : "Chats"}
          onClick={onHistory}
        >
          <Icon />
        </IconButton>
        <span>Chat</span>
        <IconButton label="New chat" title="New chat" onClick={onNew}>
          <SquarePen />
        </IconButton>
        <ActionMenu
          label="Chat actions"
          onRename={onRename}
          onDelete={onDelete}
        />
        <IconButton label="Close chat" onClick={onClose}>
          <X />
        </IconButton>
      </div>
    </header>
  );
}
