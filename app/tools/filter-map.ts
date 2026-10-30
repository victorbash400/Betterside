import "server-only";
import { tool } from "ai";
import { mapFilterSchema } from "../lib/chatWorkspace.ts";
export const filterMapTool = tool({
  description:
    "Apply the map's country, cause layers and visualization controls. Use exact country names returned by search or empty string for all countries. An empty causes array removes every layer. Map and Table remain separate; this opens Map. Only do this when the user asks to change/show/filter the map.",
  inputSchema: mapFilterSchema,
});
