import "server-only";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "./aws.ts";
import {
  trackingResponseSchema,
  trackingSchema,
  type Tracking,
} from "../lib/tracking.ts";
export async function loadTracking(donor: string) {
  const result = await database.send(
    new GetCommand({
      TableName: requireTable(),
      Key: { pk: `DONOR#${donor}`, sk: "TRACKING" },
      ConsistentRead: true,
    }),
  );
  return result.Item
    ? trackingResponseSchema.parse(result.Item)
    : { snapshot: null, revision: 0 };
}
export async function saveTracking(
  donor: string,
  input: Tracking,
  revision: number,
) {
  const snapshot = trackingSchema.parse(input);
  const next = revision + 1;
  await database.send(
    new PutCommand({
      TableName: requireTable(),
      Item: { pk: `DONOR#${donor}`, sk: "TRACKING", snapshot, revision: next },
      ConditionExpression:
        revision === 0 ? "attribute_not_exists(pk)" : "revision = :revision",
      ...(revision === 0
        ? {}
        : { ExpressionAttributeValues: { ":revision": revision } }),
    }),
  );
  return { snapshot, revision: next };
}
