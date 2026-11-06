import { concerns, matchesConcern } from "../lib/concerns.ts";
import { measurementLabels } from "../lib/measurementLabels.ts";
import { trendScopeSchema } from "../lib/trends.ts";
import type { ChatAgentContext } from "./context.ts";

export function chatEvidence({ records, areaId, selectedIds, context }: ChatAgentContext) {
  const visibleIds = new Set(selectedIds ?? []);
  const visibleRecords = records.filter(record => visibleIds.has(record.id));
  const measuredRecords = visibleRecords.filter(record => record.measurements?.length);
  const selectedId = areaId ?? (visibleRecords.length === 1 ? visibleRecords[0].id
    : measuredRecords.length === 1 ? measuredRecords[0].id : undefined);
  const selectedRecord = selectedId ? records.find(record => record.id === selectedId) : undefined;
  const scopedRecords = (visibleRecords.length ? visibleRecords : records).filter(record =>
    (!context?.country || record.country === context.country) &&
    (!context?.causes.length || context.causes.some(cause => matchesConcern(record, cause))),
  );
  const scope = selectedRecord?.reportingArea ? trendScopeSchema.safeParse({
    countries: [selectedRecord.reportingArea.countryCode],
    dataset: selectedRecord.dataset,
    concern: concerns.find(cause => matchesConcern(selectedRecord, cause.id))?.id,
    recordId: selectedRecord.id,
  }) : undefined;
  return {
    selection: selectedRecord ? "selected" : selectedId ? "unavailable" : "none",
    selectedRecord: selectedRecord ? {
      ...selectedRecord,
      source: {
        label: selectedRecord.source.label,
        url: selectedRecord.source.url,
        ...(selectedRecord.dataset?.startsWith("hapi-")
          ? { updatedAt: selectedRecord.source.published }
          : { publishedAt: selectedRecord.source.published }),
        loadedAt: selectedRecord.source.reviewed,
      },
    } : null,
    selectedMeasurements: selectedRecord?.measurements?.map(measurement => ({
      ...measurement, label: measurementLabels[measurement.metric],
      displayValue: measurement.value.toLocaleString("en", { maximumFractionDigits: 20 }),
    })) ?? [],
    selectedHistoryScope: scope?.success ? scope.data : null,
    workspaceRecords: context?.country || context?.causes.length ? scopedRecords.slice(0, 8) : [],
  };
}
