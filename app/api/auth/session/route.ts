import { requireAccount } from "../../../server/auth";
import { authError } from "../../../server/authErrors";
export async function GET() {
  try {
    return Response.json(
      { user: await requireAccount() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authError(error);
  }
}
