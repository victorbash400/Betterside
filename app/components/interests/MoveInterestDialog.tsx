import { useState } from "react";
import { Folder, Bookmark } from "lucide-react";
import Dialog from "../controls/Dialog";
import { interestPath, canMoveInterest } from "../../lib/interestTree";
import type { Interest } from "../../lib/tracking";
import styles from "./MoveInterestDialog.module.css";
export default function MoveInterestDialog({
  interests,
  folderId,
  onMove,
  onClose,
}: {
  interests: Interest[];
  folderId?: string;
  onMove: (id?: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string>();
  return (
    <Dialog title="Move to" onClose={onClose}>
      <div className={styles.list}>
        <button
          role="radio"
          aria-checked={!selected}
          onClick={() => setSelected(undefined)}
        >
          <Bookmark size={20} />
          <span>Pinned</span>
        </button>
        {interests
          .filter(
            (interest) =>
              !interest.target &&
              (!folderId || canMoveInterest(interests, folderId, interest.id)),
          )
          .map((interest) => (
            <button
              key={interest.id}
              role="radio"
              aria-checked={selected === interest.id}
              onClick={() => setSelected(interest.id)}
            >
              <Folder size={20} />
              <span>
                {interestPath(interests, interest.id)
                  .map((item) => item.name)
                  .join(" / ")}
              </span>
            </button>
          ))}
      </div>
      <div className={styles.actions}>
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onMove(selected)}>Move</button>
      </div>
    </Dialog>
  );
}
