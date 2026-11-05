import "server-only";
import { Agent } from "node:https";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { awsLookup } from "./aws-dns.ts";
export const identity = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  maxAttempts: 1,
  requestHandler: {
    connectionTimeout: 10000,
    requestTimeout: 15000,
    throwOnRequestTimeout: true,
    httpsAgent: new Agent({ keepAlive: true, lookup: awsLookup }),
  },
});
export function authClientId() {
  if (!process.env.COGNITO_CLIENT_ID)
    throw new Error("Account service is not configured.");
  return process.env.COGNITO_CLIENT_ID;
}
