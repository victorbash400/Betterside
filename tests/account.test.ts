import test from "node:test";
import assert from "node:assert/strict";
import {
  accountSchema,
  emailSchema,
  codeSchema,
  newPasswordSchema,
} from "../app/lib/account.ts";
import { accountStorageKey } from "../app/lib/accountStorage.ts";
import { newSessionKey, sessionKey } from "../app/server/sessionKey.ts";
const owner = "84688448-b001-70e1-c290-19f526a76db3";
test("Cognito account identifiers retain their provider format", () => {
  assert.equal(
    accountSchema.parse({
      id: owner,
      email: "demo@example.com",
      name: "Demo",
      emailVerified: true,
    }).id,
    owner,
  );
  assert.equal(
    accountSchema.safeParse({
      id: "arbitrary-cookie-owner",
      email: "a@example.com",
      name: "",
      emailVerified: true,
    }).success,
    false,
  );
});
test("opaque session tokens are random, hashed, and validated before constructing a database key", () => {
  const first = newSessionKey(owner),
    second = newSessionKey(owner);
  assert.notEqual(first.value, second.value);
  assert.equal(sessionKey(first.value)?.owner, owner);
  assert.equal(first.key.sk.includes(first.value.split(".")[1]), false);
  for (const value of [
    undefined,
    "",
    owner,
    `${owner}.bad`,
    `${owner}.${"a".repeat(64)}.extra`,
    `arbitrary.${"a".repeat(64)}`,
  ])
    assert.equal(sessionKey(value), null);
});
test("browser keys isolate histories, drafts and preferences across accounts", () => {
  for (const name of [
    "chats",
    "chat:default",
    "draft:default",
    "appearance",
    "model",
  ])
    assert.notEqual(
      accountStorageKey(owner, name),
      accountStorageKey("another-owner", name),
    );
});
test("password and confirmation validation is deterministic", () => {
  assert.equal(
    newPasswordSchema.safeParse("long-without-uppercase9").success,
    false,
  );
  assert.equal(newPasswordSchema.safeParse("LongPassword9").success, true);
  assert.equal(codeSchema.safeParse("123456").success, true);
  assert.equal(codeSchema.safeParse("12a456").success, false);
});

test("email identifiers normalize before validation", () => {
  assert.equal(
    emailSchema.parse("  VictorBash400@GMAIL.COM  "),
    "victorbash400@gmail.com",
  );
});
