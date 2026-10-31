import test from "node:test";
import assert from "node:assert/strict";
import {
  paypalAuthorizationUrl,
  paypalIdentitySchema,
} from "../app/lib/paypalAccount.ts";
import {
  validPayPalConnectionState,
  beginPayPalConnection,
} from "../app/server/paypalAccount.ts";
test("PayPal linking requests identity consent only and uses the registered return URL", () => {
  const url = new URL(
    paypalAuthorizationUrl(
      "public-client",
      "https://example.com/api/paypal/account/callback",
      "n".repeat(43),
    ),
  );
  assert.equal(url.origin, "https://www.sandbox.paypal.com");
  assert.equal(url.searchParams.get("scope"), "openid profile");
  assert.equal(
    url.searchParams.get("redirect_uri"),
    "https://example.com/api/paypal/account/callback",
  );
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.has("client_secret"), false);
  assert.equal(paypalIdentitySchema.safeParse({ user_id: "" }).success, false);
});
test("PayPal callback state is bound to the initiating account, nonce and time window", () => {
  const state = {
    nonce: "n".repeat(43),
    owner: "account-a",
    createdAt: 1000000,
  };
  assert.equal(
    validPayPalConnectionState(state, "account-a", state.nonce, 1000001),
    true,
  );
  assert.equal(
    validPayPalConnectionState(state, "account-b", state.nonce, 1000001),
    false,
  );
  assert.equal(
    validPayPalConnectionState(state, "account-a", "x".repeat(43), 1000001),
    false,
  );
  assert.equal(
    validPayPalConnectionState(state, "account-a", state.nonce, 1600001),
    false,
  );
  assert.equal(
    validPayPalConnectionState(state, "account-a", state.nonce, 999999),
    false,
  );
});
test("unconfigured PayPal linking fails before creating cookies or pretending to connect", async () => {
  const previous = process.env.PAYPAL_LOGIN_REDIRECT_URI;
  delete process.env.PAYPAL_LOGIN_REDIRECT_URI;
  try {
    await assert.rejects(
      () => beginPayPalConnection("account-a", "http://localhost:3000"),
      { message: "PayPal account linking is not configured." },
    );
  } finally {
    if (previous === undefined) delete process.env.PAYPAL_LOGIN_REDIRECT_URI;
    else process.env.PAYPAL_LOGIN_REDIRECT_URI = previous;
  }
});
