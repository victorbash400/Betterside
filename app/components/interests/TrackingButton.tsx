import type { InterestChoice } from "../../lib/interestCategories";
import { useState } from "react";
import { Bookmark, Check, FolderPlus, X } from "lucide-react";
import ContextMenu from "../controls/ContextMenu";
import NewInterestDialog from "./NewInterestDialog";
import type { Interest } from "../../state/useTracking";
export default function TrackingButton({
  issueId,
  disabled,
  followed,
  interests,
  onTrack,
  onUntrack,
  onCreate,
}: {
  issueId: string;
  disabled?: boolean;
  followed: boolean;
  interests: Interest[];
  onTrack: (interestId?: string) => void;
  onUntrack: () => void;
  onCreate: (choice: InterestChoice) => void;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null),
    [creating, setCreating] = useState(false);
  const assigned = interests.find((interest) =>
    interest.issueIds.includes(issueId),
  );
  return (
    <>
      <button
        disabled={disabled}
        aria-pressed={followed}
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setMenu(menu ? null : { x: rect.left, y: rect.bottom + 6 });
        }}
      >
        <Bookmark size={14} />
        {followed ? "Tracking" : "Track"}
      </button>
      {menu && (
        <ContextMenu
          {...menu}
          label="Track in"
          onClose={() => setMenu(null)}
          entries={[
            {
              label: "Following",
              icon: followed && !assigned ? Check : Bookmark,
              action: () => onTrack(),
            },
            ...interests.map((interest) => ({
              label: interest.name,
              icon: assigned?.id === interest.id ? Check : undefined,
              action: () => onTrack(interest.id),
            })),
            {
              label: "New interest",
              icon: FolderPlus,
              action: () => setCreating(true),
            },
            ...(followed
              ? [{ label: "Stop tracking", icon: X, action: onUntrack }]
              : []),
          ]}
        />
      )}
      {creating && (
        <NewInterestDialog
          interests={interests}
          onClose={() => setCreating(false)}
          onCreate={(name) => {
            onCreate(name);
            setCreating(false);
          }}
        />
      )}
    </>
  );
}
