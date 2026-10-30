import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import type { ChatWorkspaceActions } from "../../lib/chatWorkspace";
import type { MapItem } from "../../lib/types";
import ChatToolResult from "./ChatToolResult";
import ChatLoadingIndicator from "./ChatLoadingIndicator";
import MessageText from "./MessageText";
import styles from "./MessageList.module.css";
export default function MessageList({
  messages,
  busy,
  onSelect,
  onMessage,
  actions,
}: {
  messages: UIMessage[];
  busy: boolean;
  onSelect: (record: MapItem) => void;
  onMessage: (text: string) => void;
  actions: ChatWorkspaceActions;
}) {
  const scroll = useRef<HTMLDivElement>(null),
    following = useRef(true);
  useEffect(() => {
    if (following.current && scroll.current)
      scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages, busy]);
  return (
    <div
      className={styles.list}
      ref={scroll}
      role="log"
      aria-label="Conversation"
      onScroll={() => {
        const element = scroll.current;
        if (element)
          following.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            80;
      }}
    >
      {messages.map((message) => (
        <article
          key={message.id}
          className={message.role === "user" ? styles.user : styles.assistant}
        >
          {message.parts.map((part, index) =>
            part.type === "text" ? (
              <MessageText key={index} text={part.text} />
            ) : (
              <ChatToolResult
                key={index}
                part={part}
                onSelect={onSelect}
                onMessage={onMessage}
                actions={actions}
                busy={busy}
              />
            ),
          )}
        </article>
      ))}
      {busy && <ChatLoadingIndicator />}
    </div>
  );
}
