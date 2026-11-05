import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import type { MapItem } from "../../lib/types";
import { recordValue, recordUnit } from "../../lib/recordValues";
import { formatDate } from "../../lib/dates";
import ChatAnalysisGrid from "./ChatAnalysisGrid";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import ChatRecordSourceCell from "./ChatRecordSourceCell";
import styles from "./ChatResult.module.css";
export default function ChatRecordGrid({
  records,
  total,
  nextOffset,
  onSelect,
  onMore,
  busy,
}: {
  records: MapItem[];
  total: number;
  nextOffset: number | null;
  onSelect: (record: MapItem) => void;
  onMore: () => void;
  busy: boolean;
}) {
  const hasMeasurements = records.some(
    (record) => recordValue(record) !== null,
  );
  const hasProjects = records.some((record) => record.project);
  const onlyProjects =
    records.length > 0 && records.every((record) => record.project);
  const columns = useMemo<ColDef<MapItem>[]>(
    () => [
      {
        colId: "record",
        headerName: onlyProjects ? "Project · sandbox" : "Record",
        valueGetter: ({ data }) => data?.project?.name ?? data?.location ?? "",
        minWidth: 180,
        chartDataType: "category",
        flex: 1,
        tooltipField: "location",
      },
      { field: "country", headerName: "Country", width: 120 },
      { field: "kind", headerName: "Cause", width: 130 },
      ...(hasMeasurements
        ? ([
            {
              colId: "value",
              headerName: "Value",
              width: 110,
              minWidth: 100,
              type: "numericColumn",
              filter: "agNumberColumnFilter",
              chartDataType: "excluded" as const,
              valueGetter: ({ data }: { data?: MapItem }) =>
                data ? recordValue(data) : null,
              valueFormatter: ({
                value,
              }: {
                value: number | null | undefined;
              }) =>
                value == null
                  ? "—"
                  : new Intl.NumberFormat("en", {
                      maximumFractionDigits: 2,
                    }).format(value),
            },
            {
              colId: "unit",
              headerName: "Measure",
              width: 190,
              valueGetter: ({ data }: { data?: MapItem }) =>
                data ? recordUnit(data) : "",
              tooltipValueGetter: ({ value }: { value: string | undefined }) =>
                value,
            },
          ] as ColDef<MapItem>[])
        : []),
      ...(hasProjects
        ? [
            {
              colId: "gap",
              headerName: "Gap · USD sandbox",
              width: 165,
              type: "numericColumn",
              filter: "agNumberColumnFilter",
              enableValue: true,
              chartDataType: "series" as const,
              valueGetter: ({ data }: { data?: MapItem }) =>
                data?.project
                  ? Math.max(0, data.project.target - data.project.raised)
                  : null,
            },
          ]
        : []),
      {
        colId: "reference",
        headerName: "Reference",
        width: 130,
        valueGetter: ({ data }) =>
          data?.referencePeriod?.end ?? data?.referencePeriod?.start,
        valueFormatter: ({ value }) => (value ? formatDate(value, "UTC") : "—"),
      },
      {
        field: "source.label",
        headerName: "Source",
        width: 180,
        cellRenderer: ChatRecordSourceCell,
      },
    ],
    [hasMeasurements, hasProjects, onlyProjects],
  );
  return (
    <div className={styles.analysis}>
      <div className={styles.heading}>
        <span>{total.toLocaleString("en")} matching records</span>
        {nextOffset !== null && (
          <SettingsInlineButton disabled={busy} onClick={onMore}>
            More results
          </SettingsInlineButton>
        )}
      </div>
      <div
        className={styles.grid}

      >
        <ChatAnalysisGrid
          label="Chat record results"
          rows={records}
          columns={columns}
          onOpen={onSelect}
        />
      </div>
    </div>
  );
}
