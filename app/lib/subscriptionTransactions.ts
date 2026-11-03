import { z } from "zod";

const transactionSchema = z.object({
  id: z.string(),
  status: z.string(),
  time: z.string(),
  amount_with_breakdown: z.object({
    gross_amount: z.object({ currency_code: z.string(), value: z.string() }),
  }),
});

export const subscriptionTransactionsSchema = z.union([
  z.object({
    transactions: z.array(transactionSchema),
    links: z.array(z.object({ rel: z.string(), href: z.url() })).optional(),
  }),
  z
    .object({})
    .strict()
    .transform(() => ({ transactions: [], links: [] })),
]);

export type SubscriptionTransaction = z.infer<typeof transactionSchema>;
