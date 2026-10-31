import "server-only";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "./aws.ts";
import {
  emptyProfile,
  profileResponseSchema,
  profileSchema,
  type DonorProfile,
} from "../lib/profile.ts";
export async function loadProfile(donor: string) {
  const result = await database.send(
    new GetCommand({
      TableName: requireTable(),
      Key: { pk: `DONOR#${donor}`, sk: "PROFILE" },
      ConsistentRead: true,
    }),
  );
  return result.Item
    ? profileResponseSchema.parse(result.Item)
    : { profile: emptyProfile, revision: 0 };
}
export async function saveProfile(
  donor: string,
  raw: DonorProfile,
  revision: number,
) {
  const input = profileSchema.parse(raw);
  const previous = await loadProfile(donor);
  if (previous.revision !== revision)
    throw new Error("Profile changed in another tab. Reload to review.");
  const profile = {
    ...input,
    goals: input.goals.map((goal) => {
      const existing = previous.profile.goals.find(
        (item) => item.id === goal.id,
      );
      if (existing && existing.category !== goal.category)
        throw new Error("Create a new goal to change its cause.");
      return {
        ...goal,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
    }),
  };
  const next = revision + 1;
  await database.send(
    new PutCommand({
      TableName: requireTable(),
      Item: { pk: `DONOR#${donor}`, sk: "PROFILE", profile, revision: next },
      ConditionExpression:
        revision === 0 ? "attribute_not_exists(pk)" : "revision = :revision",
      ...(revision === 0
        ? {}
        : { ExpressionAttributeValues: { ":revision": revision } }),
    }),
  );
  return { profile, revision: next };
}
