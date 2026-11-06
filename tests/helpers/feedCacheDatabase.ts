import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

process.env.DYNAMODB_TABLE_NAME ??= "feed-cache-test";
const { database } = await import("../../app/server/aws.ts");
export const feedCacheItems = new Map<string, Record<string, unknown>>();
database.send = (async (command: GetCommand | PutCommand | UpdateCommand) => {
  const input = command.input;
  const item = "Item" in input ? input.Item : undefined;
  const key = "Key" in input ? input.Key : item;
  if (!String(key?.pk).startsWith("PUBLIC_FEED#")) throw new Error("Unexpected non-cache database request.");
  const id = JSON.stringify([key?.pk, key?.sk]);
  const stored = feedCacheItems.get(id);
  if (command instanceof GetCommand) return { Item: stored ? structuredClone(stored) : undefined };
  if (command instanceof PutCommand) {
    feedCacheItems.set(id, structuredClone(command.input.Item!));
    return {};
  }
  if (!(command instanceof UpdateCommand)) throw new Error("Unsupported cache command.");
  const values = command.input.ExpressionAttributeValues!;
  const condition = command.input.ConditionExpression;
  const failed = condition === "lockOwner=:owner" ? stored?.lockOwner !== values[":owner"]
    : condition === "attribute_not_exists(lockUntil) OR lockUntil <= :now" ? Number(stored?.lockUntil ?? 0) > values[":now"]
    : condition === "attribute_not_exists(retryAt) OR retryAt <= :retry" ? Number(stored?.retryAt ?? 0) > values[":retry"]
    : true;
  if (failed) throw Object.assign(new Error("Cache condition failed"), { name: "ConditionalCheckFailedException" });
  const next = { ...key, ...stored };
  const attributes: Record<string, string> = {
    ":owner": "lockOwner", ":until": "lockUntil", ":retry": "retryAt", ":error": "error",
    ":expires": "expiresAt", ":version": "version", ":chunks": "chunks", ":valid": "validUntil",
  };
  const expression = command.input.UpdateExpression!;
  const assignments = expression.split(" REMOVE ")[0];
  for (const [placeholder, name] of Object.entries(attributes)) {
    if (assignments.includes(`=${placeholder}`)) next[name] = values[placeholder];
  }
  const removed = expression.startsWith("REMOVE ") ? expression.slice(7) : expression.split(" REMOVE ")[1];
  for (const name of removed?.split(", ") ?? []) delete next[name === "#error" ? "error" : name];
  feedCacheItems.set(id, next);
  return {};
}) as typeof database.send;
