import "server-only";
import { ToolLoopAgent, isStepCount } from "ai";
import { bedrockModel } from "../server/bedrock.ts";
import { workspaceTools } from "../tools/index.ts";
import { chatInstructions } from "./chatInstructions.ts";
import type { ChatAgentContext } from "./context.ts";
export async function createChatAgent(context: ChatAgentContext) {
  return new ToolLoopAgent({
    model: await bedrockModel(context.modelMode),
    instructions: chatInstructions(context),
    tools: workspaceTools(context),
    stopWhen: isStepCount(8),
    maxOutputTokens: 3000,
    maxRetries: 0,
  });
}
