import { z } from "zod";
export const paypalAccountStatusSchema = z.object({
  configured: z.boolean(),
  connected: z.boolean(),
  name: z.string().optional(),
  linkedAt: z.string().optional(),
});
export const paypalIdentitySchema = z.object({
  user_id: z.string().min(1).max(2048),
  name: z.string().max(200).optional(),
});
export const paypalConnectionStateSchema = z.object({
  nonce: z.string().min(32).max(128),
  owner: z.string().min(1).max(200),
  createdAt: z.number().int(),
});
export function paypalAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  nonce: string,
) {
  const url = new URL("https://www.sandbox.paypal.com/connect");
  url.search = new URLSearchParams({
    flowEntry: "static",
    client_id: clientId,
    response_type: "code",
    scope: "openid profile",
    redirect_uri: redirectUri,
    state: nonce,
    fullPage: "true",
  }).toString();
  return url.href;
}
