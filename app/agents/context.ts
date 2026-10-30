import type { WorkspaceToolContext } from "../tools/context.ts";
import type { WorkspaceChatContext } from "../lib/chatWorkspace.ts";
import type { FeedStatus } from "../lib/dataSources.ts";
import type { DirectoryOrganization } from "../lib/organizations.ts";
export interface ChatAgentContext extends WorkspaceToolContext {
  modelMode?: "fast" | "reasoning";
  areaId?: string;
  context?: WorkspaceChatContext;
  sources: FeedStatus[];
  selectedOrganization?: DirectoryOrganization;
}
