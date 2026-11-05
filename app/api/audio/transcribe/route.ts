import { requireAccount } from "../../../server/auth";
import { sameOrigin, apiError } from "../../../server/http";
import { transcribe } from "../../../server/transcription";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireAccount();
    return Response.json({ text: await transcribe(request) });
  } catch (error) {
    return apiError(error);
  }
}
