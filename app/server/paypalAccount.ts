import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers.js";
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { database, requireTable } from "./aws.ts";
import {
  paypalAuthorizationUrl,
  paypalConnectionStateSchema,
  paypalIdentitySchema,
} from "../lib/paypalAccount.ts";
const cookieName = "betterside-paypal-connect";
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api/paypal/account",
  maxAge: 600,
};
const linkedSchema = z.object({
  identity: paypalIdentitySchema,
  linkedAt: z.string(),
});
export function paypalAccountConfigured() {
  return (
    process.env.PAYPAL_ENVIRONMENT === "sandbox" &&
    Boolean(
      process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_SECRET &&
      process.env.PAYPAL_LOGIN_REDIRECT_URI,
    )
  );
}
function redirectUri(origin: string) {
  if (!paypalAccountConfigured())
    throw new Error("PayPal account linking is not configured.");
  const uri = new URL(process.env.PAYPAL_LOGIN_REDIRECT_URI!);
  if (
    uri.origin !== origin ||
    uri.pathname !== "/api/paypal/account/callback" ||
    uri.search ||
    uri.hash ||
    (uri.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(uri.hostname))
  )
    throw new Error("PayPal return URL does not match this application.");
  return uri.href;
}
export async function paypalAccountStatus(owner: string) {
  const response = await database.send(
    new GetCommand({
      TableName: requireTable(),
      Key: { pk: `DONOR#${owner}`, sk: "PAYPALACCOUNT" },
      ConsistentRead: true,
    }),
  );
  const linked = response.Item ? linkedSchema.parse(response.Item) : undefined;
  return {
    configured: paypalAccountConfigured(),
    connected: Boolean(linked),
    ...(linked
      ? { name: linked.identity.name, linkedAt: linked.linkedAt }
      : {}),
  };
}
export async function beginPayPalConnection(owner: string, origin: string) {
  const uri = redirectUri(origin);
  const nonce = randomBytes(32).toString("base64url");
  (await cookies()).set(
    cookieName,
    Buffer.from(
      JSON.stringify({ nonce, owner, createdAt: Date.now() }),
    ).toString("base64url"),
    cookieOptions,
  );
  return paypalAuthorizationUrl(process.env.PAYPAL_CLIENT_ID!, uri, nonce);
}
export function validPayPalConnectionState(
  raw: unknown,
  owner: string,
  nonce: string,
  now = Date.now(),
) {
  const parsed = paypalConnectionStateSchema.safeParse(raw);
  if (
    !parsed.success ||
    parsed.data.owner !== owner ||
    now - parsed.data.createdAt > 600000 ||
    parsed.data.createdAt > now
  )
    return false;
  const expected = Buffer.from(parsed.data.nonce),
    actual = Buffer.from(nonce);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
async function identityRequest(path: string, options: RequestInit) {
  let response: Response;
  try {
    response = await fetch(`https://api-m.sandbox.paypal.com${path}`, {
      ...options,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error("PayPal connection failed. Retry linking.");
  }
  if (!response.ok)
    throw new Error("PayPal authorization failed. Retry linking.");
  return response.json();
}
export async function finishPayPalConnection(request: Request, owner: string) {
  const url = new URL(request.url);
  const uri = redirectUri(url.origin);
  const jar = await cookies();
  const saved = jar.get(cookieName)?.value;
  jar.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
  let state: unknown;
  try {
    state = saved
      ? JSON.parse(Buffer.from(saved, "base64url").toString("utf8"))
      : undefined;
  } catch {
    throw new Error("PayPal linking session invalid. Retry.");
  }
  if (
    !validPayPalConnectionState(
      state,
      owner,
      url.searchParams.get("state") ?? "",
    )
  )
    throw new Error("PayPal linking session expired. Retry.");
  if (url.searchParams.has("error"))
    throw new Error("PayPal linking cancelled.");
  const code = z.string().min(1).max(4096).parse(url.searchParams.get("code"));
  const token = z
    .object({ access_token: z.string().min(1), token_type: z.string() })
    .parse(
      await identityRequest("/v1/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: uri,
        }).toString(),
      }),
    );
  if (token.token_type.toLocaleLowerCase() !== "bearer")
    throw new Error("PayPal identity token rejected.");
  const identity = paypalIdentitySchema.parse(
    await identityRequest("/v1/identity/oauth2/userinfo?schema=paypalv1.1", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }),
  );
  await database.send(
    new PutCommand({
      TableName: requireTable(),
      Item: {
        pk: `DONOR#${owner}`,
        sk: "PAYPALACCOUNT",
        identity,
        linkedAt: new Date().toISOString(),
      },
    }),
  );
}
export async function disconnectPayPalAccount(owner: string) {
  await database.send(
    new DeleteCommand({
      TableName: requireTable(),
      Key: { pk: `DONOR#${owner}`, sk: "PAYPALACCOUNT" },
    }),
  );
}
