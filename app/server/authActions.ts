import "server-only";
import { z } from "zod";
import {
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { identity, authClientId } from "./identity.ts";
import { createSession, signOut } from "./auth.ts";
import {
  emailSchema as email,
  passwordSchema as password,
  newPasswordSchema,
  nameSchema as name,
  codeSchema as code,
} from "../lib/account.ts";
import { HttpError } from "./http.ts";
const emailInput = z.object({ email }).strict();
async function signIn(email: string, password: string) {
  const result = await identity.send(
    new InitiateAuthCommand({
      ClientId: authClientId(),
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: { USERNAME: email, PASSWORD: password },
    }),
  );
  if (!result.AuthenticationResult)
    throw new HttpError(
      403,
      "This account requires an unsupported sign-in challenge.",
    );
  return { user: await createSession(result.AuthenticationResult) };
}
export async function authAction(action: string, raw: unknown) {
  if (action === "sign-in") {
    const input = z.object({ email, password }).strict().parse(raw);
    return signIn(input.email, input.password);
  }
  if (action === "sign-up") {
    const input = z
      .object({ email, password: newPasswordSchema, name })
      .strict()
      .parse(raw);
    const result = await identity.send(
      new SignUpCommand({
        ClientId: authClientId(),
        Username: input.email,
        Password: input.password,
        UserAttributes: [
          { Name: "email", Value: input.email },
          { Name: "name", Value: input.name },
        ],
      }),
    );
    return { confirmationRequired: !result.UserConfirmed };
  }
  if (action === "confirm") {
    const input = z.object({ email, code }).strict().parse(raw);
    await identity.send(
      new ConfirmSignUpCommand({
        ClientId: authClientId(),
        Username: input.email,
        ConfirmationCode: input.code,
      }),
    );
    return { confirmed: true };
  }
  if (action === "resend" || action === "reset") {
    const input = emailInput.parse(raw);
    if (action === "resend")
      await identity.send(
        new ResendConfirmationCodeCommand({
          ClientId: authClientId(),
          Username: input.email,
        }),
      );
    else
      await identity.send(
        new ForgotPasswordCommand({
          ClientId: authClientId(),
          Username: input.email,
        }),
      );
    return { sent: true };
  }
  if (action === "reset-confirm") {
    const input = z
      .object({ email, password: newPasswordSchema, code })
      .strict()
      .parse(raw);
    await identity.send(
      new ConfirmForgotPasswordCommand({
        ClientId: authClientId(),
        Username: input.email,
        Password: input.password,
        ConfirmationCode: input.code,
      }),
    );
    return { updated: true };
  }
  if (action === "demo") {
    z.object({}).strict().parse(raw);
    const email = process.env.DEMO_ACCOUNT_EMAIL,
      password = process.env.DEMO_ACCOUNT_PASSWORD;
    if (!email || !password)
      throw new HttpError(503, "Demo account is not configured.");
    return signIn(email, password);
  }
  if (action === "sign-out") {
    z.object({}).strict().parse(raw);
    await signOut();
    return { signedOut: true };
  }
  throw new HttpError(404, "Account action not found.");
}
