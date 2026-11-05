import "server-only";
import { ZodError } from "zod";
import { apiError, HttpError } from "./http.ts";
const errors: Record<string, [number, string]> = {
  NotAuthorizedException: [
    401,
    "Email or password is incorrect, or the session has expired.",
  ],
  UserNotFoundException: [401, "Email or password is incorrect."],
  UserNotConfirmedException: [403, "Verify your email to sign in."],
  UsernameExistsException: [409, "An account with this email already exists."],
  CodeMismatchException: [400, "Incorrect verification code."],
  ExpiredCodeException: [400, "Code expired. Request a new code."],
  InvalidPasswordException: [
    400,
    "Use at least 12 characters, uppercase, lowercase, and a number.",
  ],
  TooManyRequestsException: [429, "Too many attempts. Try again later."],
  LimitExceededException: [429, "Too many attempts. Try again later."],
  PasswordResetRequiredException: [403, "Reset your password to sign in."],
};
export function authError(error: unknown) {
  if (error instanceof HttpError) return apiError(error);
  if (error instanceof ZodError)
    return apiError(
      new HttpError(
        400,
        error.issues[0]?.message ?? "Check your account details.",
      ),
    );
  const known = error instanceof Error ? errors[error.name] : undefined;
  if (known)
    return Response.json(
      { error: known[1], code: error instanceof Error ? error.name : "" },
      { status: known[0], headers: { "Cache-Control": "no-store" } },
    );
  console.error(
    "Account request failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return apiError(new HttpError(503, "Account service unavailable. Retry."));
}
