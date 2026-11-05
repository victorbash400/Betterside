import "server-only";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin)
    throw new HttpError(403, "Request origin rejected.");
}
export function apiError(error: unknown, status = 400) {
  return Response.json(
    {
      error:
        error instanceof ZodError
          ? "Invalid response data. Retry."
          : error instanceof Error
            ? error.message
            : "Request failed.",
    },
    {
      status: error instanceof HttpError ? error.status : status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
