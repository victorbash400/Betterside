import { useState } from "react";
import { Plus } from "lucide-react";
import EmptyState from "../controls/EmptyState";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import GoalSetup from "./GoalSetup";
import GoalDetails from "./GoalDetails";
import ContributionGoalRow from "./ContributionGoalRow";
import {
  goalProgress,
  type ContributionGoal,
  type DonorProfile,
} from "../../lib/profile";
import type { GoalSubscription } from "../../lib/paypalSubscription";
import type { Contribution, MapItem } from "../../lib/types";
import styles from "./ProfileGoals.module.css";

type View =
  | { kind: "list" }
  | { kind: "detail"; id: string }
  | { kind: "setup"; id?: string };
export default function ProfileGoals({
  profile,
  payments,
  subscriptions,
  busy,
  onSave,
}: {
  profile: DonorProfile;
  payments: Contribution[];
  subscriptions: GoalSubscription[];
  records?: MapItem[];
  availableCategories?: string[];
  busy: boolean;
  onSave: (profile: DonorProfile) => Promise<void>;
  onContribute: (goal: ContributionGoal) => void;
  onRefresh?: () => void;
}) {
  const [deleteError, setDeleteError] = useState("");
  const [view, setView] = useState<View>({ kind: "list" });
  const selected =
    view.kind !== "list"
      ? profile.goals.find((goal) => goal.id === view.id)
      : undefined;
  async function deleteGoal(id: string) {
    await onSave({
      ...profile,
      goals: profile.goals.filter((goal) => goal.id !== id),
    });
    setView({ kind: "list" });
  }
  if (view.kind === "setup")
    return (
      <GoalSetup
        goal={selected}
        onBack={() =>
          setView(
            selected ? { kind: "detail", id: selected.id } : { kind: "list" },
          )
        }
        onPrepared={() =>
          window.dispatchEvent(new Event("betterside-profile-changed"))
        }
      />
    );
  if (view.kind === "detail" && selected)
    return (
      <GoalDetails
        key={selected.id}
        goal={selected}
        subscription={subscriptions.find((item) => item.goalId === selected.id)}
        contributedCents={
          goalProgress(selected, payments, profile.timeZone).cents
        }
        saving={busy}
        onBack={() => setView({ kind: "list" })}
        onSetup={() => setView({ kind: "setup", id: selected.id })}
        onDelete={() => deleteGoal(selected.id)}
      />
    );
  return (
    <section className={styles.goals} aria-label="Goals list">
      <div className={styles.toolbar}>
        <span>
          {profile.goals.length} {profile.goals.length === 1 ? "goal" : "goals"}
        </span>
        <SettingsInlineButton
          disabled={busy || profile.goals.length >= 30}
          onClick={() => setView({ kind: "setup" })}
        >
          <Plus size={14} />
          New goal
        </SettingsInlineButton>
      </div>
      <div className={styles.list}>
        <SettingsGroup>
          {profile.goals.length ? (
            profile.goals.map((goal) => (
              <ContributionGoalRow
                key={goal.id}
                goal={goal}
                subscription={subscriptions.find(
                  (item) => item.goalId === goal.id,
                )}
                onOpen={() => {
                  setDeleteError("");
                  setView({ kind: "detail", id: goal.id });
                }}
                busy={busy}
                onDelete={async () => {
                  setDeleteError("");
                  try {
                    await deleteGoal(goal.id);
                  } catch (error) {
                    setDeleteError(error instanceof Error ? error.message : "Could not delete goal.");
                  }
                }}
              />
            ))
          ) : (
            <EmptyState>
              Select New goal to set up a recurring contribution.
            </EmptyState>
          )}
        </SettingsGroup>
      </div>
      {deleteError && <span className={styles.error} role="alert">{deleteError}</span>}
    </section>
  );
}
