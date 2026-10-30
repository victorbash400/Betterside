import type { MapItem } from "../lib/types.ts";
export interface WorkspaceToolContext {
  records: MapItem[];
  selectedIds?: string[];
  donor: string;
  origin: string;
}
