import "server-only";
import { tool } from "ai";
import { saveRecordsSchema } from "../lib/chatWorkspace.ts";
export const saveRecordsTool = tool({
  description:
    "Save explicit sourced record IDs into a named record folder when asked. Use pin_items for country, cause, organization, scope or individual-record shortcuts. IDs must come from search_records or available records. No payment occurs; an interest named Donation plan is still a saved list, not a paid contribution.",
  inputSchema: saveRecordsSchema,
});
