import { useMemo } from "react";
import {
  organizationCrisisRecords,
  organizationCrisisSelection,
} from "../lib/organizationCrisis";
import {
  organizationMapScope,
  type DirectoryOrganization,
} from "../lib/organizations";
import { overlayPoints } from "../lib/overlayData";
import type { OverlaySettings } from "../lib/concerns";
import type { MapItem } from "../lib/types";
import type { MapGeography } from "../lib/mapGeography";
import type { DatasetSelection } from "../lib/dataSources";

export function useOrganizationCrisisMap({
  enabled,
  records,
  organizations,
  selected,
  country,
  topics,
  geography,
  datasets,
  overlay,
}: {
  enabled: boolean;
  records: MapItem[];
  organizations: DirectoryOrganization[];
  selected?: DirectoryOrganization;
  country?: string;
  topics: string[];
  geography: MapGeography;
  datasets: DatasetSelection;
  overlay: OverlaySettings;
}) {
  const selection = useMemo(
    () => organizationCrisisSelection(topics, selected),
    [topics, selected],
  );
  const display = useMemo(
    () => ({ ...overlay, concerns: selection.concerns }),
    [overlay, selection.concerns],
  );
  const scope = useMemo(
    () => organizationMapScope(organizations, selected, country),
    [organizations, selected, country],
  );
  const focusAreas = useMemo(
    () =>
      selected
        ? [...new Set(selected.presence.map((area) => area.countryCode))]
        : undefined,
    [selected],
  );
  const items = useMemo(
    () =>
      enabled
        ? organizationCrisisRecords({
            records,
            organizations,
            selected,
            country,
            topics,
            geography,
            datasets,
            period: overlay.period,
          })
        : [],
    [
      enabled,
      records,
      organizations,
      selected,
      country,
      topics,
      geography,
      datasets,
      overlay.period,
    ],
  );
  const points = useMemo(
    () =>
      overlayPoints(
        items,
        { concerns: display.concerns, scale: display.scale },
        geography,
      ),
    [items, display.concerns, display.scale, geography],
  );
  const error =
    !scope.some((org) => org.presence.length) && selected
      ? "Reported operating areas unavailable."
      : selection.unsupported.length &&
          (topics.length || !selection.concerns.length)
        ? `No crisis measure: ${selection.unsupported.join(", ")}.`
        : "";
  return { items, points, overlay: display, focusAreas, error };
}
