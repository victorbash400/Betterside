import { interestCategories } from "./interestCategories.ts";
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
  interests: [],
};
export const trackingResponseSchema = z.object({
  snapshot: trackingSchema.nullable(),
  revision: z.number().int().nonnegative(),
});
