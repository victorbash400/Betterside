"use client";
import { MessageCircle, SquarePen, X } from "lucide-react";
import IconButton from "../controls/IconButton";
import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";
import type { Analysis } from "../../lib/analysis";
import type { Issue } from "../../lib/types";
import { useConversation } from "../../state/useConversation";
import styles from "./ChatDrawer.module.css";
export default function ChatDrawer({
  selected,
  onClose,
  model,
  onAnalysis,
}: {
  selected?: Issue;
  onClose: () => void;
  model: "fast" | "reasoning";
  onAnalysis: (analysis: Analysis) => void;
}) {
  const {
    draft,
    setDraft,
    messages,
    sendMessage,
    stop,
    error,
    regenerate,
    setMessages,
    storageError,
    busy,
  } = useConversation({ areaId: selected?.id, model, onAnalysis });
  return (
    <aside className={styles.drawer} aria-label="BetterSide chat">
      <header>
        <MessageCircle size={16} />
        <span>Ask BetterSide</span>
        <IconButton
          label="New conversation"
          onClick={() => {
            void stop();
            setMessages([]);
            setDraft("");
          }}
        >
          <SquarePen />
        </IconButton>
        <IconButton label="Close chat" onClick={onClose}>
          <X />
        </IconButton>
      </header>
      {messages.length === 0 ? (
        <div className={styles.starters}>
          {[
            "Which water projects need funding?",
            "Compare the available projects",
            "What do we know about Sudan?",
          ].map((text) => (
            <button
              key={text}
              disabled={busy}
              onClick={() => void sendMessage({ text })}
            >
              {text}
            </button>
          ))}
        </div>
      ) : null}
      <MessageList messages={messages} busy={busy} />
      {(error || storageError) && (
        <div className={styles.error} role="alert">
          <span>{storageError || error?.message || "Chat failed."}</span>
          {error && <button onClick={() => void regenerate()}>Retry</button>}
        </div>
      )}
      <ChatComposer
        draft={draft}
        onDraft={setDraft}
        busy={busy}
        location={selected?.location}
        onStop={() => void stop()}
        onSend={() => {
          if (!draft.trim()) return;
          void sendMessage({ text: draft.trim() });
          setDraft("");
        }}
      />
    </aside>
  );
}
