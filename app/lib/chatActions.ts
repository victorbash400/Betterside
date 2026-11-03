import { z } from "zod";
import { trendScopeSchema } from "./trends.ts";
export const chatActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("manage-goal"), goalId: z.string().min(1).max(100), revision: z.number().int().nonnegative(), action: z.enum(["pause", "resume", "cancel", "refresh", "remove"]) }),
  z.object({ kind: z.literal("show-trends"), scopes: z.array(trendScopeSchema).min(1).max(4), view: z.enum(["Chart", "Compare data"]), offset: z.number().int().nonnegative().max(20000) }),
  z.object({ kind: z.literal("list-pins"), offset: z.number().int().nonnegative().max(20000) }),
]);
export type ChatAction = z.infer<typeof chatActionSchema>;
export type ChatMessageAction = (text: string, action?: ChatAction) => void;
