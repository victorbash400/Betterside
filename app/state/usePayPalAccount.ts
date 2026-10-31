import { useEffect, useState } from "react";
import { z } from "zod";
import { paypalAccountStatusSchema } from "../lib/paypalAccount";
export function usePayPalAccount() {
  const [account, setAccount] =
    useState<z.infer<typeof paypalAccountStatusSchema>>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/paypal/account", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "PayPal account unavailable.");
        if (!controller.signal.aborted) {
          setAccount(paypalAccountStatusSchema.parse(body));
          if (
            new URL(window.location.href).searchParams.get("paypal") ===
            "failed"
          )
            setError("PayPal account linking failed. Retry.");
        }
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : "PayPal account unavailable.",
          );
      }
    })();
    return () => controller.abort();
  }, [fetch, attempt]);
  async function connect() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/paypal/account", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "PayPal linking failed.");
      const url = new URL(z.object({ url: z.url() }).parse(body).url);
      if (
        url.origin !== "https://www.sandbox.paypal.com" ||
        url.pathname !== "/connect"
      )
        throw new Error("PayPal authorization URL rejected.");
      window.location.assign(url.href);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "PayPal linking failed.",
      );
      setBusy(false);
    }
  }
  async function disconnect() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/paypal/account", { method: "DELETE" });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Could not disconnect PayPal.");
      setAccount((previous) =>
        previous
          ? { configured: previous.configured, connected: false }
          : undefined,
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not disconnect PayPal.",
      );
    } finally {
      setBusy(false);
    }
  }
  return {
    account,
    error,
    busy,
    connect,
    disconnect,
    retry: () => {
      setError("");
      setAttempt((value) => value + 1);
    },
  };
}
