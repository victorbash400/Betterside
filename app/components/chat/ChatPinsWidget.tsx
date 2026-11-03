import type { ChatMessageAction } from "../../lib/chatActions";
import { useState } from "react";
import type { PinsResult } from "../../lib/chatPins";
import type { ChatWorkspaceActions } from "../../lib/chatWorkspace";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsRow from "../settings/SettingsRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import styles from "./ChatPinsWidget.module.css";

export default function ChatPinsWidget({ result, actions, onMessage }: { result: PinsResult; actions: ChatWorkspaceActions; onMessage: ChatMessageAction }) {
  const [removed, setRemoved] = useState<string[]>([]);
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState("");
  async function run(id: string, remove: boolean) {
    setPending(id);
    setError("");
    try {
      if (remove) {
        await actions.unpinItems({ ids: [id] });
        setRemoved((previous) => [...previous, id]);
      } else await actions.openPin(id);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Pin action failed.");
    } finally { setPending(undefined); }
  }
  const visible = result.pins.filter((pin) => !removed.includes(pin.id) && actions.isPinned(pin.id));
  return <section className={styles.widget} aria-label="Pinned items">
    <span>{visible.length}{result.nextOffset !== null ? ` / ${result.total}` : ""} {visible.length === 1 ? "pin" : "pins"}</span>
    <SettingsGroup>
      {visible.map((pin) => (
        <SettingsRow key={pin.id} label={pin.name}>
          <SettingsInlineButton disabled={Boolean(pending)} onClick={() => void run(pin.id, false)}>Open</SettingsInlineButton>
          <SettingsInlineButton disabled={Boolean(pending)} onClick={() => void run(pin.id, true)}>Unpin</SettingsInlineButton>
        </SettingsRow>
      ))}
    </SettingsGroup>
    {result.nextOffset !== null && <SettingsInlineButton onClick={() => onMessage("Show more pins.", { kind: "list-pins", offset: result.nextOffset! })}>More pins</SettingsInlineButton>}
    {error && <span role="alert">{error}</span>}
  </section>;
}
