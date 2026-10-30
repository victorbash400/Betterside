import "server-only";
import { tool } from "ai";
import { focusOrganizationSchema } from "../lib/chatWorkspace.ts";
export const focusOrganizationTool = tool({
  description:
    "Focus a source organization from search_organizations in the map drawer. Choose explicit supported topics from that organization's returned topics; empty topics draws no layers. Crisis measurements are scoped to reported operations, never organization impact or beneficiaries.",
  inputSchema: focusOrganizationSchema,
});
