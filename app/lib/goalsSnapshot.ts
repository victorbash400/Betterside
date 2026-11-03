import { z } from "zod";
import { profileResponseSchema } from "./profile.ts";
import { contributionRecordSchema } from "./chatWorkspace.ts";
import { subscriptionSchema } from "./paypalSubscription.ts";

export const goalsSnapshotSchema = profileResponseSchema.extend({
  contributions: z.array(contributionRecordSchema),
  subscriptions: z.array(subscriptionSchema),
});
