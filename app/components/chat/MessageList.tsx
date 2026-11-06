import type { ChatMessageAction } from "../../lib/chatActions";
import { showThinkingIndicator, visibleChatParts } from "../../lib/chatRenderPolicy";
import { goalsResultSchema } from "../../lib/chatGoals";
import { Fragment, useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import type { ChatWorkspaceActions } from "../../lib/chatWorkspace";
import type { MapItem } from "../../lib/types";
import ToolCallIndicator from "./ToolCallIndicator";
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
  onApprove,
}: {
  messages: UIMessage[];
  busy: boolean;
  onSelect: (record: MapItem) => void;
  onMessage: ChatMessageAction;
  actions: ChatWorkspaceActions;
  onApprove: (id: string, approved: boolean) => void;
}) {
  const scroll = useRef<HTMLDivElement>(null),
    following = useRef(true);
  useEffect(() => {
    if (following.current && scroll.current)
      scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages, busy]);
  const goalNames = new Map<string, string>();
  for (const message of messages) for (const part of message.parts) {
    if (!("output" in part)) continue;
    const parsed = goalsResultSchema.safeParse(part.output);
    if (parsed.success) for (const goal of parsed.data.goals) goalNames.set(goal.id, goal.targetText || goal.category);
  }
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
          {visibleChatParts(message.parts).map(({ part, index, showResult }) =>
            part.type === "text" ? (
              <MessageText key={index} text={part.text} />
            ) : (
              <Fragment key={index}>
                <ToolCallIndicator part={part} busy={busy && message === messages.at(-1)} />
                {showResult && <ChatToolResult
                  part={part}
                  onSelect={onSelect}
                  onMessage={onMessage}
                  actions={actions}
                  busy={busy}
                  onApprove={onApprove}
                  goalNames={goalNames}
                />}
              </Fragment>
            ),
          )}
        </article>
      ))}
      {showThinkingIndicator(messages, busy) && <ChatLoadingIndicator />}
    </div>
  );
}
