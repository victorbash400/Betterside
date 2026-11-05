import "server-only";
import { HttpError } from "./http.ts";
import { requireAccount } from "./auth.ts";
export async function donorSession() {
  try {
    return (await requireAccount()).id;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error(
      "Account lookup failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    throw new HttpError(503, "Account service unavailable. Retry.");
  }
}
