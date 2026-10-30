import { donorSession } from "../../server/donor";
import { loadTracking } from "../../server/tracking";
import { loadDiscovery } from "../../server/discovery";
import { createChatAgent } from "../../agents/chat";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  validateUIMessages,
} from "ai";
import { z } from "zod";
import { workspaceChatContextSchema } from "../../lib/chatWorkspace";
import { loadOrganizationDirectory } from "../../server/organizationDirectory";
import { loadCatalogue } from "../../server/catalogue";
import { modelError } from "../../lib/modelError";
import { sameOrigin, apiError } from "../../server/http";
export const maxDuration = 120;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = z
      .object({
        messages: z.array(z.unknown()).min(1).max(80),
        model: z.enum(["fast", "reasoning"]).optional(),
        areaId: z.string().optional(),
        context: workspaceChatContextSchema.optional(),
        recordIds: z.array(z.string().max(160)).max(20000).optional(),
      })
      .passthrough()
      .parse(await request.json());
    const messages = await validateUIMessages({ messages: input.messages });
    const size = JSON.stringify(messages).length;
    if (size > 512000)
      throw new Error("Conversation too long. Start a new conversation.");
    const [catalogue, discovery] = await Promise.all([
      loadCatalogue(),
      loadDiscovery(),
    ]);
    const donor = await donorSession(true);
    if (!donor) throw new Error("Visitor session unavailable.");
    const saved = donor
      ? ((await loadTracking(donor)).snapshot?.savedItems ?? [])
      : [];
    const allRecords = Array.from(
      new Map(
        [...saved, ...catalogue, ...discovery.issues].map((item) => [
          item.id,
          item,
        ]),
      ).values(),
    );
    const selectedOrganization = input.context?.organizationId
      ? (await loadOrganizationDirectory()).organizations.find(
          (org) => org.id === input.context!.organizationId,
        )
      : undefined;
    const agent = await createChatAgent({
      records: allRecords,
      selectedIds: input.recordIds,
      donor,
      origin: request.url,
      areaId: input.areaId,
      context: input.context,
      sources: discovery.sources,
      selectedOrganization,
      modelMode: input.model,
    });
    const result = await agent.stream({
      messages: await convertToModelMessages(messages),
      abortSignal: request.signal,
    });
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: modelError,
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
