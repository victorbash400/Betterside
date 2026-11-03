import "server-only";
import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { database, requireTable } from "./aws.ts";
import { subscriptionSchema } from "../lib/paypalSubscription.ts";
export const storedSubscriptionSchema = subscriptionSchema.extend({
  version: z.number().int().nonnegative().default(0),
  pendingPlanId: z.string().optional(),
  owner: z.string(),
  planId: z.string(),
  productId: z.string(),
  projectKey: z.string(),
  recipient: z.string(),
  createdAt: z.string(),
});
export type StoredSubscription = z.infer<typeof storedSubscriptionSchema>;
export async function goalSubscription(owner: string, goalId: string) {
  const response = await database.send(
    new GetCommand({
      TableName: requireTable(),
      Key: { pk: `DONOR#${owner}`, sk: `SUBSCRIPTION#${goalId}` },
      ConsistentRead: true,
    }),
  );
  return response.Item?.id
    ? storedSubscriptionSchema.parse(response.Item)
    : null;
}
export async function subscriptionById(id: string) {
  const response = await database.send(
    new GetCommand({
      TableName: requireTable(),
      Key: { pk: `SUBSCRIPTION#${id}`, sk: "META" },
      ConsistentRead: true,
    }),
  );
  return response.Item ? storedSubscriptionSchema.parse(response.Item) : null;
}
export async function donorSubscriptions(owner: string) {
  const result = await database.send(
    new QueryCommand({
      TableName: requireTable(),
      KeyConditionExpression: "pk=:pk AND begins_with(sk,:prefix)",
      ExpressionAttributeValues: {
        ":pk": `DONOR#${owner}`,
        ":prefix": "SUBSCRIPTION#",
      },
      ConsistentRead: true,
    }),
  );
  return (result.Items ?? [])
    .filter((item) => item.id)
    .map((item) => storedSubscriptionSchema.parse(item));
}
export async function storeSubscription(value: StoredSubscription) {
  const TableName = requireTable();
  const next = { ...value, version: value.version + 1 };
  const current = await goalSubscription(value.owner, value.goalId);
  const historical = Boolean(
    current && current.id !== value.id && value.version > 0,
  );
  await database.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName,
            Item: { pk: `SUBSCRIPTION#${value.id}`, sk: "META", ...next },
            ConditionExpression:
              "attribute_not_exists(#version) OR #version=:version",
            ExpressionAttributeNames: { "#version": "version" },
            ExpressionAttributeValues: { ":version": value.version },
          },
        },
        ...(!historical
          ? [
              {
                Put: {
                  TableName,
                  Item: {
                    pk: `DONOR#${value.owner}`,
                    sk: `SUBSCRIPTION#${value.goalId}`,
                    ...next,
                  },
                  ConditionExpression:
                    "attribute_not_exists(#id) OR (#id=:id AND (attribute_not_exists(#version) OR #version=:version)) OR (#id<>:id AND #status IN (:cancelled,:expired) AND :version=:initial)",
                  ExpressionAttributeNames: {
                    "#id": "id",
                    "#version": "version",
                    "#status": "status",
                  },
                  ExpressionAttributeValues: {
                    ":id": value.id,
                    ":version": value.version,
                    ":initial": 0,
                    ":cancelled": "CANCELLED",
                    ":expired": "EXPIRED",
                  },
                },
              },
            ]
          : []),
      ],
    }),
  );
  return next;
}

export async function assertSubscriptionEditable(
  owner: string,
  goalId: string,
) {
  const result = await database.send(
    new GetCommand({
      TableName: requireTable(),
      Key: { pk: `DONOR#${owner}`, sk: `SUBSCRIPTION#${goalId}` },
      ConsistentRead: true,
    }),
  );
  const item = result.Item;
  if (
    item &&
    (Number(item.creatingUntil ?? 0) > Date.now() ||
      (item.id && !["CANCELLED", "EXPIRED"].includes(item.status)))
  )
    throw new Error(
      "Cancel the PayPal subscription before changing billing or deleting this goal.",
    );
}
