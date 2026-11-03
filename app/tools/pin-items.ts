import "server-only";
import { tool } from "ai";
import { pinItemsSchema, unpinItemsSchema, pinsResultSchema } from "../lib/chatPins.ts";
export const pinItemsTool = tool({
  description: "Pin countries, global causes, causes within countries, organizations (optionally within a country), or source records when requested. Use exact country codes, concern IDs, organization IDs and record IDs from sourced results. A scope pins e.g. Hunger in Pakistan; pinning never creates a payment. The live client persists the result before confirming success.",
  inputSchema: pinItemsSchema,
  outputSchema: pinsResultSchema,
});
export const unpinItemsTool = tool({
  description: "Remove explicitly requested pins using exact IDs from list_pins. This does not delete source data, cancel goals or subscriptions, or alter payments.",
  inputSchema: unpinItemsSchema,
  outputSchema: pinsResultSchema,
});
