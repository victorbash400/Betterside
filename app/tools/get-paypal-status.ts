import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { paypalAccountStatus } from "../server/paypalAccount.ts";
import { paypalStatusResultSchema } from "../lib/chatPayPal.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function getPayPalStatusTool({ donor }: WorkspaceToolContext) {
  return tool({
    description: "Read this account's PayPal sandbox connection and checkout configuration without exposing credentials or starting a payment. A connected account is not proof of payment or subscription approval. Opening checkout and approving a payment are separate actions.",
    inputSchema: z.object({}),
    outputSchema: paypalStatusResultSchema,
    execute: async () => paypalStatusResultSchema.parse({
      ...await paypalAccountStatus(donor), kind: "paypal-status", environment: "sandbox",
      checkoutConfigured: process.env.PAYPAL_ENVIRONMENT === "sandbox" && Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_MERCHANT_ID),
    }),
  });
}
