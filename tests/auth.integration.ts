import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { Agent } from "node:https";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { awsLookup } from "../app/server/aws-dns.ts";
import {
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "../app/server/aws.ts";
import { sessionKey } from "../app/server/sessionKey.ts";
import { emptyTracking } from "../app/lib/tracking.ts";
import { emptyProfile } from "../app/lib/profile.ts";
const base = process.env.AUTH_TEST_ORIGIN ?? "http://localhost:3000";
const pool = process.env.COGNITO_USER_POOL_ID;
const require = createRequire(import.meta.url);
const provider = createRequire(
  require.resolve("@aws-sdk/client-cognito-identity-provider"),
);
const adminClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: provider("@aws-sdk/credential-provider-ini").fromIni({
    profile: "operator-provisioning",
  }),
  maxAttempts: 1,
  requestHandler: {
    connectionTimeout: 10000,
    requestTimeout: 15000,
    throwOnRequestTimeout: true,
    httpsAgent: new Agent({ lookup: awsLookup }),
  },
});
function browser() {
  const jar = new Map<string, string>();
  return {
    jar,
    async request(
      path: string,
      body?: unknown,
      headers?: Record<string, string>,
      method?: string,
    ) {
      const response = await fetch(`${base}${path}`, {
        method: method ?? (body === undefined ? "GET" : "POST"),
        signal: AbortSignal.timeout(25000),
        headers: {
          Origin: base,
          "Content-Type": "application/json",
          Cookie: Array.from(jar, ([key, value]) => `${key}=${value}`).join(
            "; ",
          ),
          ...headers,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(";")[0],
          split = pair.indexOf("=");
        jar.set(
          pair.slice(0, split),
          decodeURIComponent(pair.slice(split + 1)),
        );
      }
      return { status: response.status, data: await response.json() };
    },
  };
}
test(
  "live Cognito sessions isolate account data and reject anonymous, stale, forged and revoked requests",
  { timeout: 180000 },
  async (t) => {
    assert.ok(pool, "Provision the BetterSide auth stack first.");
    assert.equal(requireTable(), "BetterSide-dev");
    const suffix = randomUUID();
    const emails = [`qa-a-${suffix}@example.com`, `qa-b-${suffix}@example.com`];
    const password = `BetterSide9-${randomBytes(20).toString("hex")}`;
    const owners: string[] = [];
    try {
      for (const email of emails) {
        const result = await adminClient.send(
          new AdminCreateUserCommand({
            UserPoolId: pool,
            Username: email,
            MessageAction: "SUPPRESS",
            UserAttributes: [
              { Name: "email", Value: email },
              { Name: "email_verified", Value: "true" },
              { Name: "name", Value: "QA" },
            ],
          }),
        );
        const owner = result.User?.Attributes?.find(
          (item) => item.Name === "sub",
        )?.Value;
        if (owner) owners.push(owner);
        await adminClient.send(
          new AdminSetUserPasswordCommand({
            UserPoolId: pool,
            Username: email,
            Password: password,
            Permanent: true,
          }),
        );
      }
      t.diagnostic("Created two isolated Cognito fixtures.");
      const guest = browser();
      for (const path of [
        "/api/profile",
        "/api/tracking",
        "/api/contributions",
      ])
        assert.equal((await guest.request(path)).status, 401, path);
      guest.jar.set("betterside-donor", "forged-visitor");
      assert.equal((await guest.request("/api/tracking")).status, 401);
      assert.equal(
        (
          await guest.request("/api/auth/sign-in", {
            email: emails[0],
            password: "wrong-password",
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await guest.request(
            "/api/auth/sign-in",
            { email: emails[0], password },
            { Origin: "https://untrusted.example.com" },
          )
        ).status,
        403,
      );
      const a = browser(),
        b = browser();
      const loginA = await a.request("/api/auth/sign-in", {
        email: emails[0],
        password,
      });
      const loginB = await b.request("/api/auth/sign-in", {
        email: emails[1],
        password,
      });
      assert.equal(loginA.status, 200);
      assert.equal(loginB.status, 200);
      assert.equal(owners[0], loginA.data.user.id);
      assert.equal(owners[1], loginB.data.user.id);
      t.diagnostic("Both fixtures signed in through the running application.");
      assert.notEqual(owners[0], owners[1]);
      const tracking = {
        ...emptyTracking,
        interests: [
          {
            id: suffix,
            name: "Private QA interest",
            issueIds: [],
            hiddenKinds: [],
          },
        ],
      };
      assert.equal(
        (
          await a.request(
            "/api/tracking",
            { snapshot: tracking, revision: 0 },
            undefined,
            "PUT",
          )
        ).status,
        200,
      );
      assert.equal(
        (await a.request("/api/tracking")).data.snapshot.interests[0].id,
        suffix,
      );
      assert.equal((await b.request("/api/tracking")).data.snapshot, null);
      const directory = await guest.request("/api/organization-directory");
      assert.equal(directory.status, 200);
      const recipient = directory.data.organizations.find((org: { donateUrl: string | null }) => org.donateUrl?.startsWith("https://"));
      assert.ok(recipient, "A sourced donation destination is required for this fixture.");
      const profile = { ...emptyProfile, name: "Private QA profile", goals: [{
        id: suffix, category: "All causes", period: "monthly", targetCents: 10000,
        targetText: "Private QA target", status: "paused",
        organization: {id: recipient.id, name: "Untrusted name", donateUrl: "https://untrusted.example.com/donate"},
        createdAt: new Date().toISOString(),
      }] };
      assert.equal(
        (
          await a.request(
            "/api/profile",
            { profile, revision: 0 },
            undefined,
            "PUT",
          )
        ).status,
        200,
      );
      const storedGoal = (await a.request("/api/profile")).data.profile.goals[0];
      assert.equal(storedGoal.targetText, "Private QA target");
      assert.equal(storedGoal.status, "paused");
      assert.equal(storedGoal.organization.name, recipient.name);
      assert.equal(storedGoal.organization.donateUrl, recipient.donateUrl, "recipient links must come from the server catalogue");
      assert.equal((await b.request("/api/profile")).data.profile.goals.length, 0);
      assert.equal((await b.request("/api/profile")).data.profile.name, "");
      assert.equal(
        (
          await b.request(
            "/api/profile",
            { profile, revision: 0 },
            { "X-BetterSide-Account": owners[0] },
            "PUT",
          )
        ).status,
        409,
      );
      const renamed = await a.request(
        "/api/account",
        { action: "name", name: "QA Updated" },
        undefined,
        "PATCH",
      );
      assert.equal(renamed.status, 200);
      assert.equal(renamed.data.user.name, "QA Updated");
      assert.equal(
        (await a.request("/api/auth/session")).data.user.name,
        "QA Updated",
      );
      assert.equal((await b.request("/api/auth/session")).data.user.name, "QA");
      t.diagnostic("Profile, interest, and stale-account guards verified.");
      assert.equal(
        (
          await a.request(
            "/api/account",
            {
              action: "password",
              currentPassword: "wrong-password",
              password: `${password}Updated9`,
            },
            undefined,
            "PATCH",
          )
        ).status,
        400,
      );
      assert.equal(
        (await a.request("/api/auth/session")).status,
        200,
        "a password typo keeps the session",
      );
      const newPassword = `${password}Updated9`;
      const changed = await a.request(
        "/api/account",
        {
          action: "password",
          currentPassword: password,
          password: newPassword,
        },
        undefined,
        "PATCH",
      );
      assert.equal(changed.status, 200);
      assert.equal(
        (
          await guest.request("/api/auth/sign-in", {
            email: emails[0],
            password,
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await guest.request("/api/auth/sign-in", {
            email: emails[0],
            password: newPassword,
          })
        ).status,
        200,
      );
      assert.equal((await guest.request("/api/auth/sign-out", {})).status, 200);
      const cookie = a.jar.get("betterside-session")!;
      const key = sessionKey(cookie)!;
      await database.send(
        new UpdateCommand({
          TableName: requireTable(),
          Key: { pk: key.pk, sk: key.sk },
          UpdateExpression: "SET accessToken = :token",
          ExpressionAttributeValues: {
            ":token": "invalid-expired-access-token",
          },
        }),
      );
      assert.equal(
        (await a.request("/api/auth/session")).status,
        200,
        "refresh on a rejected access token",
      );
      assert.equal((await a.request("/api/auth/sign-out", {})).status, 200);
      a.jar.set("betterside-session", cookie);
      assert.equal(
        (await a.request("/api/auth/session")).status,
        401,
        "revoked cookie replay",
      );
      assert.equal(
        (await b.request("/api/auth/session")).status,
        200,
        "other account remains signed in",
      );
      b.jar.set("betterside-session", `${owners[0]}.${"a".repeat(64)}`);
      assert.equal(
        (await b.request("/api/profile")).status,
        401,
        "forged session owner",
      );
    } finally {
      for (const owner of owners) {
        const result = await database.send(
          new QueryCommand({
            TableName: requireTable(),
            KeyConditionExpression: "pk = :pk",
            ExpressionAttributeValues: { ":pk": `DONOR#${owner}` },
          }),
        );
        for (const item of result.Items ?? [])
          await database.send(
            new DeleteCommand({
              TableName: requireTable(),
              Key: { pk: item.pk, sk: item.sk },
            }),
          );
      }
      for (const email of emails) {
        try {
          await adminClient.send(
            new AdminDeleteUserCommand({ UserPoolId: pool, Username: email }),
          );
        } catch (error) {
          if (
            !(error instanceof Error) ||
            error.name !== "UserNotFoundException"
          )
            throw error;
        }
      }
      adminClient.destroy();
    }
  },
);
