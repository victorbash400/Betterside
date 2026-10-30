import { apiError } from "../../../server/http";
export async function GET() {
  if (process.env.PAYPAL_ENVIRONMENT !== "sandbox")
    return apiError(new Error("Only PayPal sandbox is enabled."));
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId)
    return apiError(new Error("Configure PayPal sandbox credentials."));
  return Response.json(
    { clientId, currency: "USD", environment: "sandbox" },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
