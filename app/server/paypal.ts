import "server-only";
import { z } from "zod";
const base = "https://api-m.sandbox.paypal.com";
async function paypalFetch(path: string, options: RequestInit) {
  try {
    return await fetch(`${base}${path}`, {
      ...options,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error("PayPal connection failed. Retry checkout.");
  }
}
export async function paypalToken() {
  if (process.env.PAYPAL_ENVIRONMENT !== "sandbox")
    throw new Error("Only PayPal sandbox is enabled.");
  const id = process.env.PAYPAL_CLIENT_ID,
    secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Configure PayPal sandbox credentials.");
  const response = await paypalFetch("/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error("PayPal authentication failed.");
  const data = await paypalJson(response);
  return z.object({ access_token: z.string() }).parse(data).access_token;
}
export async function paypalRequest(
  path: string,
  body?: unknown,
  requestId?: string,
  method?: "PATCH",
) {
  const token = await paypalToken();
  const response = await paypalFetch(path, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204 && response.ok) return {};
  if (!response.ok)
    throw new Error(`PayPal request failed (${response.status}).`);
  return paypalJson(response);
}
async function paypalJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error("PayPal returned an invalid response. Retry.");
  }
}
