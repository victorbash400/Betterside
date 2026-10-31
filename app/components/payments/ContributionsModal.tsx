import Dialog from "../controls/Dialog";
import ContributionHistory from "./ContributionHistory";
export default function ContributionsModal({
  onClose,
  onExplore,
  onProject,
}: {
  onClose: () => void;
  onExplore: () => void;
  onProject: (id: string) => void;
}) {
  return (
    <Dialog
      id="contributions-dialog"
      title="Contributions"
      size="history"
      onClose={onClose}
    >
      <ContributionHistory compact onExplore={onExplore} onProject={onProject} />
    </Dialog>
  );
}
