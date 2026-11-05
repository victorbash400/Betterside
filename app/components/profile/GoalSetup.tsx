import GoalNavigation from "./GoalNavigation";
import GoalEditor from "./GoalEditor";
import LoadingRegion from "../controls/LoadingRegion";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import { useSubscriptionCatalogue } from "../../state/useSubscriptionCatalogue";
import type { ContributionGoal } from "../../lib/profile";
export default function GoalSetup({
  goal,
  onBack,
  onPrepared,
}: {
  goal?: ContributionGoal;
  onBack: () => void;
  onPrepared: () => void;
}) {
  const catalogue = useSubscriptionCatalogue();
  return (
    <div>
      <GoalNavigation
        title={goal ? "Set up payment" : "New goal"}
        onBack={onBack}
      />
      {catalogue.error ? (
        <div role="alert">
          {catalogue.error}
          <SettingsInlineButton onClick={catalogue.retry}>
            Retry
          </SettingsInlineButton>
        </div>
      ) : catalogue.busy ? (
        <LoadingRegion label="Loading projects" />
      ) : (
        <GoalEditor
          goal={goal}
          projects={catalogue.projects}
          onClose={onBack}
          onPrepared={onPrepared}
        />
      )}
    </div>
  );
}
