import { z } from "zod";
import { concerns } from "./concerns.ts";
import { issueKinds } from "./issueKinds.ts";
import { datasetIds } from "./dataSources.ts";
import { trackingSchema } from "./tracking.ts";
import { directoryOrganizationSchema } from "./organizations.ts";

export const chatRecordSchema =
  trackingSchema.shape.savedItems.unwrap().element;
export const searchInputSchema = z.object({
  query: z.string().max(200).optional(),
  country: z.string().max(120).optional(),
  kind: z.enum(issueKinds).optional(),
  dataset: z.enum(datasetIds).optional(),
  scope: z.enum(["all", "selection"]).default("all"),
  offset: z.number().int().min(0).max(20000).default(0),
  projectsOnly: z.boolean().default(false),
  sort: z.enum(["recent", "name", "country", "funding-gap"]).default("recent"),
});
export const mapFilterSchema = z.object({
  country: z.string().max(120),
  causes: z
    .array(z.enum(concerns.map((concern) => concern.id)))
    .max(concerns.length),
  mode: z.enum(["Heatmap", "Areas", "Columns", "Spikes"]),
});
export const saveRecordsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  recordIds: z.array(z.string().min(1).max(160)).min(1).max(100),
});
export const focusOrganizationSchema = z.object({
  organizationId: z.string().min(1).max(200),
  topics: z.array(z.string().max(120)).max(20),
});
export const calculationInputSchema = z.object({
  operation: z.enum([
    "sum",
    "subtract",
    "multiply",
    "divide",
    "percentage",
    "split",
  ]),
  values: z.array(z.number().min(-1e12).max(1e12)).min(1).max(100),
  unit: z.string().max(60).optional(),
});
export const recordsResultSchema = z.object({
  kind: z.literal("records"),
  total: z.number().int().nonnegative(),
  records: z.array(chatRecordSchema).max(20),
  nextOffset: z.number().nullable(),
});
export const organizationsResultSchema = z.object({
  kind: z.literal("organizations"),
  total: z.number().int().nonnegative(),
  organizations: z.array(directoryOrganizationSchema).max(20),
  nextOffset: z.number().nullable(),
});
export const paymentResultSchema = z.object({
  kind: z.literal("payment"),
  id: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  amount: z.string(),
  currency: z.literal("USD"),
  sandbox: z.literal(true),
  approvalUrl: z.url().refine((value) => {
    const url = new URL(value);
    return (
      url.origin === "https://www.sandbox.paypal.com" &&
      !url.username &&
      !url.password
    );
  }, "PayPal approval URL rejected."),
});
export const paymentStatusSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  amount: z.string(),
  currency: z.literal("USD"),
  status: z.enum(["CREATED", "COMPLETED", "CANCELLED", "FAILED", "REFUNDED"]),
});
export const calculationResultSchema = calculationInputSchema.extend({
  kind: z.literal("calculation"),
  result: z.number(),
  shares: z.array(z.number()).optional(),
});
export const mapResultSchema = mapFilterSchema.extend({
  kind: z.literal("map"),
  count: z.number().int().nonnegative(),
});
export const savedResultSchema = z.object({
  kind: z.literal("saved"),
  id: z.string(),
  name: z.string(),
  count: z.number().int().nonnegative(),
});
export type MapFilterAction = z.infer<typeof mapFilterSchema>;
export type SaveRecordsAction = z.infer<typeof saveRecordsSchema>;
export type FocusOrganizationAction = z.infer<typeof focusOrganizationSchema>;
export interface ChatWorkspaceActions {
  openCheckout: (
    input: CheckoutInput,
  ) => Promise<z.infer<typeof checkoutResultSchema>>;
  filterMap: (
    input: MapFilterAction,
  ) => Promise<z.infer<typeof mapResultSchema>>;
  saveRecords: (
    input: SaveRecordsAction,
    callId: string,
  ) => Promise<z.infer<typeof savedResultSchema>>;
  focusOrganization: (
    input: FocusOrganizationAction,
  ) => Promise<{ kind: "organization-focus"; name: string; topics: string[] }>;
}

export const workspaceChatContextSchema = z.object({
  view: z.enum(["Explore", "Organizations", "Following", "Contributions"]),
  mode: z.enum(["map", "list"]),
  country: z.string().max(120),
  causes: z
    .array(z.enum(concerns.map((concern) => concern.id)))
    .max(concerns.length),
  visualization: z.enum(["Heatmap", "Areas", "Columns", "Spikes"]),
  organizationId: z.string().max(200).optional(),
});
export type WorkspaceChatContext = z.infer<typeof workspaceChatContextSchema>;

export const contributionRecordSchema = paymentStatusSchema.extend({
  projectId: z.string(),
  createdAt: z.string(),
  captureId: z.string().optional(),
});
export const contributionsResultSchema = z.object({
  kind: z.literal("contributions"),
  records: z.array(contributionRecordSchema).max(20),
  total: z.number().int().nonnegative(),
  nextOffset: z.number().nullable(),
});

export const checkoutInputSchema = z.object({
  projectId: z.string().min(1).max(160).optional(),
  amount: z.string().max(12).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export const checkoutResultSchema = checkoutInputSchema.extend({
  kind: z.literal("checkout"),
});
