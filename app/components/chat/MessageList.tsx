import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import MessageText from "./MessageText";
import styles from "./MessageList.module.css";
export default function MessageList({
  messages,
  busy,
}: {
  messages: UIMessage[];
  busy: boolean;
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
            ) : part.type.startsWith("tool-") ? (
              <span key={index} className={styles.tool}>
                Analysis
              </span>
            ) : null,
          )}
        </article>
      ))}
      {busy && (
        <span className={styles.activity} role="status">
          Thinking
        </span>
      )}
    </div>
  );
}
