import {
  concerns,
  matchesConcern,
  inOverlayPeriod,
  type ConcernId,
  type OverlaySettings,
} from "./concerns.ts";
import {
  organizationMapScope,
  womenRightsTopic,
  type DirectoryOrganization,
} from "./organizations.ts";
import type { MapGeography } from "./mapGeography.ts";
import type { MapItem } from "./types.ts";
import type { DatasetSelection } from "./dataSources.ts";
import { organizationCoverageGeometry } from "./organizationCoverage.ts";
import { pointInArea } from "./pointInArea.ts";

export const organizationCrisisMeasures: Record<string, ConcernId[]> = {
  [womenRightsTopic]: ["womens-rights"],
  Health: ["health", "disease"],
  Hunger: ["hunger", "famine"],
  Water: ["water"],
  Refugees: ["refugees"],
  Shelter: ["shelter"],
  "Camp management": ["displacement", "refugees"],
  "Conflict response": ["war"],
  Climate: ["rainfall"],
  "Disaster response": [
    "floods",
    "fires",
    "drought",
    "earthquakes",
    "storms",
    "volcanoes",
    "other-hazards",
  ],
};

export function organizationCrisisSelection(topics: string[]) {
  const ids = new Set(
    topics.flatMap((topic) => organizationCrisisMeasures[topic] ?? []),
  );
  return {
    concerns: concerns
      .filter((concern) => ids.has(concern.id))
      .map((concern) => concern.id),
    unsupported: topics.filter(
      (topic) => !organizationCrisisMeasures[topic]?.length,
    ),
  };
}

export function organizationCrisisRecords({
  records,
  organizations,
  selected,
  country,
  topics,
  geography,
  datasets,
  period,
  now = Date.now(),
}: {
  records: MapItem[];
  organizations: DirectoryOrganization[];
  selected?: DirectoryOrganization;
  country?: string;
  topics: string[];
  geography: MapGeography;
  datasets: DatasetSelection;
  period: OverlaySettings["period"];
  now?: number;
}) {
  const scope = organizationMapScope(organizations, selected, country);
  const codes = new Set(
    scope.flatMap((org) => org.presence.map((area) => area.countryCode)),
  );
  const names = new Set(
    scope.flatMap((org) => org.presence.map((area) => area.country)),
  );
  const areas = organizationCoverageGeometry(scope, geography).features;
  const selection = organizationCrisisSelection(topics);
  return records.filter((item) => {
    if (
      datasets[item.dataset ?? "catalogue"] === false ||
      !inOverlayPeriod(item, period, now)
    )
      return false;
    if (!selection.concerns.some((id) => matchesConcern(item, id)))
      return false;
    if (item.geographicPrecision === "Event location")
      return areas.some((area) => pointInArea(item.coordinates, area.geometry));
    if (item.reportingArea) return codes.has(item.reportingArea.countryCode);
    return names.has(item.country);
  });
}
