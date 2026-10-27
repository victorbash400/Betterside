import "server-only";
import { BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "./aws";
import { issueSchema } from "../lib/catalogueSchema";
export async function loadCatalogue() {
  const TableName = requireTable();
  const result = await database.send(
    new QueryCommand({
      TableName,
      KeyConditionExpression: "pk=:pk",
      ExpressionAttributeValues: { ":pk": "CATALOGUE" },
      ConsistentRead: true,
    }),
  );
  const issues = (result.Items ?? []).map((item) =>
    issueSchema.parse(item.issue),
  );
  if (!issues.length) throw new Error("Catalogue is empty. Run pnpm seed.");
  const totals = await database.send(
    new BatchGetCommand({
      RequestItems: {
        [TableName]: {
          Keys: issues.map((issue) => ({
            pk: `PROJECT#${issue.project.id}`,
            sk: "FUNDING",
          })),
          ConsistentRead: true,
        },
      },
    }),
  );
  if (Object.keys(totals.UnprocessedKeys ?? {}).length)
    throw new Error("Funding records unavailable. Retry.");
  return issues.map((issue) => ({
    ...issue,
    project: {
      ...issue.project,
      raised:
        (totals.Responses?.[TableName]?.find(
          (item) => item.pk === `PROJECT#${issue.project.id}`,
        )?.receivedCents ?? 0) / 100,
    },
  }));
}
