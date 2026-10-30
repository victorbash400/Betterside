export const dataSources = [
  { id: "catalogue", label: "Sourced sandbox projects" },
  { id: "eonet", label: "NASA EONET" },
  { id: "gdacs", label: "GDACS disasters" },
  { id: "usgs", label: "USGS earthquakes" },
  { id: "ifrc", label: "IFRC GO emergencies" },
  { id: "hapi-needs", label: "OCHA humanitarian needs" },
  { id: "hapi-food", label: "IPC food insecurity" },
  { id: "hapi-famine", label: "IPC Phase 5 catastrophe" },
  { id: "hapi-idps", label: "IOM displacement" },
  { id: "hapi-refugees", label: "UNHCR refugees" },
  { id: "hapi-conflict", label: "ACLED conflict summaries" },
  { id: "hapi-rainfall", label: "WFP rainfall" },
  { id: "hapi-funding", label: "OCHA response funding" },
  { id: "hapi-risk", label: "INFORM national risk" },
] as const;
export type DatasetId = (typeof dataSources)[number]["id"];
export const datasetIds = dataSources.map((source) => source.id);
export type DatasetSelection = Record<DatasetId, boolean>;
export const defaultDatasets = Object.fromEntries(
  datasetIds.map((id) => [id, id !== "catalogue"]),
) as DatasetSelection;
export interface FeedStatus {
  id: Exclude<DatasetId, "catalogue">;
  state: "ready" | "partial" | "stale" | "error" | "unconfigured";
  count: number;
  fetchedAt: string;
  expiresAt?: string;
  retryAt?: string;
  excludedRecords?: number;
  truncated?: boolean;
  message?: string;
}
