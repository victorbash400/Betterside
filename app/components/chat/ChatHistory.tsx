import { SquarePen } from "lucide-react";
import type { ChatSession } from "../../state/useChatSessions";
import ChatHistoryRow from "./ChatHistoryRow";
import styles from "./ChatHistory.module.css";
export default function ChatHistory({
  items,
  activeId,
  onNew,
  onSelect,
  onDelete,
}: {
  items: ChatSession[];
  activeId: string;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <nav className={styles.history} aria-label="Chats">
      <button type="button" className={styles.create} onClick={onNew}>
        <SquarePen size={16} />
        New chat
      </button>
      <div className={styles.items}>
        {items.toReversed().map((item) => (
          <ChatHistoryRow
            key={item.id}
            title={item.title}
            selected={item.id === activeId}
            onSelect={() => onSelect(item.id)}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </div>
    </nav>
  );
}
