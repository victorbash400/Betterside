import NamePrompt from "../controls/NamePrompt";
import Dialog from "../controls/Dialog";
import NewInterestDialog from "./NewInterestDialog";
import AddItemsDialog from "./AddItemsDialog";
import MoveInterestDialog from "./MoveInterestDialog";
import type { InterestAction } from "../../lib/interestActions";
import type { Interest } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import type { InterestChoice } from "../../lib/interestCategories";
import styles from "./MoveInterestDialog.module.css";
export default function InterestActionDialog({
  action,
  interests,
  items,
  onClose,
  onAdd,
  onCreate,
  onRename,
  onArchive,
  onMoveFolder,
  onMoveItem,
}: {
  action: InterestAction;
  interests: Interest[];
  items: MapItem[];
  onClose: () => void;
  onAdd: (items: MapItem[], interestId?: string) => void;
  onCreate: (choice: InterestChoice, parentId?: string) => void;
  onRename: (id: string, name: string) => void;
  onArchive: (id: string) => void;
  onMoveFolder: (id: string, parentId?: string) => void;
  onMoveItem: (id: string, interestId?: string) => void;
}) {
  if (action.kind === "add")
    return (
      <AddItemsDialog
        interest={action.interest}
        items={items}
        onClose={onClose}
        onAdd={(items) => {
          onAdd(items, action.interest.id);
          onClose();
        }}
      />
    );
  if (action.kind === "new")
    return (
      <NewInterestDialog
        interests={interests}
        onClose={onClose}
        onCreate={(choice) => {
          onCreate(choice, action.interest.id);
          onClose();
        }}
      />
    );
  if (action.kind === "rename")
    return (
      <NamePrompt
        label="Rename interest"
        initial={action.interest.name}
        onClose={onClose}
        onSubmit={(name) => {
          onRename(action.interest.id, name);
          onClose();
        }}
      />
    );
  if (action.kind === "archive")
    return (
      <Dialog title={`Remove ${action.interest.name}?`} onClose={onClose}>
        <div className={styles.actions}>
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={() => {
              onArchive(action.interest.id);
              onClose();
            }}
          >
            Remove interest
          </button>
        </div>
      </Dialog>
    );
  if (action.kind === "move-folder" || action.kind === "move-item")
    return (
      <MoveInterestDialog
        interests={interests}
        folderId={
          action.kind === "move-folder" ? action.interest.id : undefined
        }
        onClose={onClose}
        onMove={(id) => {
          if (action.kind === "move-folder")
            onMoveFolder(action.interest.id, id);
          else if ("item" in action) onMoveItem(action.item.id, id);
          onClose();
        }}
      />
    );
  return null;
}
