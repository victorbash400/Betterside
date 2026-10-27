import "server-only";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "./aws.ts";
import type { PaymentRecord } from "./contributions";
export async function recordRefund(
  record: PaymentRecord,
  eventId: string,
  refundId: string,
  cents: number,
) {
  const TableName = requireTable();
  await database.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName,
            Item: {
              pk: `EVENT#${eventId}`,
              sk: "META",
              refundId,
              orderId: record.id,
              cents,
              createdAt: new Date().toISOString(),
            },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          Update: {
            TableName,
            Key: { pk: `PAYMENT#${record.id}`, sk: "META" },
            UpdateExpression: "SET #status=:refunded ADD refundedCents :cents",
            ConditionExpression:
              "captureId=:capture AND (attribute_not_exists(refundedCents) OR refundedCents <= :remaining)",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
              ":refunded": "REFUNDED",
              ":capture": record.captureId,
              ":cents": cents,
              ":remaining": record.cents - cents,
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
            UpdateExpression: "SET #status=:refunded ADD refundedCents :cents",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
              ":refunded": "REFUNDED",
              ":cents": cents,
            },
          },
        },
        {
          Update: {
            TableName,
            Key: { pk: `PROJECT#${record.projectId}`, sk: "FUNDING" },
            UpdateExpression: "ADD receivedCents :negative",
            ConditionExpression: "receivedCents >= :cents",
            ExpressionAttributeValues: { ":negative": -cents, ":cents": cents },
          },
        },
      ],
    }),
  );
}
