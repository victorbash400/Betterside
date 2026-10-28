import { z } from "zod";
import { issueKinds } from "./issueKinds.ts";
export const issueSchema = z.object({
  id: z.string(),
  location: z.string(),
  country: z.string(),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
  kind: z.enum(issueKinds),
  severity: z.enum(["High", "Critical", "Insufficient data"]),
  summary: z.string(),
  source: z.object({
    label: z.string(),
    url: z.url(),
    published: z.string().nullable(),
    reviewed: z.string(),
  }),
  project: z.object({
    id: z.string(),
    name: z.string(),
    organisation: z.string(),
    target: z.number().nonnegative(),
    raised: z.number().nonnegative(),
    reportedOutcome: z.string().nullable(),
    demonstration: z.literal(true),
  }),
});
