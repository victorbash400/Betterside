import LoadingSpinner from "../controls/LoadingSpinner";
import { useEffect, useRef, useState } from "react";
import {
  accountSchema,
  newPasswordSchema,
  type AuthStep,
} from "../../lib/account";
import { accountRequest, AccountApiError } from "../../lib/accountApi";
import { useAccount } from "../../state/AccountContext";
import AppIcon from "../controls/AppIcon";
import AccountField from "./AccountField";
import VerificationCodeInput from "./VerificationCodeInput";
import styles from "./SignInForm.module.css";
const labels: Record<AuthStep, string> = {
  "sign-in": "Sign in",
  "sign-up": "Create account",
  confirm: "Verify email",
  reset: "Reset password",
  "reset-confirm": "Set password",
};
export default function SignInForm({ onBack }: { onBack: () => void }) {
  const account = useAccount();
  const [step, setStep] = useState<AuthStep>("sign-in");
  const [fields, setFields] = useState({
    email: "",
    password: "",
    name: "",
    code: "",
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [resent, setResent] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    form.current
      ?.querySelector<HTMLInputElement>("input:not(:disabled)")
      ?.focus({ preventScroll: true });
  }, [step]);
  function change(next: AuthStep) {
    setStep(next);
    setError("");
    setResent(false);
    setFields((previous) => ({ ...previous, password: "", code: "" }));
  }
  const needsPassword = ["sign-in", "sign-up", "reset-confirm"].includes(step),
    needsCode = step === "confirm" || step === "reset-confirm";
  const ready =
    fields.email.trim() &&
    (!needsPassword || fields.password) &&
    (!needsCode || fields.code.length === 6) &&
    (step !== "sign-up" || fields.name.trim());
  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    try {
      if (step === "sign-up" || step === "reset-confirm") {
        const parsed = newPasswordSchema.safeParse(fields.password);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      }
      const bodies = {
        "sign-in": { email: fields.email.trim(), password: fields.password },
        "sign-up": {
          email: fields.email.trim(),
          password: fields.password,
          name: fields.name.trim(),
        },
        confirm: { email: fields.email.trim(), code: fields.code },
        reset: { email: fields.email.trim() },
        "reset-confirm": {
          email: fields.email.trim(),
          password: fields.password,
          code: fields.code,
        },
      };
      const result = await accountRequest(`/api/auth/${step}`, bodies[step]);
      if (step === "sign-in")
        account.signedIn(accountSchema.parse(result.user));
      else if (step === "sign-up") {
        if (typeof result.confirmationRequired !== "boolean")
          throw new Error("Invalid sign-up response.");
        change(result.confirmationRequired ? "confirm" : "sign-in");
      } else if (step === "reset") {
        if (result.sent !== true)
          throw new Error("Reset code could not be sent.");
        change("reset-confirm");
      } else {
        if (result.confirmed !== true && result.updated !== true)
          throw new Error("Account update failed.");
        change("sign-in");
      }
    } catch (failure) {
      if (
        failure instanceof AccountApiError &&
        failure.code === "UserNotConfirmedException"
      )
        change("confirm");
      else if (
        failure instanceof AccountApiError &&
        failure.code === "PasswordResetRequiredException"
      )
        change("reset");
      else
        setError(
          failure instanceof Error
            ? failure.message
            : "Account request failed.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    setBusy(true);
    setError("");
    try {
      const result = await accountRequest("/api/auth/demo", {});
      account.signedIn(accountSchema.parse(result.user));
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Demo unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError("");
    setResent(false);
    try {
      await accountRequest(
        step === "confirm" ? "/api/auth/resend" : "/api/auth/reset",
        { email: fields.email.trim() },
      );
      setResent(true);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not resend code.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.surface}>
      <header className={styles.brand}>
        <AppIcon />
        <span>BetterSide</span>
      </header>
      {step !== "sign-in" && <h1>{labels[step]}</h1>}
      <form
        ref={form}
        aria-label={labels[step]}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {step === "sign-up" && (
          <AccountField
            label="Name"
            autoComplete="name"
            required
            maxLength={100}
            disabled={busy}
            value={fields.name}
            onChange={(event) =>
              setFields({ ...fields, name: event.target.value })
            }
          />
        )}
        {needsCode ? (
          <p className={styles.email}>{fields.email}</p>
        ) : (
          <AccountField
            label="Email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
            disabled={busy}
            value={fields.email}
            onChange={(event) =>
              setFields({ ...fields, email: event.target.value })
            }
          />
        )}
        {needsCode && (
          <VerificationCodeInput
            key={`${step}:${fields.email}`}
            disabled={busy}
            onChange={(code) =>
              setFields((previous) => ({ ...previous, code }))
            }
          />
        )}
        {needsPassword && (
          <AccountField
            label={step === "reset-confirm" ? "New password" : "Password"}
            type="password"
            autoComplete={
              step === "sign-in" ? "current-password" : "new-password"
            }
            minLength={step === "sign-in" ? 1 : 12}
            maxLength={256}
            required
            disabled={busy}
            value={fields.password}
            onChange={(event) =>
              setFields({ ...fields, password: event.target.value })
            }
          />
        )}
        {step === "sign-in" && (
          <div className={styles.links}>
            <button type="button" disabled={busy} onClick={() => void demo()}>
              Sign in with demo
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => change("sign-up")}
            >
              Create account
            </button>
          </div>
        )}
        {needsCode && (
          <div className={styles.links}>
            <button type="button" disabled={busy} onClick={() => void resend()}>
              {resent ? "Code sent · Resend" : "Resend code"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => change(step === "confirm" ? "sign-up" : "reset")}
            >
              Change email
            </button>
          </div>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button
          className={styles.submit}
          aria-label={labels[step]}
          aria-busy={busy}
          disabled={!ready || busy}
        >
          {busy ? (
            <LoadingSpinner size={22} label="Processing account request" />
          ) : (
            labels[step]
          )}
        </button>
        {step === "sign-in" && (
          <button
            className={styles.recovery}
            type="button"
            disabled={busy}
            onClick={() => change("reset")}
          >
            Forgot password
          </button>
        )}
        <button
          className={styles.back}
          type="button"
          disabled={busy}
          onClick={() => (step === "sign-in" ? onBack() : change("sign-in"))}
        >
          Back
        </button>
      </form>
    </div>
  );
}
