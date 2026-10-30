import { useMemo, useState } from "react";
import { AgCharts } from "ag-charts-react";
import { AllCommunityModule, type AgChartOptions } from "ag-charts-enterprise";
import type { ChatChart } from "../../lib/chatCharts";
import ChatTable from "./ChatTable";
import styles from "./ChatChartWidget.module.css";
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
    if (chart.type === "donut")
      return {
        ...common,
        series: [
          {
            type: "donut",
            angleKey: "value",
            calloutLabelKey: "label",
            sectorLabelKey: "value",
            innerRadiusRatio: 0.65,
          },
        ],
      };
    const series = { xKey: "label", yKey: "value", yName: chart.unit };
    if (chart.type === "line")
      return { ...common, series: [{ ...series, type: "line" }] };
    if (chart.type === "area")
      return { ...common, series: [{ ...series, type: "area" }] };
    return { ...common, series: [{ ...series, type: "bar" }] };
  }, [chart]);
  return (
    <section className={styles.widget} aria-label={chart.title}>
      <div className={styles.heading}>
        <strong>{chart.title}</strong>
        {chart.type !== "summary" && (
          <button aria-pressed={table} onClick={() => setTable(!table)}>
            {table ? "Chart" : "Data"}
          </button>
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
        <ChatTable>
          <thead>
            <tr>
              <th>Group</th>
              <th>{chart.unit}</th>
            </tr>
          </thead>
          <tbody>
            {chart.data.map((datum) => (
              <tr key={datum.label}>
                <td>{datum.label}</td>
                <td>{datum.value.toLocaleString("en")}</td>
              </tr>
            ))}
          </tbody>
        </ChatTable>
      ) : (
        <AgCharts
          options={options}
          modules={[AllCommunityModule]}
          className={styles.chart}
        />
      )}
      <details className={styles.sources}>
        <summary>
          {chart.recordCount.toLocaleString("en")} source records
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
