import {
  Palette,
  SlidersHorizontal,
  CreditCard,
  CircleUserRound,
} from "lucide-react";
import type { SettingsSection } from "../../lib/settings";
import styles from "../shell/Sidebar.module.css";
export const settingsSections = [
  { id: "profile", label: "Profile", Icon: CircleUserRound },
  { id: "appearance", label: "Appearance", Icon: Palette },
  { id: "models", label: "Models", Icon: SlidersHorizontal },
  { id: "paypal", label: "PayPal Sandbox", Icon: CreditCard },
] as const;
export default function SettingsNavigation({
  value,
  onChange,
}: {
  value: SettingsSection;
  onChange: (value: SettingsSection) => void;
}) {
  return (
    <>
      {settingsSections.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`${styles.home} ${value === id ? styles.selected : ""}`}
          aria-current={value === id ? "page" : undefined}
          onClick={() => onChange(id)}
        >
          <Icon size={24} strokeWidth={1.8} />
          {label}
        </button>
      ))}
    </>
  );
}
