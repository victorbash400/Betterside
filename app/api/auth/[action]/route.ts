import { sameOrigin, HttpError } from "../../../server/http";
import { authAction } from "../../../server/authActions";
import { authError } from "../../../server/authErrors";
export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  try {
    sameOrigin(request);
    const body = await request.text();
    if (body.length > 4096)
      throw new HttpError(413, "Account request too large.");
    let input: unknown;
    try {
      input = JSON.parse(body);
    } catch {
      throw new HttpError(400, "Invalid account request.");
    }
    return Response.json(
      await authAction((await context.params).action, input),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authError(error);
  }
}
