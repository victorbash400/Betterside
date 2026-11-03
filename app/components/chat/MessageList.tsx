import type { ChatMessageAction } from "../../lib/chatActions";
import { hasInlineResult } from "../../lib/chatRenderPolicy";
import { goalsResultSchema } from "../../lib/chatGoals";
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
      {messages.map((message) => {
        const goalTools = [
          "tool-list_goals",
          "tool-create_goal",
          "tool-update_goal",
          "tool-manage_goal",
        ];
        const latestGoal = message.parts.findLastIndex(
          (part) =>
            goalTools.includes(part.type) &&
            "state" in part &&
            part.state === "output-available",
        );
        return (
          <article
            key={message.id}
            className={message.role === "user" ? styles.user : styles.assistant}
          >
            {message.parts.map((part, index) =>
              (index < latestGoal && goalTools.includes(part.type)) ||
              (hasInlineResult(message.parts) && part.type === "text") ? null :
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
                  onApprove={onApprove}
                  goalNames={goalNames}
                />
              ),
            )}
          </article>
        );
      })}
      {busy && <ChatLoadingIndicator />}
    </div>
  );
}
