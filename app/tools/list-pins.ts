import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { loadTracking } from "../server/tracking.ts";
import { emptyTracking } from "../lib/tracking.ts";
import { chatPins, pinsResultSchema } from "../lib/chatPins.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function listPinsTool({ donor, records }: WorkspaceToolContext) {
  return tool({
    description: "Read this user's current pins and saved folders, including country/cause scopes, organizations, and records. Returns exact pin IDs and an inline list. Use before opening, comparing, or removing pins; never infer pins from chat history. The UI renders the list; do not repeat names or IDs in prose.",
    inputSchema: z.object({ offset: z.number().int().nonnegative().max(20000).default(0) }),
    outputSchema: pinsResultSchema,
    execute: async ({ offset }) => {
      const pins = chatPins((await loadTracking(donor)).snapshot ?? emptyTracking, records);
      return { kind: "pins" as const, action: "listed" as const, changed: 0, pins: pins.slice(offset, offset + 20), total: pins.length, nextOffset: offset + 20 < pins.length ? offset + 20 : null };
    },
  });
}
