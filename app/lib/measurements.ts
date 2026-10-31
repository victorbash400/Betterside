import { z } from "zod";
export const measurementSchema = z.object({
  metric: z.enum([
    "conflict-events",
    "conflict-incidents",
    "conflict-fatalities-low",
    "conflict-fatalities-high",
    "conflict-fatalities",
    "ipc-3-plus",
    "ipc-5",
    "people-in-need",
    "idps",
    "refugees",
    "rainfall-departure",
    "risk",
  ]),
  value: z.number(),
});
export const reportingAreaSchema = z.object({
  countryCode: z.string(),
  adminLevel: z.number().int().min(0).max(2),
  admin1Code: z.string().nullable(),
  admin2Code: z.string().nullable(),
});
export type Measurement = z.infer<typeof measurementSchema>;
export type ReportingArea = z.infer<typeof reportingAreaSchema>;

export const locationPrecisionSchema = z.object({
  label: z.string(),
  uncertaintyKm: z.number().nonnegative().optional(),
});
