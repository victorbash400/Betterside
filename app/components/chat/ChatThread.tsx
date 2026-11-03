import LoadingRegion from "../controls/LoadingRegion";
import type {
  ChatWorkspaceActions,
  WorkspaceChatContext,
} from "../../lib/chatWorkspace";
import { useEffect, useMemo, useRef } from "react";
import { useConversation } from "../../state/useConversation";
import ChatComposer from "./ChatComposer";
import MessageList from "./MessageList";
import type { Analysis } from "../../lib/analysis";
import type { MapItem as Issue } from "../../lib/types";
import styles from "./ChatDrawer.module.css";
export default function ChatThread({
  actions,
  context,
  conversationId,
  selected,
  issues,
  model,
  onAnalysis,
  onSelect,
  onTitle,
}: {
  actions: ChatWorkspaceActions;
  context: WorkspaceChatContext;
  conversationId: string;
  selected?: Issue;
  issues: Issue[];
  model: "fast" | "reasoning";
  onAnalysis: (analysis: Analysis) => void;
  onSelect: (issue: Issue) => void;
  onTitle: (title: string) => void;
}) {
  const recordIds = useMemo(() => issues.map((item) => item.id), [issues]);
  const chat = useConversation({
      conversationId,
      recordIds,
      areaId: selected?.id,
      model,
      onAnalysis,
      actions,
      context,
    }),
    thread = useRef<HTMLDivElement>(null);
  useEffect(() => {
    thread.current?.querySelector("textarea")?.focus();
  }, []);
  return (
    <div ref={thread} className={styles.thread}>
      {!chat.hydrated && !chat.storageError ? (
        <LoadingRegion label="Loading conversation" />
      ) : (
        <MessageList
          messages={chat.messages}
          busy={chat.busy}
          onSelect={onSelect}
          actions={actions}
        onApprove={(id, approved) => { void chat.addToolApprovalResponse({ id, approved }); }}
          onMessage={(text, requestedAction) => {
            if (!chat.busy) void chat.sendMessage({ text }, { body: requestedAction ? { requestedAction } : undefined });
          }}
        />
      )}
      {(chat.error || chat.storageError) && (
        <div className={styles.error} role="alert">
          {chat.storageError || chat.error?.message}
          {chat.error && (
            <button onClick={() => void chat.regenerate()}>Retry</button>
          )}
        </div>
      )}
      <ChatComposer
        draft={chat.draft}
        onDraft={chat.setDraft}
        busy={chat.busy}
        onStop={() => void chat.stop()}
        location={selected?.location}
        issues={issues}
        selected={selected}
        onSelect={onSelect}
        onSend={() => {
          if (!chat.draft.trim()) return;
          const text = chat.draft.trim();
          if (chat.messages.length === 0) onTitle(text.slice(0, 60));
          void chat.sendMessage({ text });
          chat.setDraft("");
        }}
      />
    </div>
  );
}
