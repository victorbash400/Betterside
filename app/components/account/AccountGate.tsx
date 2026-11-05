import LoadingSpinner from "../controls/LoadingSpinner";
import { useAccount } from "../../state/AccountContext";
import Workspace from "../shell/Workspace";
import SignInScreen from "./SignInScreen";
import styles from "./SignInScreen.module.css";
export default function AccountGate({
  showForm = false,
}: {
  showForm?: boolean;
}) {
  const account = useAccount();
  if (!account.ready)
    return (
      <main className={`${styles.screen} ${styles.loading}`}>
        <LoadingSpinner label="Loading account" />
      </main>
    );
  if (account.user) return <Workspace key={account.user.id} />;
  return <SignInScreen showForm={showForm} />;
}
