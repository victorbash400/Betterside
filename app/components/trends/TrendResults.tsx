import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { comparableTrendSeries, type TrendsResponse } from "../../lib/trends";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsRow from "../settings/SettingsRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import SettingsPicker from "../settings/SettingsPicker";
import LoadingRegion from "../controls/LoadingRegion";
import TrendSeriesChoices from "./TrendSeriesChoices";
import styles from "./TrendPanel.module.css";
const TrendChart = dynamic(() => import("./TrendChart"), {
  ssr: false,
  loading: () => <LoadingRegion compact label="Loading chart" />,
});
const TrendAnalyticsGrid = dynamic(() => import("./TrendAnalyticsGrid"), {
  ssr: false,
  loading: () => <LoadingRegion compact label="Loading comparison" />,
});
export default function TrendResults({
  history,
  recordId,
  initialView = "Chart",
}: {
  history: { result?: TrendsResponse; busy: boolean; error: string; retry: () => void };
  recordId?: string;
  initialView?: "Chart" | "Compare data";
}) {
  const [metric, setMetric] = useState("");
  const [selection, setSelection] = useState<string[]>();
  const [table, setTable] = useState(initialView === "Compare data");
  const series = useMemo(
    () =>
      history.result?.series.filter(
        (item) => !recordId || item.recordId === recordId,
      ) ?? [],
    [history.result, recordId],
  );
  const metrics = [
    ...new Map(
      series.map((item) => [
        item.metric,
        { value: item.metric, label: item.unit },
      ]),
    ).values(),
  ];
  const activeMetric = metrics.some((item) => item.value === metric)
    ? metric
    : metrics[0]?.value;
  const available = comparableTrendSeries(series, activeMetric ?? "");
  const selected = selection ?? available.slice(0, 4).map((item) => item.id);
  const visible = available.filter((item) => selected.includes(item.id));
  return (
    <section className={styles.panel} aria-label="Trends">
      {history.busy ? (
        <LoadingRegion compact label="Loading history" />
      ) : history.error ? (
        <div className={styles.error} role="alert">
          {history.error}
          <SettingsInlineButton onClick={history.retry}>Retry</SettingsInlineButton>
        </div>
      ) : (
        <>
          {Boolean(history.result?.failures.length) && (
            <div className={styles.error} role="alert">
              {history.result!.failures.map((failure) => (
                <span key={`${failure.countryCode}:${failure.dataset}`}>
                  {failure.countryCode} · {failure.dataset}: {failure.error}
                </span>
              ))}
              <SettingsInlineButton onClick={history.retry}>Retry</SettingsInlineButton>
            </div>
          )}
          {metrics.length > 0 && (
            <SettingsGroup>
              <SettingsRow label="Measure">
              <SettingsPicker
                label="Trend measure"
                value={activeMetric ?? ""}
                options={metrics}
                onChange={(value) => {
                  setMetric(value);
                  setSelection(undefined);
                }}
                width="min(280px, 100%)"
              />
              </SettingsRow>
              <SettingsRow label="View">
                <SettingsPicker label="Trend view" value={table ? "data" : "chart"}
                  options={[{value: "chart", label: "Chart"}, {value: "data", label: "Compare data"}]}
                  onChange={(value) => setTable(value === "data")}/>
              </SettingsRow>
            </SettingsGroup>
          )}
          {!available.length ? (
            <span className={styles.unavailable}>
              {series.length
                ? `${series.reduce((total, item) => total + item.points.length, 0)} dated observations`
                : "History unavailable"}
            </span>
          ) : (
            <>
              <TrendSeriesChoices
                series={available}
                selected={selected}
                onChange={setSelection}
              />
              {visible.length > 0 &&
                (table ? (
                  <TrendAnalyticsGrid series={visible} />
                ) : (
                  <TrendChart series={visible} />
                ))}
              <div className={styles.sources}>
                {[
                  ...new Map(
                    visible.flatMap((item) =>
                      item.points.map(
                        (point) => [point.source.url, point.source] as const,
                      ),
                    ),
                  ).values(),
                ].map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
