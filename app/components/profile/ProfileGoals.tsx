import { useState } from "react";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsRow from "../settings/SettingsRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import GoalEditor from "./GoalEditor";
import ContributionGoalRow from "./ContributionGoalRow";
import {
  goalMatchesProject,
  goalProgress,
  type ContributionGoal,
  type DonorProfile,
} from "../../lib/profile";
import type { Contribution, MapItem } from "../../lib/types";
import styles from "./ProfileGoals.module.css";
export default function ProfileGoals({
  profile,
  payments,
  records = [],
  availableCategories,
  busy,
  onSave,
  onContribute,
}: {
  profile: DonorProfile;
  payments: Contribution[];
  records?: MapItem[];
  availableCategories?: string[];
  busy: boolean;
  onSave: (profile: DonorProfile) => Promise<void>;
  onContribute: (goal: ContributionGoal) => void;
}) {
  const [editor, setEditor] = useState<ContributionGoal | "new">();
  const [error, setError] = useState("");
  return (
    <section className={styles.goals} aria-label="Contribution goals">
      <SettingsGroup>
        <SettingsRow label="Contribution goals">
          <span>USD · Sandbox</span>
          <SettingsInlineButton
            disabled={busy || profile.goals.length >= 30 || Boolean(editor)}
            onClick={() => setEditor("new")}
          >
            New goal
          </SettingsInlineButton>
        </SettingsRow>
        {profile.goals.map((goal) =>
          editor !== "new" && editor?.id === goal.id ? null : (
            <ContributionGoalRow
              key={goal.id}
              goal={goal}
              {...goalProgress(goal, payments, profile.timeZone)}
              busy={busy}
              canContribute={
                availableCategories
                  ? availableCategories.includes(goal.category)
                  : records.some((record) => goalMatchesProject(goal, record))
              }
              onEdit={() => setEditor(goal)}
              onDelete={() => {
                setError("");
                void onSave({
                  ...profile,
                  goals: profile.goals.filter((item) => item.id !== goal.id),
                }).catch((failure) =>
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "Could not delete goal.",
                  ),
                );
              }}
              onContribute={() => onContribute(goal)}
            />
          ),
        )}
        {editor && (
          <GoalEditor
            key={editor === "new" ? "new" : editor.id}
            goal={editor === "new" ? undefined : editor}
            busy={busy}
            onClose={() => setEditor(undefined)}
            onSave={async (goal) => {
              await onSave({
                ...profile,
                goals:
                  editor === "new"
                    ? [...profile.goals, goal]
                    : profile.goals.map((item) =>
                        item.id === goal.id ? goal : item,
                      ),
              });
            }}
          />
        )}
      </SettingsGroup>
      {error && <span role="alert">{error}</span>}
    </section>
  );
}
