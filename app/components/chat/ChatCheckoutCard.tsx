import { useState } from "react";
import type {
  CheckoutInput,
  ChatWorkspaceActions,
} from "../../lib/chatWorkspace";
import styles from "./ChatResult.module.css";
export default function ChatCheckoutCard({
  input,
  actions,
}: {
  input: CheckoutInput;
  actions: ChatWorkspaceActions;
}) {
  const [error, setError] = useState("");
  return (
    <div className={styles.result}>
      <div className={styles.heading}>
        <strong>PayPal checkout</strong>
        <span>Sandbox</span>
      </div>
      {error && (
        <span role="alert" className={styles.error}>
          {error}
        </span>
      )}
      <div className={styles.actions}>
        <button
          onClick={() => {
            setError("");
            void actions
              .openCheckout(input)
              .catch((failure) =>
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "Checkout failed.",
                ),
              );
          }}
        >
          Open checkout
        </button>
      </div>
    </div>
  );
}
