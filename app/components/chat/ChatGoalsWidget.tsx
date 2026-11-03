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
  return <section className={styles.widget} aria-label="Contribution goals">
    <span>{result.goals.length} {result.goals.length === 1 ? "goal" : "goals"}</span>
    <SettingsGroup>
      {result.goals.map((goal) => <ChatGoalRow key={goal.id} goal={goal}
        subscription={result.subscriptions.find((subscription) => subscription.goalId === goal.id)}
        revision={result.revision} timeZone={result.timeZone}
        canContribute={result.availableCategories.includes(goal.category) && !goal.organization && goal.status !== "paused"} actions={actions} onMessage={onMessage} busy={busy}/>)}
    </SettingsGroup>
  </section>;
}
