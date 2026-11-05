import {
  ChangePasswordCommand,
  UpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";
import { identity } from "../../server/identity";
import { requireSession, providerAccount } from "../../server/auth";
import { authError } from "../../server/authErrors";
import { sameOrigin, HttpError } from "../../server/http";
import {
  nameSchema,
  passwordSchema,
  newPasswordSchema,
} from "../../lib/account";
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const { token, user } = await requireSession();
    if (user.demo)
      throw new HttpError(403, "Create an account to change login details.");
    const raw = await request.text();
    if (raw.length > 4096)
      throw new HttpError(413, "Account request too large.");
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new HttpError(400, "Invalid account request.");
    }
    const input = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("name"), name: nameSchema }).strict(),
        z
          .object({
            action: z.literal("password"),
            currentPassword: passwordSchema,
            password: newPasswordSchema,
          })
          .strict(),
      ])
      .parse(payload);
    if (input.action === "name")
      await identity.send(
        new UpdateUserAttributesCommand({
          AccessToken: token,
          UserAttributes: [{ Name: "name", Value: input.name }],
        }),
      );
    else {
      try {
        await identity.send(
          new ChangePasswordCommand({
            AccessToken: token,
            PreviousPassword: input.currentPassword,
            ProposedPassword: input.password,
          }),
        );
      } catch (error) {
        if (error instanceof Error && error.name === "NotAuthorizedException")
          throw new HttpError(400, "Current password is incorrect.");
        throw error;
      }
    }
    return Response.json(
      { user: await providerAccount(token) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authError(error);
  }
}
