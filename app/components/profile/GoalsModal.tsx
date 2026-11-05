import Dialog from "../controls/Dialog";
import GoalsSettings from "./GoalsSettings";
import type { ContributionGoal } from "../../lib/profile";
import type { MapItem } from "../../lib/types";

export default function GoalsModal({
  records,
  onContribute,
  onClose,
}: {
  records: MapItem[];
  onContribute: (goal: ContributionGoal) => void;
  onClose: () => void;
}) {
  return (
    <Dialog id="goals-dialog" title="Goals" size="goals" onClose={onClose}>
      <GoalsSettings records={records} onContribute={onContribute} />
    </Dialog>
  );
}
