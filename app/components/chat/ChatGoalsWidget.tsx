import { useEffect, useState } from "react";
import { useDonorProfile } from "../../state/useDonorProfile";
import type { GoalsResult } from "../../lib/chatGoals";
import type { ChatWorkspaceActions } from "../../lib/chatWorkspace";
import ProfileGoals from "../profile/ProfileGoals";
import styles from "./ChatResult.module.css";
export default function ChatGoalsWidget({
  result,
  actions,
  busy,
}: {
  result: GoalsResult;
  actions: ChatWorkspaceActions;
  busy: boolean;
}) {
  const state = useDonorProfile();
  const [error, setError] = useState("");
  useEffect(() => {
    window.dispatchEvent(new Event("betterside-profile-changed"));
  }, [result.revision]);
  return (
    <div className={styles.result}>
      {(state.error || error) && (
        <div className={styles.error} role="alert">
          {state.error || error}
          <button onClick={() => {
            setError("");
            state.retry();
          }}>
            Reload goals
          </button>
        </div>
      )}
      {!state.profile && !state.error && <span role="status">Loading goals</span>}
      {state.profile && (
        <ProfileGoals
          profile={state.profile}
          payments={state.payments}
          availableCategories={result.availableCategories}
          busy={busy || state.saving}
          onSave={state.save}
          onContribute={(goal) => {
            setError("");
            void actions.openCheckout({ goalId: goal.id }).catch((failure) =>
              setError(
                failure instanceof Error ? failure.message : "Checkout unavailable.",
              ),
            );
          }}
        />
      )}
    </div>
  );
}
