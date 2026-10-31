import ProfileIdentity from "./ProfileIdentity";
import ProfileGoals from "./ProfileGoals";
import ProfilePayments from "./ProfilePayments";
import { useDonorProfile } from "../../state/useDonorProfile";
import type { ContributionGoal } from "../../lib/profile";
import type { MapItem } from "../../lib/types";
import styles from "./ProfileSettings.module.css";
export default function ProfileSettings({
  records,
  onCheckout,
  onGoal,
  onContributions,
  onPaymentSettings,
}: {
  records: MapItem[];
  onCheckout: () => void;
  onGoal: (goal: ContributionGoal) => void;
  onContributions: () => void;
  onPaymentSettings: () => void;
}) {
  const state = useDonorProfile();
  return (
    <div className={styles.profile}>
      {state.error && (
        <div className={styles.error} role="alert">
          {state.error}
          <button disabled={state.saving} onClick={state.retry}>
            Reload profile
          </button>
        </div>
      )}
      {!state.profile && !state.error && (
        <span role="status">Loading profile</span>
      )}
      {state.profile && (
        <>
          <ProfileIdentity
            key={state.profile.name}
            name={state.profile.name}
            busy={state.saving}
            onSave={(name) => state.save({ ...state.profile!, name })}
          />
          <ProfileGoals
            profile={state.profile}
            payments={state.payments}
            records={records}
            busy={state.saving}
            onSave={state.save}
            onContribute={onGoal}
          />
          <ProfilePayments
            onCheckout={onCheckout}
            onContributions={onContributions}
            onSettings={onPaymentSettings}
          />
        </>
      )}
    </div>
  );
}
