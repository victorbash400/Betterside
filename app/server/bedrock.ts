import "server-only";
import { getTokenProvider } from "@aws/bedrock-token-generator";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Agent, fetch as request } from "undici";
import { awsLookup } from "./aws-dns.ts";
const dispatcher = new Agent({
  connect: { lookup: awsLookup, family: 4, timeout: 10000 },
  headersTimeout: 50000,
  bodyTimeout: 50000,
});
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Configure ${name}.`);
  return value;
}
async function provider(audio = false) {
  const token = await getTokenProvider({
    region: required("AWS_REGION"),
    expiresInSeconds: 300,
  })();
  const provider = createOpenAICompatible({
    name: "betterside-bedrock",
    baseURL: audio
      ? new URL("/openai/v1", required("BEDROCK_BASE_URL")).href
      : required("BEDROCK_BASE_URL"),
    supportsStructuredOutputs: audio,
    headers: {
      Authorization: `Bearer ${token}`,
      "OpenAI-Project": required("BEDROCK_PROJECT_ID"),
    },
    fetch: (url, options) =>
      (request as unknown as typeof fetch)(url, {
        ...options,
        dispatcher,
      } as RequestInit & { dispatcher: Agent }),
  });
  return provider;
}
export async function bedrockModel(mode: "fast" | "reasoning" = "fast") {
  return (await provider()).chatModel(
    required(
      mode === "reasoning" ? "BEDROCK_REASONING_MODEL_ID" : "BEDROCK_MODEL_ID",
    ),
  );
}
export async function bedrockAudioModel() {
  return (await provider(true)).chatModel(required("BEDROCK_AUDIO_MODEL_ID"));
}
