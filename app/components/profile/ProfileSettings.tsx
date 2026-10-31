import SettingsGroup from "../settings/SettingsGroup";
import ProfileIdentity from "./ProfileIdentity";
import { useDonorProfile } from "../../state/useDonorProfile";
import styles from "./ProfileSettings.module.css";
export default function ProfileSettings() {
  const state = useDonorProfile();
  return (
    <div className={styles.profile}>
      {state.error && (
        <div className={styles.error} role="alert">
          {state.error}
          <button onClick={state.retry}>Reload profile</button>
        </div>
      )}
      {!state.profile && !state.error && <span role="status">Loading profile</span>}
      {state.profile && (
        <SettingsGroup>
          <ProfileIdentity
            key={state.profile.name}
            name={state.profile.name}
            busy={state.saving}
            onSave={(name) => state.save({ ...state.profile!, name })}
          />
        </SettingsGroup>
      )}
    </div>
  );
}
