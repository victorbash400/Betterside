import "server-only";
import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "./aws.ts";
import type { Contribution } from "../lib/types";
export interface PaymentRecord extends Contribution {
  donor: string;
  cents: number;
  projectKey: string;
  recipient: string;
}
export async function payment(id: string) {
  const result = await database.send(
    new GetCommand({
      TableName: requireTable(),
      Key: { pk: `PAYMENT#${id}`, sk: "META" },
      ConsistentRead: true,
    }),
  );
  return result.Item as PaymentRecord | undefined;
}
export async function recordPayment(record: PaymentRecord) {
  const TableName = requireTable();
  await database.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName,
            Item: { pk: `PAYMENT#${record.id}`, sk: "META", ...record },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          Put: {
            TableName,
            Item: {
              pk: `DONOR#${record.donor}`,
              sk: `PAYMENT#${record.createdAt}#${record.id}`,
              ...record,
            },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
      ],
    }),
  );
}
export async function completePayment(
  record: PaymentRecord,
  captureId: string,
  completedAt = new Date().toISOString(),
) {
  const TableName = requireTable();
  if (!Number.isFinite(Date.parse(completedAt)))
    throw new Error("Invalid payment completion date.");
  try {
    await database.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName,
              Key: { pk: `PAYMENT#${record.id}`, sk: "META" },
              UpdateExpression:
                "SET #status=:completed,captureId=:capture,completedAt=:completedAt",
              ConditionExpression: "#status=:created",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: {
                ":completed": "COMPLETED",
                ":created": "CREATED",
                ":capture": captureId,
                ":completedAt": completedAt,
              },
            },
          },
          {
            Update: {
              TableName,
              Key: {
                pk: `DONOR#${record.donor}`,
                sk: `PAYMENT#${record.createdAt}#${record.id}`,
              },
              UpdateExpression:
                "SET #status=:completed,captureId=:capture,completedAt=:completedAt",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: {
                ":completed": "COMPLETED",
                ":capture": captureId,
                ":completedAt": completedAt,
              },
            },
          },
          {
            Update: {
              TableName,
              Key: { pk: `PROJECT#${record.projectId}`, sk: "FUNDING" },
              UpdateExpression: "ADD receivedCents :amount",
              ExpressionAttributeValues: { ":amount": record.cents },
            },
          },
        ],
      }),
    );
  } catch (error) {
    const current = await payment(record.id);
    if (
      (current?.status === "COMPLETED" || current?.status === "REFUNDED") &&
      current.captureId === captureId
    )
      return;
    throw error;
  }
}
export async function changePaymentStatus(
  record: PaymentRecord,
  status: "CANCELLED" | "FAILED",
) {
  const TableName = requireTable();
  await database.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName,
            Key: { pk: `PAYMENT#${record.id}`, sk: "META" },
            UpdateExpression: "SET #status=:next",
            ConditionExpression: "#status=:created",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
              ":next": status,
              ":created": "CREATED",
            },
          },
        },
        {
          Update: {
            TableName,
            Key: {
              pk: `DONOR#${record.donor}`,
              sk: `PAYMENT#${record.createdAt}#${record.id}`,
            },
            UpdateExpression: "SET #status=:next",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: { ":next": status },
          },
        },
      ],
    }),
  );
}
export async function contributions(donor: string): Promise<Contribution[]> {
  const records: Contribution[] = [];
  let cursor: Record<string, unknown> | undefined;
  do {
    const result = await database.send(
      new QueryCommand({
        TableName: requireTable(),
        KeyConditionExpression: "pk=:pk AND begins_with(sk,:payment)",
        ExpressionAttributeValues: {
          ":pk": `DONOR#${donor}`,
          ":payment": "PAYMENT#",
        },
        ScanIndexForward: false,
        ConsistentRead: true,
        ExclusiveStartKey: cursor,
      }),
    );
    records.push(
      ...(result.Items ?? []).map(
        (item) =>
          ({
            id: item.id,
            goalId: item.goalId,
            completedAt: item.completedAt,
            refundedCents: item.refundedCents,
            projectId: item.projectId,
            projectName: item.projectName,
            amount: item.amount,
            currency: item.currency,
            status: item.status,
            createdAt: item.createdAt,
            captureId: item.captureId,
          }) as Contribution,
      ),
    );
    cursor = result.LastEvaluatedKey;
  } while (cursor);
  return records;
}
