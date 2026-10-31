import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { createHash } from "node:crypto";
import { createPayPalOrder } from "../server/createPayPalOrder.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function preparePaymentTool({
  records,
  donor,
  origin,
}: WorkspaceToolContext) {
  return tool({
    description:
      "Create a real PayPal SANDBOX order and render its approval card inline. Only when the user explicitly requests checkout for a specific available demonstration project and an exact USD amount. Search projects first if needed. For an assigned contribution, use goalId returned by list_goals; the service verifies ownership and cause. Real source organizations cannot be paid through this tool. This prepares an order only: the user must approve payment in PayPal. Never capture, approve or claim payment completion.",
    inputSchema: z.object({
      projectId: z.string().min(1).max(160),
      goalId: z.string().min(1).max(100).optional(),
      amount: z.string().max(12),
    }),
    execute: async (input, { toolCallId }) => {
      if (!records.some((record) => record.project?.id === input.projectId))
        throw new Error("Project unavailable in this workspace.");
      const requestId = createHash("sha256")
        .update(JSON.stringify([donor, toolCallId]))
        .digest("hex")
        .slice(0, 38);
      return createPayPalOrder({
        ...input,
        donor,
        originUrl: origin,
        requestId,
      });
    },
  });
}
