import { ArrowUp, Mic, Plus, Square } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import IconButton from "../controls/IconButton";
import ComposerLocation from "./ComposerLocation";
import ReferencePicker from "./ReferencePicker";
import useVoiceDraft from "./useVoiceDraft";
import VoiceRecording from "./VoiceRecording";
import type { MapItem as Issue } from "../../lib/types";
import styles from "./ChatComposer.module.css";
export default function ChatComposer({
  draft,
  onDraft,
  onSend,
  busy,
  onStop,
  location,
  issues,
  selected,
  onSelect,
}: {
  draft: string;
  onDraft: (draft: string) => void;
  onSend: () => void;
  busy: boolean;
  onStop: () => void;
  location?: string;
  issues: Issue[];
  selected?: Issue;
  onSelect: (issue: Issue) => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null),
    [picking, setPicking] = useState(false);
  const voice = useVoiceDraft((text) => {
    onDraft(draft ? `${draft} ${text}` : text);
    queueMicrotask(() => input.current?.focus());
    return true;
  });
  const dictating = voice.phase !== "idle";
  useLayoutEffect(() => {
    const field = input.current;
    if (!field) return;
    function resize() {
      if (!field) return;
      field.style.height = "auto";
      field.style.height = `${Math.min(field.scrollHeight, 140)}px`;
    }
    resize();
    let width = field.getBoundingClientRect().width;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === width) return;
      width = entry.contentRect.width;
      resize();
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [draft]);
  function send() {
    if (!draft.trim() || busy || dictating) return;
    onSend();
    input.current?.focus();
  }
  return (
    <>
      <div className={styles.shell}>
        <form
          className={styles.composer}
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <textarea
            ref={input}
            autoFocus
            readOnly={dictating}
            rows={1}
            aria-label="Message"
            placeholder="Message"
            value={draft}
            onChange={(event) => {
              const value = event.target.value;
              onDraft(value);
              if (
                value.endsWith("@") &&
                (value.length === 1 || !value.at(-2)?.trim())
              )
                setPicking(true);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                send();
              }
            }}
          />
          {dictating ? (
            <VoiceRecording
              phase={voice.phase as "requesting" | "recording" | "transcribing"}
              analyser={voice.analyser}
              onStop={voice.stop}
              onCancel={voice.cancel}
            />
          ) : (
            <div className={styles.row}>
              <button
                type="button"
                className={styles.select}
                aria-haspopup="dialog"
                onClick={() => setPicking(true)}
              >
                <Plus size={19} />
                Select
              </button>
              <ComposerLocation
                name={location ?? "Worldwide"}
                onClick={() =>
                  selected ? onSelect(selected) : setPicking(true)
                }
              />
              {!busy && (
                <IconButton
                  className={styles.mic}
                  label="Dictate message"
                  onClick={() => void voice.start()}
                >
                  <Mic size={17} />
                </IconButton>
              )}
              {busy ? (
                <IconButton label="Stop response" onClick={onStop}>
                  <Square size={16} />
                </IconButton>
              ) : (
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!draft.trim()}
                  className={styles.send}
                >
                  <ArrowUp size={16} />
                </button>
              )}
            </div>
          )}
        </form>
      </div>
      {voice.error && (
        <div className={styles.error} role="alert">
          {voice.error}
          {voice.retry && <button onClick={voice.retry}>Retry</button>}
          <button onClick={voice.dismissError}>Dismiss</button>
        </div>
      )}
      {picking && (
        <ReferencePicker
          issues={issues}
          onClose={() => setPicking(false)}
          onSelect={(issue) => {
            onSelect(issue);
            setPicking(false);
            if (draft.endsWith("@")) onDraft(draft.slice(0, -1));
            input.current?.focus();
          }}
        />
      )}
    </>
  );
}
