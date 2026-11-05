import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  CircleUserRound,
  KeyRound,
} from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import styles from "./AccountField.module.css";
export default function AccountField({
  label,
  type = "text",
  variant = "signin",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  variant?: "signin" | "settings";
}) {
  const [visible, setVisible] = useState(false);
  const Icon =
    type === "password"
      ? LockKeyhole
      : type === "email"
        ? Mail
        : props.autoComplete === "one-time-code"
          ? KeyRound
          : CircleUserRound;
  return (
    <label
      className={`${styles.field} ${variant === "settings" ? styles.settings : ""}`}
    >
      <span>{label}</span>
      <div>
        {variant === "signin" && (
          <span className={styles.icon}>
            <Icon size={18} />
          </span>
        )}
        <input
          {...props}
          aria-label={label}
          placeholder={label}
          type={type === "password" && visible ? "text" : type}
        />
        {type === "password" && (
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
    </label>
  );
}
