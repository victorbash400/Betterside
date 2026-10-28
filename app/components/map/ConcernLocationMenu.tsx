import { useState } from "react";
import { ListFilter } from "lucide-react";
import IconButton from "../controls/IconButton";
import ContextMenu from "../controls/ContextMenu";
import type { OverlayPoint } from "../../lib/overlayData";
import { concerns } from "../../lib/concerns";
export default function ConcernLocationMenu({
  points,
  selected,
  onSelect,
}: {
  points: OverlayPoint[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <IconButton
        label="Choose nearby concern"
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setMenu({ x: rect.left, y: rect.bottom + 5 });
        }}
      >
        <ListFilter />
      </IconButton>
      {menu && (
        <ContextMenu
          {...menu}
          label="Nearby concerns"
          onClose={() => setMenu(null)}
          entries={points.map((point) => ({
            id: point.id,
            label: point.location,
            detail: concerns.find((entry) => entry.id === point.concern)!.label,
            selected: point.id === selected,
            action: () => onSelect(point.id),
          }))}
        />
      )}
    </>
  );
}
