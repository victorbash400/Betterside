import ProfileGoals from "./ProfileGoals";
import { useDonorProfile } from "../../state/useDonorProfile";
import type { MapItem } from "../../lib/types";
import type { ContributionGoal } from "../../lib/profile";
import styles from "./ProfileSettings.module.css";
export default function GoalsSettings({
  records,
  onContribute,
}: {
  records: MapItem[];
  onContribute: (goal: ContributionGoal) => void;
}) {
  const state = useDonorProfile();
  return (
    <div className={styles.profile}>
      {state.error && (
        <div className={styles.error} role="alert">
          {state.error}
          <button disabled={state.saving} onClick={state.retry}>
            Reload goals
          </button>
        </div>
      )}
      {!state.profile && !state.error && (
        <span role="status">Loading goals</span>
      )}
      {state.profile && (
        <ProfileGoals
          profile={state.profile}
          payments={state.payments}
          records={records}
          busy={state.saving}
          onSave={state.save}
          onContribute={onContribute}
        />
      )}
    </div>
  );
}
