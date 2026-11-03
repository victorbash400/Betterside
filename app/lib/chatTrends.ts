import { z } from "zod";
import { trendScopeSchema, trendsResponseSchema } from "./trends.ts";
export const chatTrendsInputSchema = z.object({
  scopes: z.array(trendScopeSchema).min(1).max(4).optional(),
  pinIds: z.array(z.string().min(1).max(160)).min(1).max(4).optional(),
  view: z.enum(["Chart", "Compare data"]).default("Chart"),
  offset: z.number().int().nonnegative().max(20000).default(0),
}).refine((input) => Boolean(input.scopes) !== Boolean(input.pinIds), "Choose source scopes or saved pin IDs.");
export const chatTrendsResultSchema = trendsResponseSchema.extend({
  kind: z.literal("trends"),
  scopes: z.array(trendScopeSchema),
  view: z.enum(["Chart", "Compare data"]),
  total: z.number().int().nonnegative(),
  nextOffset: z.number().int().nullable(),
});
export type ChatTrendsResult = z.infer<typeof chatTrendsResultSchema>;
