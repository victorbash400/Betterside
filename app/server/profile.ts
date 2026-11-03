import { assertSubscriptionEditable } from "./subscriptionStore.ts";
import "server-only";
import {
  GetCommand,
  PutCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "./aws.ts";
import {
  emptyProfile,
  profileResponseSchema,
  profileSchema,
  type DonorProfile,
  goalMatchesProject,
} from "../lib/profile.ts";
import { loadCatalogue } from "./catalogue.ts";
import { contributions } from "./contributions.ts";
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
  await Promise.all(
    previous.profile.goals.map(async (existing) => {
      const goal = input.goals.find((item) => item.id === existing.id);
      if (
        goal &&
        goal.targetCents === existing.targetCents &&
        goal.period === existing.period &&
        (goal.status ?? "active") === (existing.status ?? "active") &&
        goal.organization?.id === existing.organization?.id &&
        goal.projectId === existing.projectId &&
        goal.category === existing.category
      )
        return;
      await assertSubscriptionEditable(donor, existing.id);
    }),
  );
  const organizations = input.goals.some(
    (goal) =>
      goal.organization &&
      !previous.profile.goals.some(
        (existing) =>
          existing.id === goal.id &&
          existing.organization?.id === goal.organization?.id &&
          existing.category === goal.category,
      ),
  )
    ? (
        await (
          await import("./organizationDirectory.ts")
        ).loadOrganizationDirectory()
      ).organizations
    : [];
  const projects = input.goals.some((goal) => goal.projectId)
    ? await loadCatalogue()
    : [];
  const ledger = input.goals.some(
    (goal) =>
      goal.projectId &&
      previous.profile.goals.some(
        (existing) => existing.id === goal.id && !existing.projectId,
      ),
  )
    ? await contributions(donor)
    : [];
  const profile = {
    ...input,
    goals: input.goals.map((goal) => {
      const existing = previous.profile.goals.find(
        (item) => item.id === goal.id,
      );
      if (existing?.projectId && existing.category !== goal.category)
        throw new Error("Create a new goal to change its cause.");
      if (existing?.projectId && existing.projectId !== goal.projectId)
        throw new Error("Create a new subscription to change its recipient.");
      if (goal.projectId) {
        const project = projects.find(
          (item) => item.project.id === goal.projectId,
        );
        if (
          !project ||
          goal.organization ||
          !goalMatchesProject({ ...goal, status: "active" }, project)
        )
          throw new Error("Choose a project that supports this cause.");
        if (
          ledger.some(
            (payment) =>
              payment.goalId === goal.id &&
              payment.projectId !== goal.projectId,
          )
        )
          throw new Error(
            "Create a new subscription; this goal has payments for another recipient.",
          );
      }
      if (existing && existing.organization?.id !== goal.organization?.id)
        throw new Error("Create a new goal to change its organization.");
      const directoryOrganization = organizations.find(
        (item) => item.id === goal.organization?.id,
      );
      const organization = goal.organization
        ? existing?.organization?.id === goal.organization.id &&
          existing.category === goal.category
          ? existing.organization
          : directoryOrganization
        : undefined;
      if (goal.organization && !organization)
        throw new Error(
          "Organization unavailable. Choose another organization.",
        );
      if (
        directoryOrganization &&
        (!existing ||
          existing.category !== goal.category ||
          existing.organization?.id !== goal.organization?.id) &&
        goal.category !== "All causes" &&
        !directoryOrganization.topics.includes(goal.category)
      )
        throw new Error("Choose a cause supported by this organization.");
      return {
        ...goal,
        organization: organization
          ? {
              id: organization.id,
              name: organization.name,
              donateUrl: organization.donateUrl?.startsWith("https://")
                ? organization.donateUrl
                : null,
            }
          : undefined,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
    }),
  };
  const next = revision + 1;
  const write = {
    TableName: requireTable(),
    Item: { pk: `DONOR#${donor}`, sk: "PROFILE", profile, revision: next },
    ConditionExpression:
      revision === 0 ? "attribute_not_exists(pk)" : "revision = :revision",
    ...(revision === 0
      ? {}
      : { ExpressionAttributeValues: { ":revision": revision } }),
  };
  const changed = previous.profile.goals.filter((existing) => {
    const goal = input.goals.find((item) => item.id === existing.id);
    return (
      !goal ||
      goal.targetCents !== existing.targetCents ||
      goal.period !== existing.period ||
      (goal.status ?? "active") !== (existing.status ?? "active") ||
      goal.organization?.id !== existing.organization?.id ||
      goal.projectId !== existing.projectId ||
      goal.category !== existing.category
    );
  });
  if (changed.length) {
    await database.send(
      new TransactWriteCommand({
        TransactItems: [
          { Put: write },
          ...changed.map((goal) => ({
            ConditionCheck: {
              TableName: requireTable(),
              Key: { pk: `DONOR#${donor}`, sk: `SUBSCRIPTION#${goal.id}` },
              ConditionExpression:
                "(attribute_not_exists(creatingUntil) OR creatingUntil < :now) AND (attribute_not_exists(#id) OR #status IN (:cancelled,:expired))",
              ExpressionAttributeNames: { "#id": "id", "#status": "status" },
              ExpressionAttributeValues: {
                ":now": Date.now(),
                ":cancelled": "CANCELLED",
                ":expired": "EXPIRED",
              },
            },
          })),
        ],
      }),
    );
  } else await database.send(new PutCommand(write));
  return { profile, revision: next };
}
