import { interestCategories } from "./interestCategories.ts";
import { issueSchema } from "./catalogueSchema.ts";
import { z } from "zod";
const ids = z
  .array(z.string().min(1).max(160))
  .max(1000)
  .refine(
    (values) => new Set(values).size === values.length,
    "Duplicate tracked items.",
  );
export const trackingSchema = z
  .object({
    version: z.literal(1),
    following: ids,
    savedItems: z
      .array(
        issueSchema.extend({
          project: issueSchema.shape.project.optional(),
          dataset: z.enum(["catalogue", "eonet"]).optional(),
          categoryIds: z.array(z.string()).optional(),
          eventStatus: z.enum(["Open", "Closed"]).optional(),
        }),
      )
      .max(1000)
      .default([]),
    interests: z
      .array(
        z.object({
          id: z.string().min(1).max(160),
          name: z.string().trim().min(1).max(120),
          categoryId: z
            .string()
            .refine(
              (id) => interestCategories.some((category) => category.id === id),
              "Unknown interest category.",
            )
            .optional(),
          issueIds: ids,
          parentId: z.string().optional(),
          archived: z.boolean().optional(),
          hiddenKinds: z
            .array(
              z.enum(["Water", "Hunger", "Displacement", "Disaster response"]),
            )
            .default([]),
        }),
      )
      .max(100),
  })
  .superRefine((value, context) => {
    if (
      new Set(value.interests.map((interest) => interest.id)).size !==
      value.interests.length
    )
      context.addIssue({ code: "custom", message: "Duplicate interests." });
    for (const interest of value.interests) {
      const seen = new Set([interest.id]);
      let parentId = interest.parentId;
      while (parentId) {
        if (seen.has(parentId)) {
          context.addIssue({
            code: "custom",
            message: "Circular interest folders.",
          });
          break;
        }
        seen.add(parentId);
        const parent = value.interests.find((item) => item.id === parentId);
        if (!parent) {
          context.addIssue({
            code: "custom",
            message: "Interest parent not found.",
          });
          break;
        }
        parentId = parent.parentId;
      }
    }
    const assigned = new Set<string>();
    for (const interest of value.interests)
      for (const id of interest.issueIds) {
        if (!value.following.includes(id) || assigned.has(id))
          context.addIssue({
            code: "custom",
            message: "Invalid interest membership.",
          });
        assigned.add(id);
      }
  });
export type Tracking = z.infer<typeof trackingSchema>;
export type Interest = Tracking["interests"][number];
export const emptyTracking: Tracking = {
  version: 1,
  following: [],
  savedItems: [],
  interests: [],
};
export const trackingResponseSchema = z.object({
  snapshot: trackingSchema.nullable(),
  revision: z.number().int().nonnegative(),
});
