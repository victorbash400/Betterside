import { useMemo, useState } from "react";
import { AgCharts } from "ag-charts-react";
import { AllEnterpriseModule, type AgChartOptions } from "ag-charts-enterprise";
import type { ChatChart } from "../../lib/chatCharts";
import ChatAnalysisGrid from "./ChatAnalysisGrid";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import styles from "./ChatChartWidget.module.css";
import resultStyles from "./ChatResult.module.css";
export default function ChatChartWidget({ chart }: { chart: ChatChart }) {
  const [table, setTable] = useState(false);
  const options = useMemo<AgChartOptions>(() => {
    const common = {
      data: chart.data,
      background: { visible: false },
      padding: { top: 12, right: 12, bottom: 12, left: 12 },
      theme: {
        palette: {
          fills: ["#557c76", "#91aea7", "#b3c6b6", "#738b98", "#a3b9c3"],
          strokes: ["#557c76"],
        },
      },
      legend: { enabled: false },
    };
    if (chart.type === "donut" || chart.type === "pie")
      return {
        ...common,
        series: [
          {
            type: chart.type,
            angleKey: "value",
            calloutLabelKey: "label",
            sectorLabelKey: "value",
            ...(chart.type === "donut" ? { innerRadiusRatio: 0.65 } : {}),
          },
        ],
      };
    if (chart.type === "heatmap") return { ...common, series: [{ type: "heatmap", xKey: "label", yKey: "category", colorKey: "value", colorName: "Source records" }] };
    if (chart.type === "scatter") return { ...common, series: [{ type: "scatter", xKey: "x", yKey: "value", xName: "Target · USD sandbox", yName: chart.unit, labelKey: "label" }] };
    if (chart.type === "bubble") return { ...common, series: [{ type: "bubble", xKey: "x", yKey: "value", sizeKey: "size", xName: "Target · USD sandbox", yName: chart.unit, sizeName: "Gap · USD sandbox", labelKey: "label" }] };
    if (chart.type === "histogram") return { ...common, series: [{ type: "histogram", xKey: "value", xName: chart.unit }] };
    if (chart.type === "treemap") return { ...common, series: [{ type: "treemap", labelKey: "label", sizeKey: "value" }] };
    if (chart.type === "radar") return { ...common, series: [{ type: "radar-line", angleKey: "label", radiusKey: "value", radiusName: chart.unit }] };
    if (chart.type === "radial-bar") return { ...common, series: [{ type: "radial-bar", radiusKey: "label", angleKey: "value", angleName: chart.unit }] };
    const series = { xKey: "label", yKey: "value", yName: chart.unit };
    if (chart.type === "line")
      return { ...common, series: [{ ...series, type: "line" }] };
    if (chart.type === "area")
      return { ...common, series: [{ ...series, type: "area" }] };
    if (chart.type === "waterfall") return { ...common, series: [{ ...series, type: "waterfall" }] };
    return { ...common, series: [{ ...series, type: "bar", direction: chart.type === "bar" ? "horizontal" : "vertical" }] };
  }, [chart]);
  return (
    <section className={resultStyles.analysis} aria-label={chart.title}>
      <div className={styles.heading}>
        <strong>{chart.title}</strong>
        {chart.type !== "summary" && (
          <SettingsInlineButton aria-pressed={table} onClick={() => setTable(!table)}>
            {table ? "Chart" : "Data"}
          </SettingsInlineButton>
        )}
      </div>
      {chart.type === "summary" ? (
        <dl className={styles.summary}>
          {chart.data.map((datum) => (
            <div key={datum.label}>
              <dt>{datum.label}</dt>
              <dd>
                {chart.unit === "USD" ? "$" : ""}
                {datum.value.toLocaleString("en")}
              </dd>
            </div>
          ))}
        </dl>
      ) : table ? (
        <ChatAnalysisGrid label={chart.title} rows={chart.data.map((datum, index) => ({ id: `${index}:${datum.label}`, ...datum }))}
          columns={[{ field: "label", headerName: "Group", chartDataType: "category", flex: 1 },
            { field: "value", headerName: chart.unit, chartDataType: "series", enableValue: true, type: "numericColumn", filter: "agNumberColumnFilter" }]}/>

      ) : (
        <AgCharts
          options={options}
          modules={[AllEnterpriseModule]}
          className={styles.chart}
        />
      )}
      <details className={styles.sources}>
        <summary>
          {chart.recordCount.toLocaleString("en")} {chart.basis === "contributions" ? chart.recordCount === 1 ? "sandbox order" : "sandbox orders" : chart.recordCount === 1 ? "source record" : "source records"}
          {chart.undatedCount
            ? ` · ${chart.undatedCount} undated excluded`
            : ""}
        </summary>
        {chart.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {source.label}
          </a>
        ))}
      </details>
    </section>
  );
}
