import { z } from "zod";
export const analysisSchema = z.object({
  id: z.string(),
  kind: z.enum(["funding-by-area", "funding-by-issue", "project-comparison"]),
});
export type Analysis = z.infer<typeof analysisSchema>;
