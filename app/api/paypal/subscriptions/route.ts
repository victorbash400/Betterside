import { z } from "zod";
import { donorSession } from "../../../server/donor";
import { sameOrigin, apiError } from "../../../server/http";
import { goalSubscription } from "../../../server/subscriptionStore";
import {
  createSubscription,
  manageSubscription,
  refreshSubscription,
  syncSubscriptionPayments,
  reviseSubscription,
} from "../../../server/subscriptions";
import { subscriptionSchema } from "../../../lib/paypalSubscription";
export const maxDuration = 120;
export async function GET(request: Request) {
  try {
    const owner = await donorSession();
    if (!owner) throw new Error("Session unavailable. Return to BetterSide.");
    const query = new URL(request.url).searchParams;
    const goalId = z
      .string()
      .min(1)
      .max(100)
      .parse(query.get("goalId"));
    const current = await goalSubscription(owner, goalId);
    const record = current && !current.discarded ? subscriptionSchema.parse(current) : null;
    if (query.get("approve") === "1") {
      if (record?.status !== "APPROVAL_PENDING" || !record.approvalUrl)
        return apiError(new Error("This PayPal approval is no longer available."), 404);
      return new Response(null, {
        status: 303,
        headers: { Location: record.approvalUrl, "Cache-Control": "no-store" },
      });
    }
    return Response.json(
      { subscription: record },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error, 503);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const owner = await donorSession();
    if (!owner) throw new Error("Session unavailable. Return to BetterSide.");
    const input = z
      .discriminatedUnion("action", [
        z
          .object({
            action: z.literal("adjust"),
            goalId: z.string().min(1).max(100),
            amount: z.string(),
          })
          .strict(),
        z
          .object({
            action: z.literal("create"),
            goalId: z.string().min(1).max(100),
            projectId: z.string().min(1).max(160),
          })
          .strict(),
        z
          .object({
            action: z.enum(["pause", "resume", "cancel", "refresh"]),
            goalId: z.string().min(1).max(100),
          })
          .strict(),
      ])
      .parse(await request.json());
    const record =
      input.action === "create"
        ? await createSubscription(
            owner,
            input.goalId,
            input.projectId,
            new URL(request.url).origin,
          )
        : input.action === "adjust"
          ? await reviseSubscription(
              owner,
              input.goalId,
              input.amount,
              new URL(request.url).origin,
            )
          : input.action === "refresh"
            ? await refreshGoalSubscription(owner, input.goalId)
            : await manageSubscription(owner, input.goalId, input.action);
    return Response.json(
      { subscription: subscriptionSchema.parse(record) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "ConditionalCheckFailedException",
        "TransactionCanceledException",
      ].includes(error.name)
    )
      return apiError(
        new Error("Subscription is changing. Refresh before retrying."),
        409,
      );
    return apiError(error, 400);
  }
}

async function refreshGoalSubscription(owner: string, goalId: string) {
  const stored = await goalSubscription(owner, goalId);
  if (!stored) throw new Error("Subscription not found.");
  const current = await refreshSubscription(stored);
  if (current.status !== "APPROVAL_PENDING")
    await syncSubscriptionPayments(current);
  if (current.discarded) throw new Error("This goal was deleted.");
  return current;
}
