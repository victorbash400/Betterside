import { useMemo, useRef, useState } from "react";
import { AgStudio, createWidgets, type AgWidgetDefinition } from "ag-studio-react";
import { AgStudioLicenseManager, studioTheme, type AgDataSourcesDefinition, type AgDefaultRegistry, type AgReportState } from "ag-studio";
import type { ContributionReport } from "../../lib/contributionReport";
import LayerSelect from "../map/LayerSelect";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import ContributionTotalsWidget, { type ContributionTotalsConfig } from "./ContributionTotalsWidget";
import styles from "./ChatContributionReport.module.css";
import resultStyles from "./ChatResult.module.css";

if (process.env.NEXT_PUBLIC_AG_STUDIO_LICENSE_KEY)
  AgStudioLicenseManager.setLicenseKey(process.env.NEXT_PUBLIC_AG_STUDIO_LICENSE_KEY);

type TotalsDefinition = AgWidgetDefinition<"contribution-totals", ContributionTotalsConfig>;
interface ContributionRegistry extends Omit<AgDefaultRegistry, "widgets"> {
  widgets: readonly (AgDefaultRegistry["widgets"][number] | TotalsDefinition)[];
}

const totals: TotalsDefinition = {
  id: "contribution-totals",
  label: "Contribution totals",
  comp: ContributionTotalsWidget,
  dataMapping: {
    net: { type: "field", supportedRoles: ["numeric"], requires: { cardinality: "one" }, required: true },
    refunds: { type: "field", supportedRoles: ["numeric"], requires: { cardinality: "one" }, required: true },
  },
  form: (params) => params.createDefaults({
    dataMappingItems: [{ key: "net", label: "Net contributed" }, { key: "refunds", label: "Refunded" }],
  }),
  minSize: { width: 160, height: 56 },
  defaultSize: { width: 300, height: 56 },
};
const widgets = createWidgets<ContributionRegistry>({ additionalTypes: [totals] });
const theme = studioTheme.withParams({
  fontFamily: "Geist, sans-serif",
  fontSize: 12,
  studioMinWidth: 0,
  studioMinHeight: 0,
  studioCanvasPadding: 0,
  studioWidgetPadding: 0,
  studioWidgetBorder: false,
  studioWrapperBorder: false,
  studioCanvasBorder: false,
  studioCanvasShadow: false,
  studioWrapperBackgroundColor: "var(--panel)",
  studioCanvasBackgroundColor: "var(--panel)",
  studioWidgetBackgroundColor: "var(--panel)",
  backgroundColor: "var(--panel)",
  foregroundColor: "var(--ink)",
  borderColor: "var(--border)",
  accentColor: "#557c76",
  chartPaletteFills1Color: "#557c76",
  chartPaletteFills2Color: "#b3c6b6",
  chartPaletteStrokes1Color: "#557c76",
  chartPaletteStrokes2Color: "#b3c6b6",
  chartChartPadding: 8,
});
const receiptGrid = {
  type: "grid",
  format: { style: { columnWidth: 132 } },
  dataMapping: {
    cols: [
      { id: "ledger.project" }, { id: "ledger.date" }, { id: "ledger.net" },
      { id: "ledger.refunded" }, { id: "ledger.order" },
    ],
  },
} as const;
const trackHeight = 24;
const chartTracks = 12;

export default function ChatContributionReport({ report }: { report: ContributionReport }) {
  const studio = useRef<AgStudio<ContributionRegistry>>(null);
  const [ready, setReady] = useState(false);
  const [receipts, setReceipts] = useState(false);
  const [error, setError] = useState(false);
  const [project, setProject] = useState("");
  const projects = useMemo(() => [...new Set(report.rows.map((row) => row.project))].sort(), [report.rows]);
  const hasRefunds = report.rows.some((row) => row.refundCents > 0);
  function receiptTracks(filter: string) {
    const count = filter
      ? report.rows.filter((row) => row.project === filter).length
      : report.rows.length;
    return Math.min(9, Math.ceil((52 + count * 34) / trackHeight));
  }
  const data = useMemo<AgDataSourcesDefinition<ContributionRegistry>>(() => ({
    sources: [{
      id: "ledger",
      data: report.rows.map((row) => ({
        ...row,
        date: row.date || "Undated",
        month: row.month || "Undated",
        net: row.netCents / 100,
        refunded: row.refundCents / 100,
      })),
      fields: [
        { id: "order", name: "Order", format: "textFormat" },
        { id: "project", name: "Project", format: "textFormat" },
        { id: "date", name: "Captured (UTC)", format: "textFormat" },
        { id: "month", name: "Capture month", format: "textFormat" },
        { id: "net", name: "Net (USD)", format: "currencyFormat" },
        { id: "refunded", name: "Refunded (USD)", format: "currencyFormat" },
        { id: "netCents", format: "integerFormat" },
        { id: "refundCents", format: "integerFormat" },
      ],
    }],
  }), [report.rows]);

  const initialState = useMemo<AgReportState<ContributionRegistry>>(() => ({
    selectedPageId: "contributions",
    pages: [{
      id: "contributions",
      layout: { columns: 1, minWidth: 0, rowHeight: trackHeight, pagePadding: 0, widgetPadding: 0 },
      widgets: {
        totals: {
          type: "contribution-totals",
          dataMapping: {
            net: [{ id: "ledger.netCents", aggregation: "sum" }],
            refunds: [{ id: "ledger.refundCents", aggregation: "sum" }],
          },
        },
        chart: {
          type: report.groupBy === "project" ? "bar-chart-stacked" : "column-chart-stacked",
          dataMapping: {
            categoryKey: [{ id: `ledger.${report.groupBy}` }],
            valueKey: [
              { id: "ledger.net", aggregation: "sum" },
              ...(hasRefunds ? [{ id: "ledger.refunded", aggregation: "sum" as const }] : []),
            ],
          },
          format: { style: { theme: { common: { legend: { enabled: hasRefunds, position: "bottom" } } } } },
        },
      },
      widgetLayout: {
        totals: { xTrack: 0, xSpan: 1, yTrack: 0, ySpan: 3 },
        chart: { xTrack: 0, xSpan: 1, yTrack: 3, ySpan: 9 },
      },
    }],
  }), [report.groupBy, hasRefunds]);

  function filterProject(value: string) {
    const api = studio.current?.api;
    if (!api) return;
    const state = structuredClone(api.getState());
    const page = state.pages[0];
    page.filter = value ? {
      page: [{ field: { id: "ledger.project" }, model: { operator: "equals", value } }],
    } : undefined;
    const receiptLayout = page.widgetLayout?.receipts;
    if (receiptLayout) receiptLayout.ySpan = receiptTracks(value);
    api.setState(state);
    setProject(value);
  }

  function toggleReceipts() {
    const api = studio.current?.api;
    if (!api) return;
    const state = structuredClone(api.getState());
    const page = state.pages[0];
    if (!page?.widgets || !page.widgetLayout) return;
    if (receipts) {
      delete page.widgets.receipts;
      delete page.widgetLayout.receipts;
    } else {
      page.widgets.receipts = {
        ...receiptGrid,
        dataMapping: { cols: [...receiptGrid.dataMapping.cols] },
      };
      page.widgetLayout.receipts = { xTrack: 0, xSpan: 1, yTrack: chartTracks, ySpan: receiptTracks(project) };
    }
    api.setState(state);
    setReceipts(!receipts);
  }

  return (
    <section className={resultStyles.analysis} aria-label="PayPal sandbox contribution report">
      <div className={styles.header}>
        <strong>Sandbox contributions by {report.groupBy}</strong>
        {report.rows.length > 0 && (
          <SettingsInlineButton disabled={!ready || error} aria-expanded={receipts} onClick={toggleReceipts}>
            Receipts
          </SettingsInlineButton>
        )}
      </div>
      {(report.from || report.through) && (
        <span className={styles.note}>
          {report.from && report.through ? `${report.from} – ${report.through}` :
            report.from ? `From ${report.from}` : `Through ${report.through}`} · UTC
        </span>
      )}
      {report.undated > 0 && <span className={styles.note}>{report.undated} undated captures excluded</span>}
      {error && <span role="alert">Contribution report unavailable.</span>}
      {ready && !error && projects.length > 1 && (
        <LayerSelect label="Filter contributions by project" value={project}
          options={[{ value: "", label: "All projects" }, ...projects.map((name) => ({ value: name, label: name }))]}
          onChange={filterProject}
        />
      )}
      {report.rows.length > 0 && !error && (
        <div className={styles.studio} style={{ height: trackHeight * (chartTracks + (receipts ? receiptTracks(project) : 0)) }}>
          <AgStudio<ContributionRegistry>
            ref={studio}
            style={{ height: "100%", width: "100%" }}
            mode="view"
            data={data}
            initialState={initialState}
            widgets={widgets}
            theme={theme}
            panels={{ view: { left: [], right: [] } }}
            onApiReady={() => setReady(true)}
            onErrorRaised={() => setError(true)}
          />
        </div>
      )}
      {!report.rows.length && <span className={styles.note}>$0.00 net · 0 captured orders</span>}
    </section>
  );
}
