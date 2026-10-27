import {
  FilePlus,
  FolderPlus,
  Pencil,
  FolderInput,
  Archive,
  MessageCircle,
  MapPin,
  BookmarkMinus,
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
  onAction,
  onClose,
}: {
  x: number;
  y: number;
  interest?: Interest;
  item?: MapItem;
  interestId?: string;
  onAction: (action: InterestAction) => void;
  onClose: () => void;
}) {
  return (
    <ContextMenu
      x={x}
      y={y}
      onClose={onClose}
      label={item ? "Tracked item actions" : "Interest actions"}
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
              {
                label: "Move to…",
                icon: FolderInput,
                action: () => onAction({ kind: "move-item", item }),
              },
              {
                label: "Chat about this",
                icon: MessageCircle,
                action: () => onAction({ kind: "chat-item", item }),
              },
              ...(interestId
                ? [
                    {
                      label: "Remove from interest",
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
                label: "Stop tracking",
                icon: BookmarkMinus,
                action: () => onAction({ kind: "remove-item", item }),
                danger: true,
              },
            ]
          : interest
            ? [
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
                  label: "Remove interest",
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
