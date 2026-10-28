import { settingsConfigurationSchema } from "../../lib/settings";
export function GET() {
  const data = settingsConfigurationSchema.parse({
    models: {
      fast: process.env.BEDROCK_MODEL_ID || null,
      reasoning: process.env.BEDROCK_REASONING_MODEL_ID || null,
      audio: process.env.BEDROCK_AUDIO_MODEL_ID || null,
    },
    paypal: {
      sandbox: process.env.PAYPAL_ENVIRONMENT === "sandbox",
      credentials: Boolean(
        process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
      ),
      webhook: Boolean(process.env.PAYPAL_WEBHOOK_ID),
    },
  });
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
