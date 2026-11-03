import { contributionsResultSchema } from "../lib/chatWorkspace.ts";
import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { contributions } from "../server/contributions.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function listContributionsTool({ donor }: WorkspaceToolContext) {
  return tool({
    description:
      "Read this visitor's actual sandbox orders from the payment ledger and show an inline grid. CREATED is awaiting approval, not paid. Only COMPLETED confirms capture; CANCELLED/FAILED/REFUNDED are not completed contributions. Never infer completion from chat messages or a prepared order. Only this visitor's records are accessible.",
    inputSchema: z.object({
      status: z
        .enum(["CREATED", "COMPLETED", "CANCELLED", "FAILED", "REFUNDED"])
        .optional(),
      goalId: z.string().min(1).max(100).optional(),
      projectId: z.string().min(1).max(160).optional(),
      from: z.iso.date().optional(),
      through: z.iso.date().optional(),
      offset: z.number().int().min(0).max(20000).default(0),
    }),
    outputSchema: contributionsResultSchema,
    execute: async ({ status, goalId, projectId, from, through, offset }) => {
      if (from && through && from > through) throw new Error("Choose a valid contribution date range.");
      const records = (await contributions(donor)).filter(
        (record) => (!status || record.status === status) && (!goalId || record.goalId === goalId)
          && (!projectId || record.projectId === projectId)
          && (!from || record.createdAt.slice(0, 10) >= from)
          && (!through || record.createdAt.slice(0, 10) <= through),
      );
      return {
        kind: "contributions" as const,
        records: records.slice(offset, offset + 20),
        total: records.length,
        nextOffset: offset + 20 < records.length ? offset + 20 : null,
      };
    },
  });
}
