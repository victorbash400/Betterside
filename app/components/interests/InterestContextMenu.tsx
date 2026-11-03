import {
  FilePlus,
  FolderPlus,
  Pencil,
  FolderInput,
  Archive,
  MessageCircle,
  MapPin,
  BookmarkMinus,
  Pin,
  ArrowUpRight,
} from "lucide-react";
import ContextMenu from "../controls/ContextMenu";
import type { Interest } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import type { InterestAction } from "../../lib/interestActions";
export default function InterestContextMenu({
  x,
  y,
  interest,
  item,
  interestId,
  pinned = true,
  onAction,
  onClose,
}: {
  x: number;
  y: number;
  interest?: Interest;
  item?: MapItem;
  interestId?: string;
  pinned?: boolean;
  onAction: (action: InterestAction) => void;
  onClose: () => void;
}) {
  return (
    <ContextMenu
      x={x}
      y={y}
      onClose={onClose}
      label={item ? "Pinned item actions" : "Pin actions"}
      entries={
        item
          ? [
              {
                label: "Open",
                action: () => onAction({ kind: "open-item", item }),
              },
              {
                label: "Show on map",
                icon: MapPin,
                action: () => onAction({ kind: "map-item", item }),
              },
              {
                label: "Open source",
                icon: ArrowUpRight,
                action: () =>
                  window.open(item.source.url, "_blank", "noopener,noreferrer"),
              },
              ...(pinned
                ? [
                    {
                      label: "Move to…",
                      icon: FolderInput,
                      action: () =>
                        onAction({ kind: "move-item" as const, item }),
                    },
                  ]
                : []),
              {
                label: "Chat about this",
                icon: MessageCircle,
                action: () => onAction({ kind: "chat-item", item }),
              },
              ...(interestId
                ? [
                    {
                      label: "Remove from folder",
                      icon: BookmarkMinus,
                      action: () =>
                        onAction({
                          kind: "remove-item" as const,
                          item,
                          interestId,
                        }),
                    },
                  ]
                : []),
              {
                label: pinned ? "Unpin" : "Pin",
                icon: BookmarkMinus,
                action: () =>
                  onAction({ kind: pinned ? "remove-item" : "pin-item", item }),
                danger: pinned,
              },
            ]
          : interest
            ? interest.target
              ? [
                  {
                    label: "Unpin",
                    icon: BookmarkMinus,
                    action: () => onAction({ kind: "archive", interest }),
                  },
                ]
              : [
                  {
                    label: "Add items…",
                    icon: FilePlus,
                    action: () => onAction({ kind: "add", interest }),
                  },
                  {
                    label: "New folder…",
                    icon: FolderPlus,
                    action: () => onAction({ kind: "new", interest }),
                  },
                  {
                    label: "Rename…",
                    icon: Pencil,
                    action: () => onAction({ kind: "rename", interest }),
                  },
                  {
                    label: "Move to…",
                    icon: FolderInput,
                    action: () => onAction({ kind: "move-folder", interest }),
                  },
                  {
                    label: "Chat about this",
                    icon: MessageCircle,
                    action: () => onAction({ kind: "chat", interest }),
                  },
                  {
                    label: "Remove folder",
                    icon: Archive,
                    action: () => onAction({ kind: "archive", interest }),
                    danger: true,
                  },
                ]
            : []
      }
    />
  );
}
