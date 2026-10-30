import "server-only";
import { tool } from "ai";
import { checkoutInputSchema } from "../lib/chatWorkspace.ts";
export const openCheckoutTool = tool({
  description:
    "Open the PayPal sandbox checkout popup immediately. Project and USD amount are optional: the user can choose them in the popup. Use when asked to open checkout, payment options or the PayPal popup. This opens a form, not a payment or completed order.",
  inputSchema: checkoutInputSchema,
});
