import type { Interest } from "./tracking";
import type { MapItem } from "./types";
export type InterestAction =
  | {
      kind: "add" | "new" | "rename" | "move-folder" | "archive" | "chat";
      interest: Interest;
    }
  | {
      kind:
        "pin-item" | "open-item" | "map-item" | "move-item" | "remove-item" | "chat-item";
      item: MapItem;
      interestId?: string;
    };
