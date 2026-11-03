import { z } from "zod";
import { goalCategories } from "./profile.ts";
import { amountInCents } from "./payment.ts";
import type { MapItem } from "./types.ts";

export const subscriptionSetupSchema = z
  .object({
    goalId: z.string().min(1).max(100),
    projectId: z.string().min(1).max(160),
    category: z.enum(goalCategories),
    amount: z.string().refine((value) => {
      try {
        const cents = amountInCents(value);
        return cents >= 100 && cents <= 1000000;
      } catch {
        return false;
      }
    }, "Enter an amount from $1 to $10,000."),
  })
  .strict();

export function subscriptionProjects(records: MapItem[], category: string) {
  return records.filter(
    (item) => item.project?.demonstration && item.kind === category,
  );
}
