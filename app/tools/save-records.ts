import "server-only";
import { tool } from "ai";
import { saveRecordsSchema } from "../lib/chatWorkspace.ts";
export const saveRecordsTool = tool({
  description:
    "Save explicit sourced record IDs into a named interest folder when asked. IDs must come from search_records or available records. No payment occurs; an interest named Donation plan is still a saved list, not a paid contribution.",
  inputSchema: saveRecordsSchema,
});
