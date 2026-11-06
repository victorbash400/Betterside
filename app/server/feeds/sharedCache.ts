import "server-only";
import { randomUUID } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { database, requireTable } from "../aws.ts";
import { CachedLoadError } from "../../lib/asyncCache.ts";

const metadataSchema = z.object({
  validUntil: z.number().optional(),
  version: z.string().optional(),
  chunks: z.number().int().positive().max(128).optional(),
  retryAt: z.number().optional(),
  error: z.string().optional(),
});
const chunkSize = 300 * 1024;
const leaseMs = 60_000;
function key(id: string, sk = "META") {
  return { pk: `PUBLIC_FEED#v1#${id}`, sk };
}
async function read(id: string) {
  const result = await database.send(new GetCommand({
    TableName: requireTable(), Key: key(id), ConsistentRead: true,
  }));
  return result.Item ? metadataSchema.parse(result.Item) : undefined;
}
function cachedError(entry: z.infer<typeof metadataSchema> | undefined) {
  if (entry?.retryAt && entry.retryAt > Date.now() && entry.error)
    return new CachedLoadError(new Error(entry.error), Date.now(), entry.retryAt);
}
async function cachedValue(entry: z.infer<typeof metadataSchema>, id: string) {
  if (!entry.version || !entry.chunks) throw new Error("Source cache metadata is incomplete.");
  const chunks = await Promise.all(Array.from({ length: entry.chunks }, async (_, index) => {
    const result = await database.send(new GetCommand({
      TableName: requireTable(), Key: key(id, `DATA#${entry.version}#${index}`), ConsistentRead: true,
    }));
    if (!(result.Item?.data instanceof Uint8Array)) throw new Error("Source cache data is incomplete.");
    return result.Item.data;
  }));
  return JSON.parse(gunzipSync(Buffer.concat(chunks), { maxOutputLength: 32 * 1024 * 1024 }).toString("utf8")) as unknown;
}

export async function assertProviderAvailable(provider: string) {
  const error = cachedError(await read(`COOLDOWN#${provider}`));
  if (error) throw error;
}
export async function storeProviderCooldown(provider: string, error: CachedLoadError) {
  await database.send(new UpdateCommand({
    TableName: requireTable(), Key: key(`COOLDOWN#${provider}`),
    UpdateExpression: "SET retryAt=:retry, #error=:error, expiresAt=:expires",
    ConditionExpression: "attribute_not_exists(retryAt) OR retryAt <= :retry",
    ExpressionAttributeNames: { "#error": "error" },
    ExpressionAttributeValues: {
      ":retry": error.retryAt, ":error": error.message, ":expires": Math.ceil(error.retryAt / 1000),
    },
  })).catch((cause: unknown) => {
    if (!(cause instanceof Error && cause.name === "ConditionalCheckFailedException")) throw cause;
  });
}

export async function sharedFeed(id: string, ttlMs: number, load: () => Promise<unknown>) {
  const entry = await read(id);
  if (entry?.validUntil && entry.validUntil > Date.now()) return { value: await cachedValue(entry, id), validUntil: entry.validUntil };
  const error = cachedError(entry);
  if (error) throw error;
  const owner = randomUUID();
  try {
    await database.send(new UpdateCommand({
      TableName: requireTable(), Key: key(id),
      UpdateExpression: "SET lockOwner=:owner, lockUntil=:until, expiresAt=:expires",
      ConditionExpression: "attribute_not_exists(lockUntil) OR lockUntil <= :now",
      ExpressionAttributeValues: {
        ":owner": owner, ":until": Date.now() + leaseMs, ":now": Date.now(),
        ":expires": Math.ceil((Date.now() + ttlMs + leaseMs) / 1000),
      },
    }));
  } catch (cause) {
    if (!(cause instanceof Error && cause.name === "ConditionalCheckFailedException")) throw cause;
    const latest = await read(id);
    if (latest?.validUntil && latest.validUntil > Date.now()) return { value: await cachedValue(latest, id), validUntil: latest.validUntil };
    throw cachedError(latest) ?? new CachedLoadError(
      new Error("Source refresh in progress. Retry shortly."), Date.now(), Date.now() + 2000,
    );
  }
  // Another instance may have finished between our initial read and acquiring the lease.
  const latest = await read(id);
  if (latest?.validUntil && latest.validUntil > Date.now()) {
    await release(id, owner);
    return { value: await cachedValue(latest, id), validUntil: latest.validUntil };
  }
  const latestError = cachedError(latest);
  if (latestError) {
    await release(id, owner);
    throw latestError;
  }
  let value: unknown;
  try {
    value = await load();
  } catch (cause) {
    if (!(cause instanceof CachedLoadError)) {
      await release(id, owner);
      throw cause;
    }
    const failure = cause;
    await database.send(new UpdateCommand({
      TableName: requireTable(), Key: key(id),
      UpdateExpression: "SET retryAt=:retry, #error=:error, expiresAt=:expires REMOVE lockOwner, lockUntil",
      ConditionExpression: "lockOwner=:owner",
      ExpressionAttributeNames: { "#error": "error" },
      ExpressionAttributeValues: {
        ":owner": owner, ":retry": failure.retryAt, ":error": failure.message,
        ":expires": Math.ceil(failure.retryAt / 1000),
      },
    }));
    throw failure;
  }
  try {
    const json = JSON.stringify(value);
    if (json === undefined || Buffer.byteLength(json) > 32 * 1024 * 1024)
      throw new Error("Source cache response exceeds storage limit.");
    const data = gzipSync(json);
    const chunks = Math.ceil(data.byteLength / chunkSize);
    const validUntil = Date.now() + ttlMs;
    const expiresAt = Math.ceil(validUntil / 1000);
    await Promise.all(Array.from({ length: chunks }, (_, index) => database.send(new PutCommand({
      TableName: requireTable(), Item: {
        ...key(id, `DATA#${owner}#${index}`), expiresAt,
        data: data.subarray(index * chunkSize, (index + 1) * chunkSize),
      },
    }))));
    await database.send(new UpdateCommand({
      TableName: requireTable(), Key: key(id),
      UpdateExpression: "SET version=:version, chunks=:chunks, validUntil=:valid, expiresAt=:expires REMOVE lockOwner, lockUntil, retryAt, #error",
      ConditionExpression: "lockOwner=:owner",
      ExpressionAttributeNames: { "#error": "error" },
      ExpressionAttributeValues: {
        ":owner": owner, ":version": owner, ":chunks": chunks,
        ":valid": validUntil, ":expires": expiresAt,
      },
    }));
    return { value, validUntil };
  } catch (cause) {
    await release(id, owner);
    throw cause;
  }
}
async function release(id: string, owner: string) {
  await database.send(new UpdateCommand({
    TableName: requireTable(), Key: key(id),
    UpdateExpression: "REMOVE lockOwner, lockUntil",
    ConditionExpression: "lockOwner=:owner",
    ExpressionAttributeValues: { ":owner": owner },
  }));
}
