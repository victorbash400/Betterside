import { useMemo } from "react";
import { AgCharts } from "ag-charts-react";
import { AllCommunityModule, type AgChartOptions } from "ag-charts-enterprise";
import type { TrendSeries } from "../../lib/trends";
import styles from "./TrendChart.module.css";
export default function TrendChart({ series }: { series: TrendSeries[] }) {
  const options = useMemo<AgChartOptions>(
    () => ({
      background: { visible: false },
      animation: { enabled: false },
      padding: { top: 14, right: 12, bottom: 12, left: 12 },
      theme: {
        palette: {
          fills: ["#557c76", "#c18a62", "#738b98", "#a36191", "#8b955a"],
          strokes: ["#557c76", "#c18a62", "#738b98", "#a36191", "#8b955a"],
        },
      },
      series: series.map((item) => ({
        type: "line" as const,
        data: item.points.map((point) => ({
          ...point,
          date: new Date(point.date),
        })),
        xKey: "date",
        yKey: "value",
        yName: `${item.label} · ${item.source}`,
        marker: { enabled: true, size: 4 },
        tooltip: {
          renderer: ({
            datum,
          }: {
            datum: Omit<TrendSeries["points"][number], "date"> & { date: Date };
          }) => ({
            title: item.label,
            heading: datum.value.toLocaleString("en"),
            data: [
              { label: item.unit, value: datum.value.toLocaleString("en") },
              {
                label: "Reference from",
                value: datum.date.toLocaleDateString("en-GB", {
                  timeZone: "UTC",
                }),
              },
              {
                label: "Reference through",
                value: datum.end
                  ? new Date(datum.end).toLocaleDateString("en-GB", {
                      timeZone: "UTC",
                    })
                  : "—",
              },
              { label: "Source", value: datum.source.label },
            ],
          }),
        },
      })),
      axes: {
        x: { type: "time" },
        y: {
          type: "number",
          title: { enabled: true, text: series[0]?.unit },
          label: {
            formatter: ({ value }: { value: number }) =>
              value.toLocaleString("en", {
                notation: "compact",
                maximumFractionDigits: 1,
              }),
          },
        },
      },
      legend: { enabled: false },
    }),
    [series],
  );
  return (
    <div
      className={styles.chart}
      role="img"
      aria-label={`${series[0]?.unit ?? "Measurement"} over time`}
    >
      <AgCharts
        options={options}
        modules={[AllCommunityModule]}
        className={styles.canvas}
      />
    </div>
  );
}
