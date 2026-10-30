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
      offset: z.number().int().min(0).max(20000).default(0),
    }),
    execute: async ({ status, offset }) => {
      const records = (await contributions(donor)).filter(
        (record) => !status || record.status === status,
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
