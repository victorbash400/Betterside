"use client";
import LoadingRegion from "../controls/LoadingRegion";
import type {
  ChatWorkspaceActions,
  WorkspaceChatContext,
} from "../../lib/chatWorkspace";
import { useState } from "react";
import { useChatSessions } from "../../state/useChatSessions";
import ChatHeader from "./ChatHeader";
import ChatHistory from "./ChatHistory";
import ChatRenameDialog from "./ChatRenameDialog";
import ChatThread from "./ChatThread";
import type { Analysis } from "../../lib/analysis";
import type { MapItem as Issue } from "../../lib/types";
import styles from "./ChatDrawer.module.css";
export default function ChatDrawer({
  actions,
  context,
  selected,
  issues,
  model,
  onAnalysis,
  onSelect,
  onClose,
}: {
  actions: ChatWorkspaceActions;
  context: WorkspaceChatContext;
  selected?: Issue;
  issues: Issue[];
  model: "fast" | "reasoning";
  onAnalysis: (analysis: Analysis) => void;
  onSelect: (issue: Issue) => void;
  onClose: () => void;
}) {
  const sessions = useChatSessions(),
    [history, setHistory] = useState(false),
    [renaming, setRenaming] = useState(false);
  function newChat() {
    sessions.create();
    setHistory(false);
  }
  return (
    <aside
      className={styles.drawer}
      aria-label="Chat"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          if (history) setHistory(false);
          else onClose();
        }
      }}
    >
      <ChatHeader
        historyOpen={history}
        onHistory={() => setHistory((value) => !value)}
        onNew={newChat}
        onClose={onClose}
        onRename={() => setRenaming(true)}
        onDelete={() => sessions.remove(sessions.activeId)}
      />
      <div className={styles.body}>
        {!sessions.ready && !sessions.error && (
          <LoadingRegion label="Loading chats" />
        )}
        {sessions.ready && (
          <ChatThread
            key={sessions.activeId}
            conversationId={sessions.activeId}
            actions={actions}
            context={context}
            selected={selected}
            issues={issues}
            model={model}
            onAnalysis={onAnalysis}
            onSelect={onSelect}
            onTitle={(title) => sessions.rename(sessions.activeId, title)}
          />
        )}
        {sessions.error && (
          <p className={styles.error} role="alert">
            {sessions.error}
          </p>
        )}
        {history && (
          <>
            <button
              className={styles.scrim}
              aria-label="Close chats"
              onClick={() => setHistory(false)}
            />
            <ChatHistory
              items={sessions.items}
              activeId={sessions.activeId}
              onNew={newChat}
              onSelect={(id) => {
                sessions.select(id);
                setHistory(false);
              }}
              onDelete={sessions.remove}
            />
          </>
        )}
      </div>
      {renaming && (
        <ChatRenameDialog
          title={
            sessions.items.find((item) => item.id === sessions.activeId)
              ?.title ?? ""
          }
          onSubmit={(title) => {
            sessions.rename(sessions.activeId, title);
            setRenaming(false);
          }}
          onClose={() => setRenaming(false)}
        />
      )}
    </aside>
  );
}
