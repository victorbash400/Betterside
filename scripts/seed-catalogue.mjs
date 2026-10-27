import { Agent } from "node:https";
import { Resolver } from "node:dns/promises";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { issues } from "../app/lib/catalogue.ts";
const resolver = new Resolver({ timeout: 2000, tries: 1 });
const lookup = (hostname, options, callback) => {
  resolver.resolve4(hostname).then(
    (addresses) =>
      options.all
        ? callback(
            null,
            addresses.map((address) => ({ address, family: 4 })),
          )
        : callback(null, addresses[0], 4),
    (error) => callback(error, "", 4),
  );
};
const database = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION,
    maxAttempts: 1,
    requestHandler: {
      connectionTimeout: 10000,
      requestTimeout: 15000,
      httpsAgent: new Agent({ lookup }),
    },
  }),
);
const TableName = process.env.DYNAMODB_TABLE_NAME;
if (TableName !== "BetterSide-dev")
  throw new Error("Seed is restricted to BetterSide-dev.");
for (const issue of issues) {
  await database.send(
    new PutCommand({
      TableName,
      Item: { pk: "CATALOGUE", sk: `ISSUE#${issue.id}`, issue },
    }),
  );
}
console.log(
  `Stored ${issues.length} sourced demonstration records in BetterSide-dev. Funding records were preserved.`,
);
