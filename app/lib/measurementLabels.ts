import type { Measurement } from "./measurements.ts";
export const measurementLabels: Record<Measurement["metric"], string> = {
  "conflict-incidents": "Reported conflict incidents",
  "conflict-fatalities-low": "Reported fatalities · lower estimate",
  "conflict-fatalities-high": "Reported fatalities · upper estimate",
  "conflict-events": "Reported events / month",
  "conflict-fatalities": "Reported fatalities",
  "ipc-3-plus": "People in IPC/CH Phase 3+",
  "ipc-5": "People in Phase 5 · not an area famine declaration",
  "people-in-need": "People needing assistance",
  idps: "Internally displaced people",
  refugees: "Refugees",
  "rainfall-departure": "Rainfall departure · mm",
  risk: "INFORM risk / 10",
};
