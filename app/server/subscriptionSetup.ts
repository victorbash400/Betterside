import "server-only";
import { loadCatalogue } from "./catalogue.ts";
import { loadProfile, saveProfile } from "./profile.ts";
import { goalSubscription } from "./subscriptionStore.ts";
import { createSubscription, refreshSubscription } from "./subscriptions.ts";
import { subscriptionLocked } from "../lib/paypalSubscription.ts";
import {
  subscriptionSetupSchema,
  subscriptionProjects,
} from "../lib/subscriptionSetup.ts";
import { amountInCents } from "../lib/payment.ts";

export async function setupSubscription(
  owner: string,
  raw: unknown,
  origin: string,
) {
  const parsed = subscriptionSetupSchema.safeParse(raw);
  if (!parsed.success)
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid subscription details.",
    );
  const input = parsed.data;
  const current = await goalSubscription(owner, input.goalId);
  if (current && subscriptionLocked(current.status)) {
    if (
      current.projectId !== input.projectId ||
      amountInCents(current.amount) !== amountInCents(input.amount)
    )
      throw new Error(
        "This goal already has a subscription. Use Adjust amount.",
      );
    return refreshSubscription(current);
  }
  const project = subscriptionProjects(
    await loadCatalogue(),
    input.category,
  ).find((item) => item.project!.id === input.projectId);
  if (!project?.project)
    throw new Error("Choose a project that supports this cause.");
  const state = await loadProfile(owner);
  const existing = state.profile.goals.find((goal) => goal.id === input.goalId);
  if (
    existing?.organization ||
    (existing?.projectId && existing.category !== input.category)
  )
    throw new Error("Create a new subscription for this recipient and cause.");
  const goal = {
    id: input.goalId,
    category: input.category,
    projectId: input.projectId,
    targetText: project.project.name,
    targetCents: amountInCents(input.amount),
    period: "monthly" as const,
    status: "active" as const,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await saveProfile(
    owner,
    {
      ...state.profile,
      goals: existing
        ? state.profile.goals.map((item) => (item.id === goal.id ? goal : item))
        : [...state.profile.goals, goal],
    },
    state.revision,
  );
  const record = await createSubscription(
    owner,
    goal.id,
    input.projectId,
    origin,
  );
  return record;
}
