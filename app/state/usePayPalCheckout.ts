import { useAccount } from "./AccountContext";
import { useEffect, useRef, useState } from "react";
import {
  loadCoreSdkScript,
  type OneTimePaymentSession,
  type PayPalButtonElement,
} from "@paypal/paypal-js/sdk-v6";
import { z } from "zod";
import { amountInCents, decimalAmount } from "../lib/payment";
import { paymentResultSchema } from "../lib/chatWorkspace";
const configSchema = z.object({
  clientId: z.string().min(1),
  currency: z.literal("USD"),
  environment: z.literal("sandbox"),
});
const completionSchema = z.object({
  status: z.literal("COMPLETED"),
  amount: z.string(),
  projectName: z.string(),
});
export type PaymentCompletion = z.infer<typeof completionSchema>;
async function post(transport: typeof fetch, path: string, input: unknown) {
  const response = await transport(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(z.object({ error: z.string() }).parse(body).error);
  return body;
}
export function usePayPalCheckout({
  projectId,
  goalId,
  amount,
  disabled,
  onBusy,
  onComplete,
}: {
  projectId: string;
  goalId?: string;
  amount: string;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onComplete: (result: PaymentCompletion) => void;
}) {
  const { fetch } = useAccount();
  const container = useRef<HTMLDivElement>(null);
  const current = useRef({
    projectId,
    goalId,
    amount,
    disabled,
    onBusy,
    onComplete,
  });
  current.current = { projectId, goalId, amount, disabled, onBusy, onComplete };
  const buttonRef = useRef<PayPalButtonElement | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  const approvedOrder = useRef<string | undefined>(undefined);
  async function confirm(orderId: string) {
    const result = completionSchema.parse(
      await post(fetch, "/api/paypal/capture", { orderId }),
    );
    current.current.onComplete(result);
  }
  useEffect(() => {
    let active = true;
    let loadingStep = "configuration";
    let session: OneTimePaymentSession | undefined;
    let pendingOrder: string | undefined;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (active)
        setError(`PayPal ${loadingStep} timed out. Retry or continue in PayPal.`);
    }, 15000);
    setReady(false);
    setError("");
    async function createOrder() {
      const input = current.current;
      const order = paymentResultSchema.parse(
        await post(fetch, "/api/paypal/orders", {
          projectId: input.projectId,
          goalId: input.goalId,
          amount: decimalAmount(amountInCents(input.amount)),
        }),
      );
      pendingOrder = order.id;
      if (cancelled) {
        await post(fetch, "/api/paypal/cancel", { orderId: order.id });
        throw new Error("Payment cancelled.");
      }
      return { orderId: order.id };
    }
    async function start() {
      if (current.current.disabled || !session) return;
      setError("");
      setNotice("");
      approvedOrder.current = undefined;
      cancelled = false;
      current.current.onBusy(true);
      try {
        await session.start({ presentationMode: "popup" }, createOrder());
      } catch (failure) {
        if (active)
          setError(
            failure instanceof Error
              ? failure.message
              : "PayPal checkout failed. Retry.",
          );
        current.current.onBusy(false);
      }
    }
    async function mount() {
      const response = await fetch("/api/paypal/config", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok)
        throw new Error(z.object({ error: z.string() }).parse(body).error);
      const config = configSchema.parse(body);
      if (!active) return;
      loadingStep = "SDK load";
      const sdk = await loadCoreSdkScript({
        environment: config.environment,
        dataNamespace: "betterSidePayPal",
      });
      if (!active) return;
      if (!sdk) throw new Error("PayPal SDK unavailable.");
      loadingStep = "initialization";
      const instance = await sdk.createInstance({
        clientId: config.clientId,
        components: ["paypal-payments"],
        pageType: "checkout",
      });
      loadingStep = "eligibility check";
      const methods = await instance.findEligibleMethods({
        currencyCode: config.currency,
      });
      if (!active || !container.current) return;
      if (!methods.isEligible("paypal"))
        throw new Error("PayPal checkout unavailable in this browser.");
      session = instance.createPayPalOneTimePaymentSession({
        onApprove: async (data) => {
          try {
            if (!pendingOrder || data.orderId !== pendingOrder)
              throw new Error("PayPal order does not match checkout.");
            approvedOrder.current = data.orderId;
            await confirm(data.orderId);
          } catch (failure) {
            if (active)
              setError(
                failure instanceof Error
                  ? failure.message
                  : "Payment confirmation failed.",
              );
          } finally {
            current.current.onBusy(false);
          }
        },
        onCancel: () => {
          cancelled = true;
          void (async () => {
            try {
              if (pendingOrder)
                await post(fetch, "/api/paypal/cancel", { orderId: pendingOrder });
              if (active) setNotice("Payment cancelled");
            } catch (failure) {
              if (active)
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "Could not record cancellation.",
                );
            } finally {
              pendingOrder = undefined;
              current.current.onBusy(false);
            }
          })();
        },
        onError: () => {
          if (active)
            setError(
              (previous) => previous || "PayPal checkout failed. Retry.",
            );
          current.current.onBusy(false);
        },
      });
      const button = document.createElement("paypal-button");
      button.type = "pay";
      button.className = "paypal-white";
      button.style.setProperty("--paypal-button-border-radius", "10px");
      button.style.width = "100%";
      button.disabled = current.current.disabled;
      button.addEventListener("click", start);
      buttonRef.current = button;
      container.current.replaceChildren(button);
      window.clearTimeout(timeout);
      setError("");
      setReady(true);
    }
    void mount().catch((failure) => {
      window.clearTimeout(timeout);
      if (active)
        setError(
          failure instanceof Error
            ? failure.message
            : "PayPal button could not load. Retry or continue in PayPal.",
        );
    });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      buttonRef.current?.remove();
      buttonRef.current = undefined;
      session?.destroy();
    };
  }, [attempt]);
  useEffect(() => {
    if (buttonRef.current) buttonRef.current.disabled = disabled;
  }, [disabled, ready]);
  return {
    container,
    ready,
    error,
    notice,
    approved: Boolean(approvedOrder.current),
    retry: () => {
      setError("");
      if (approvedOrder.current) {
        current.current.onBusy(true);
        void confirm(approvedOrder.current)
          .catch((failure) =>
            setError(
              failure instanceof Error
                ? failure.message
                : "Payment confirmation failed.",
            ),
          )
          .finally(() => current.current.onBusy(false));
      } else setAttempt((value) => value + 1);
    },
  };
}
