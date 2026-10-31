import { useState } from "react";
import { Plus } from "lucide-react";
import IconButton from "../controls/IconButton";
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
      <header>
        <h2>Goals</h2>
        <IconButton
          label="New contribution goal"
          disabled={busy || profile.goals.length >= 30}
          onClick={() => setEditor("new")}
        >
          <Plus size={16} />
        </IconButton>
      </header>
      <span className={styles.context}>USD · Sandbox</span>
      {profile.goals.map((goal) =>
        editor !== "new" && editor?.id === goal.id ? null : (
          <ContributionGoalRow
            key={goal.id}
            goal={goal}
            {...goalProgress(goal, payments, profile.timeZone)}
            busy={busy}
            canContribute={availableCategories
              ? availableCategories.includes(goal.category)
              : records.some((record) => goalMatchesProject(goal, record))}
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
      {error && <span role="alert">{error}</span>}
    </section>
  );
}
