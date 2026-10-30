import type { MapItem } from "./types.ts";
import type { Measurement } from "./measurements.ts";
export const concerns = [
  {
    id: "war",
    label: "War & conflict",
    color: "#cf554b",
    unit: "Political violence events / month",
    metric: "conflict-events",
  },
  {
    id: "disease",
    label: "Disease outbreaks",
    color: "#8d65ba",
    unit: "Reported outbreak locations",
    metric: null,
  },
  {
    id: "hunger",
    label: "Hunger",
    color: "#d79b31",
    unit: "People in IPC/CH Phase 3+",
    metric: "ipc-3-plus",
  },
  {
    id: "famine",
    label: "Famine / Phase 5",
    color: "#a63c67",
    unit: "People in Phase 5 · not an area famine declaration",
    metric: "ipc-5",
  },
  {
    id: "displacement",
    label: "Internal displacement",
    color: "#3d8f91",
    unit: "People · largest reported assessment",
    metric: "idps",
  },
  {
    id: "refugees",
    label: "Refugees",
    color: "#607fb9",
    unit: "Refugees by host country",
    metric: "refugees",
  },
  {
    id: "water",
    label: "Water",
    color: "#409bb7",
    unit: "People needing water / sanitation assistance",
    metric: "people-in-need",
  },
  {
    id: "health",
    label: "Health needs",
    color: "#a36191",
    unit: "People needing health assistance",
    metric: "people-in-need",
  },
  {
    id: "floods",
    label: "Floods",
    color: "#507cc2",
    unit: "Reported hazard locations",
    metric: null,
  },
  {
    id: "fires",
    label: "Wildfires",
    color: "#d97942",
    unit: "Reported hazard locations",
    metric: null,
  },
  {
    id: "drought",
    label: "Drought",
    color: "#9f8445",
    unit: "Reported hazard locations",
    metric: null,
  },
  {
    id: "earthquakes",
    label: "Earthquakes",
    color: "#90725d",
    unit: "Reported hazard locations",
    metric: null,
  },
  {
    id: "rainfall",
    label: "Rainfall departure",
    color: "#528c73",
    unit: "Largest regional departure · mm",
    metric: "rainfall-departure",
  },
  {
    id: "risk",
    label: "Humanitarian risk",
    color: "#ad7056",
    unit: "INFORM risk / 10 · annual",
    metric: "risk",
  },
  {
    id: "storms",
    label: "Storms",
    color: "#647fa1",
    unit: "Reported hazard locations",
    metric: null,
  },
  {
    id: "volcanoes",
    label: "Volcanoes",
    color: "#a56b57",
    unit: "Reported hazard locations",
    metric: null,
  },
  {
    id: "needs",
    label: "Humanitarian needs",
    color: "#77835a",
    unit: "People needing assistance · largest sector",
    metric: "people-in-need",
  },
  {
    id: "shelter",
    label: "Shelter & protection",
    color: "#877799",
    unit: "People needing assistance · largest sector",
    metric: "people-in-need",
  },
  {
    id: "other-hazards",
    label: "Other hazards",
    color: "#7d837c",
    unit: "Reported hazard locations",
    metric: null,
  },
] as const;
export type ConcernId = (typeof concerns)[number]["id"];
export type OverlayMode = "Areas" | "Heatmap" | "Columns" | "Spikes";
export interface OverlaySettings {
  concerns: ConcernId[];
  mode: OverlayMode;
  period: "Latest" | "30 days" | "90 days" | "1 year";
  scale: "Logarithmic" | "Linear";
  opacity: number;
  radius: number;
  height: number;
  colors: Partial<Record<ConcernId, string>>;
}
export const defaultOverlaySettings: OverlaySettings = {
  concerns: ["war", "disease", "hunger"],
  mode: "Heatmap",
  period: "Latest",
  scale: "Logarithmic",
  opacity: 0.75,
  radius: 24,
  height: 1000000,
  colors: {},
};
export function matchesConcern(item: MapItem, id: ConcernId) {
  const categories = item.categoryIds ?? [];
  switch (id) {
    case "war":
      return (
        item.kind === "Conflict" &&
        (item.dataset !== "hapi-conflict" ||
          item.eventType === "political_violence")
      );
    case "disease":
      return categories.includes("disease");
    case "hunger":
      return (
        item.kind === "Hunger" &&
        item.dataset !== "hapi-famine" &&
        item.dataset !== "hapi-needs"
      );
    case "famine":
      return item.dataset === "hapi-famine";
    case "displacement":
      return (
        item.dataset === "hapi-idps" ||
        (item.kind === "Displacement" && item.recordType === "Emergency")
      );
    case "refugees":
      return item.dataset === "hapi-refugees";
    case "water":
      return item.kind === "Water";
    case "health":
      return item.kind === "Health" && !categories.includes("disease");
    case "floods":
      return categories.includes("flood-response");
    case "fires":
      return categories.includes("wildfire-response");
    case "drought":
      return categories.includes("drought-response");
    case "earthquakes":
      return categories.includes("earthquake-response");
    case "rainfall":
      return item.dataset === "hapi-rainfall";
    case "risk":
      return item.dataset === "hapi-risk";
    case "storms":
      return categories.includes("storm-response");
    case "volcanoes":
      return categories.includes("volcano-response");
    case "needs":
      return (
        (item.kind === "Humanitarian needs" ||
          (item.dataset === "hapi-needs" && item.kind === "Hunger")) &&
        item.dataset !== "hapi-funding" &&
        item.dataset !== "hapi-risk"
      );
    case "shelter":
      return item.kind === "Displacement" && item.dataset === "hapi-needs";
    case "other-hazards":
      return (
        item.kind === "Disaster response" &&
        categories.every(
          (category) =>
            ![
              "storm-response",
              "volcano-response",
              "flood-response",
              "wildfire-response",
              "drought-response",
              "earthquake-response",
            ].includes(category),
        )
      );
  }
}
export function inOverlayPeriod(
  item: MapItem,
  period: OverlaySettings["period"],
  now: number,
) {
  if (period === "Latest") return item.eventStatus !== "Closed";
  const days = period === "30 days" ? 30 : period === "90 days" ? 90 : 365;
  const date = item.referencePeriod?.end ?? item.source.published;
  return date !== null && Date.parse(date) >= now - days * 86400000;
}
export function concernColor(id: ConcernId, settings: OverlaySettings) {
  return (
    settings.colors[id] ?? concerns.find((concern) => concern.id === id)!.color
  );
}
export function concernMeasurement(item: MapItem, id: ConcernId) {
  const metric = concerns.find((concern) => concern.id === id)!.metric;
  if (id === "war" && item.eventType !== "political_violence") return undefined;
  return item.measurements?.find(
    (measurement: Measurement) => measurement.metric === metric,
  );
}
