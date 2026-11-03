import { z } from "zod";
import { paypalAccountStatusSchema } from "./paypalAccount.ts";
export const paypalStatusResultSchema = paypalAccountStatusSchema.extend({
  kind: z.literal("paypal-status"),
  environment: z.literal("sandbox"),
  checkoutConfigured: z.boolean(),
});
