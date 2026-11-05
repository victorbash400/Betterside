import { useState } from "react";
import { useAccount } from "../../state/AccountContext";
import SignInWelcome from "./SignInWelcome";
import SignInForm from "./SignInForm";
import styles from "./SignInScreen.module.css";
export default function SignInScreen({
  showForm = false,
}: {
  showForm?: boolean;
}) {
  const account = useAccount();
  const [formOpen, setFormOpen] = useState(showForm || Boolean(account.error));
  return (
    <main className={styles.screen}>
      {formOpen ? (
        <div className={styles.position}>
          <SignInForm onBack={() => setFormOpen(false)} />
        </div>
      ) : (
        <SignInWelcome onSignIn={() => setFormOpen(true)} />
      )}
      {account.error && (
        <div className={styles.serviceError} role="alert">
          {account.error}
          <button onClick={() => void account.reload()}>Retry account</button>
        </div>
      )}
    </main>
  );
}
