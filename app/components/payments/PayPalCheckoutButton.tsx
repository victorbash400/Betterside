import LoadingRegion from "../controls/LoadingRegion";
import {
  usePayPalCheckout,
  type PaymentCompletion,
} from "../../state/usePayPalCheckout";
import PayPalLinkCheckout from "./PayPalLinkCheckout";
import styles from "./PayPalCheckoutButton.module.css";
export type { PaymentCompletion } from "../../state/usePayPalCheckout";
export default function PayPalCheckoutButton(props: {
  projectId: string;
  goalId?: string;
  amount: string;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onComplete: (result: PaymentCompletion) => void;
}) {
  const checkout = usePayPalCheckout(props);
  return (
    <div className={styles.checkout}>
      <div
        ref={checkout.container}
        className={styles.button}
        hidden={Boolean(checkout.error)}
      />
      {!checkout.ready && !checkout.error && (
        <LoadingRegion compact label="Loading PayPal" />
      )}
      {checkout.notice && (
        <span role="status" className={styles.status}>
          {checkout.notice}
        </span>
      )}
      {checkout.error && (
        <div className={styles.failure}>
          <span role="alert">{checkout.error}</span>
          <button
            type="button"
            disabled={props.disabled}
            onClick={checkout.retry}
          >
            {checkout.approved ? "Retry confirmation" : "Retry PayPal"}
          </button>
        </div>
      )}
      {checkout.error && !checkout.approved && (
        <PayPalLinkCheckout {...props} />
      )}
    </div>
  );
}
