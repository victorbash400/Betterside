import "server-only";
import { cookies, headers } from "next/headers";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  GetUserCommand,
  InitiateAuthCommand,
  RevokeTokenCommand,
  type AuthenticationResultType,
} from "@aws-sdk/client-cognito-identity-provider";
import { z } from "zod";
import { database, requireTable } from "./aws.ts";
import { identity, authClientId } from "./identity.ts";
import { accountSchema } from "../lib/account.ts";
import { newSessionKey, sessionKey } from "./sessionKey.ts";
import { HttpError } from "./http.ts";
export const sessionCookie = "betterside-session";
const lifetime = 7 * 86400;
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number(),
  owner: z.guid(),
});
export async function providerAccount(accessToken: string) {
  const response = await identity.send(
    new GetUserCommand({ AccessToken: accessToken }),
  );
  const attrs = Object.fromEntries(
    (response.UserAttributes ?? []).map((item) => [item.Name, item.Value]),
  );
  const user = accountSchema.parse({
    id: attrs.sub,
    email: attrs.email,
    name: attrs.name ?? "",
    emailVerified: attrs.email_verified === "true",
    demo: attrs.email === process.env.DEMO_ACCOUNT_EMAIL,
  });
  if (!user.emailVerified)
    throw new HttpError(403, "Verify your email to sign in.");
  return user;
}
export async function createSession(result: AuthenticationResultType) {
  if (!result.AccessToken || !result.RefreshToken)
    throw new HttpError(503, "Sign-in did not return a session. Retry.");
  const user = await providerAccount(result.AccessToken);
  const { value, key } = newSessionKey(user.id);
  await database.send(
    new PutCommand({
      TableName: requireTable(),
      Item: {
        pk: key.pk,
        sk: key.sk,
        owner: user.id,
        accessToken: result.AccessToken,
        refreshToken: result.RefreshToken,
        expiresAt: Math.floor(Date.now() / 1000) + lifetime,
      },
      ConditionExpression: "attribute_not_exists(pk)",
    }),
  );
  (await cookies()).set(sessionCookie, value, {
    ...cookieOptions,
    maxAge: lifetime,
  });
  (await cookies()).delete("betterside-donor");
  return user;
}
async function readSession() {
  const key = sessionKey((await cookies()).get(sessionCookie)?.value);
  if (!key) throw new HttpError(401, "Sign in to continue.");
  const record = await database.send(
    new GetCommand({
      TableName: requireTable(),
      Key: { pk: key.pk, sk: key.sk },
      ConsistentRead: true,
    }),
  );
  const parsed = sessionSchema.safeParse(record.Item);
  if (
    !parsed.success ||
    parsed.data.expiresAt <= Date.now() / 1000 ||
    parsed.data.owner !== key.owner
  )
    throw new HttpError(401, "Session expired. Sign in again.");
  const session = parsed.data;
  let token = session.accessToken;
  let user;
  try {
    user = await providerAccount(token);
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "NotAuthorizedException")
      throw error;
    const refreshed = await identity.send(
      new InitiateAuthCommand({
        ClientId: authClientId(),
        AuthFlow: "REFRESH_TOKEN_AUTH",
        AuthParameters: { REFRESH_TOKEN: session.refreshToken },
      }),
    );
    if (!refreshed.AuthenticationResult?.AccessToken)
      throw new HttpError(401, "Session expired. Sign in again.");
    token = refreshed.AuthenticationResult.AccessToken;
    user = await providerAccount(token);
    await database.send(
      new UpdateCommand({
        TableName: requireTable(),
        Key: { pk: key.pk, sk: key.sk },
        UpdateExpression: "SET accessToken = :token",
        ConditionExpression: "attribute_exists(pk)",
        ExpressionAttributeValues: { ":token": token },
      }),
    );
  }
  if (user.id !== key.owner)
    throw new HttpError(401, "Invalid account session.");
  const expected = (await headers()).get("x-betterside-account");
  if (expected && expected !== user.id)
    throw new HttpError(409, "Account changed. Reload before saving.");
  return { user, token, key, refreshToken: session.refreshToken };
}
export async function requireAccount() {
  return (await requireSession()).user;
}
export async function signOut() {
  const key = sessionKey((await cookies()).get(sessionCookie)?.value);
  if (key) {
    const expected = (await headers()).get("x-betterside-account");
    if (expected && expected !== key.owner)
      throw new HttpError(409, "Account changed. Reload before signing out.");
    const record = await database.send(
      new GetCommand({
        TableName: requireTable(),
        Key: { pk: key.pk, sk: key.sk },
        ConsistentRead: true,
      }),
    );
    await database.send(
      new DeleteCommand({
        TableName: requireTable(),
        Key: { pk: key.pk, sk: key.sk },
      }),
    );
    if (record.Item?.refreshToken) {
      try {
        await identity.send(
          new RevokeTokenCommand({
            ClientId: authClientId(),
            Token: record.Item.refreshToken,
          }),
        );
      } catch (error) {
        if (
          !(error instanceof Error) ||
          error.name !== "NotAuthorizedException"
        )
          throw error;
      }
    }
  }
  (await cookies()).set(sessionCookie, "", { ...cookieOptions, maxAge: 0 });
}

export async function requireSession() {
  try {
    return await readSession();
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "NotAuthorizedException",
        "UserNotFoundException",
        "ConditionalCheckFailedException",
      ].includes(error.name)
    )
      throw new HttpError(401, "Session expired. Sign in again.");
    throw error;
  }
}
