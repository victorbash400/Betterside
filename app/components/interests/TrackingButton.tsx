import SettingsInlineButton from "../settings/SettingsInlineButton";
import { Pin, PinOff } from "lucide-react";

export default function TrackingButton({
  pinned,
  disabled,
  onToggle,
}: {
  pinned: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const Icon = pinned ? PinOff : Pin;
  return (
    <SettingsInlineButton disabled={disabled} aria-pressed={pinned} onClick={onToggle}>
      <Icon size={14} />
      {pinned ? "Unpin" : "Pin"}
    </SettingsInlineButton>
  );
}
