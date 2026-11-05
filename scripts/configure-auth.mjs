import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, chmodSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { Agent } from "node:https";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { awsLookup } from "../app/server/aws-dns.ts";
const region = process.env.AWS_REGION ?? "us-east-1";
const profile = process.env.AWS_PROFILE;
if (!profile) throw new Error("Set AWS_PROFILE to your provisioning profile.");
const stack = JSON.parse(
  execFileSync(
    "aws",
    [
      "cloudformation",
      "describe-stacks",
      "--stack-name",
      "betterside-dev-auth",
      "--region",
      region,
      "--profile",
      profile,
      "--output",
      "json",
    ],
    { encoding: "utf8" },
  ),
);
const outputs = Object.fromEntries(
  stack.Stacks[0].Outputs.map((item) => [item.OutputKey, item.OutputValue]),
);
const file = new URL("../.env.local", import.meta.url);
const existing = readFileSync(file, "utf8").split("\n");
const env = Object.fromEntries(
  existing
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
const email = env.DEMO_ACCOUNT_EMAIL || "demo@betterside.app";
const password =
  env.DEMO_ACCOUNT_PASSWORD || `BetterSide9-${randomBytes(24).toString("hex")}`;
const client = new CognitoIdentityProviderClient({
  region,
  maxAttempts: 1,
  requestHandler: {
    connectionTimeout: 10000,
    requestTimeout: 15000,
    httpsAgent: new Agent({ lookup: awsLookup }),
  },
});
let found = false;
try {
  await client.send(
    new AdminGetUserCommand({
      UserPoolId: outputs.UserPoolId,
      Username: email,
    }),
  );
  found = true;
} catch (error) {
  if (error.name !== "UserNotFoundException") throw error;
}
if (!found)
  await client.send(
    new AdminCreateUserCommand({
      UserPoolId: outputs.UserPoolId,
      Username: email,
      MessageAction: "SUPPRESS",
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "name", Value: "Demo" },
      ],
    }),
  );
if (!found || !env.DEMO_ACCOUNT_PASSWORD)
  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: outputs.UserPoolId,
      Username: email,
      Password: password,
      Permanent: true,
    }),
  );
const additions = {
  COGNITO_USER_POOL_ID: outputs.UserPoolId,
  COGNITO_CLIENT_ID: outputs.ClientId,
  DEMO_ACCOUNT_EMAIL: email,
  DEMO_ACCOUNT_PASSWORD: password,
};
const updated = existing.filter(
  (line) => !Object.keys(additions).some((key) => line.startsWith(`${key}=`)),
);
updated.push(
  ...Object.entries(additions).map(([key, value]) => `${key}=${value}`),
  "",
);
writeFileSync(file, updated.join("\n"), { mode: 0o600 });
chmodSync(file, 0o600);
console.log("BetterSide identity and demo account configured locally.");
