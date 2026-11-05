import type { ChatMessageAction } from "../../lib/chatActions";
import type { GoalsResult } from "../../lib/chatGoals";
import type { ChatWorkspaceActions } from "../../lib/chatWorkspace";
import SettingsGroup from "../settings/SettingsGroup";
import ChatGoalRow from "./ChatGoalRow";
import styles from "./ChatGoalsWidget.module.css";
export default function ChatGoalsWidget({ result, actions, onMessage, busy }: {
  result: GoalsResult;
  actions: ChatWorkspaceActions;
  onMessage: ChatMessageAction;
  busy: boolean;
}) {
  const goals = result.focusedGoalId
    ? result.goals.filter((goal) => goal.id === result.focusedGoalId)
    : result.goals;
  return <section className={styles.widget} aria-label="Contribution goals">
    {!result.focusedGoalId && <span>{goals.length} {goals.length === 1 ? "goal" : "goals"}</span>}
    <SettingsGroup>
      {goals.map((goal) => <ChatGoalRow key={goal.id} goal={goal}
        subscription={result.subscriptions.find((subscription) => subscription.goalId === goal.id)}
        revision={result.revision} timeZone={result.timeZone}
        canContribute={result.availableCategories.includes(goal.category) && !goal.organization && goal.status !== "paused"} actions={actions} onMessage={onMessage} busy={busy}/>)}
    </SettingsGroup>
  </section>;
}
