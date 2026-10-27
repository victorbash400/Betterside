"use client";
import { useMemo, useState } from "react";
import { AgStudio } from "ag-studio-react";
import {
  AgStudioLicenseManager,
  studioTheme,
  type AgReportState,
} from "ag-studio";
import { dashboardRows, dashboardState } from "../../lib/dashboard";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import type { Analysis } from "../../lib/analysis";
import type { Issue } from "../../lib/types";
import { projectCellRenderer } from "./projectCellRenderer";
import styles from "./StudioDashboard.module.css";
const license = process.env.NEXT_PUBLIC_AG_STUDIO_LICENSE_KEY;
if (license) AgStudioLicenseManager.setLicenseKey(license);
const theme = studioTheme.withParams({
  fontFamily: "Geist, sans-serif",
  fontSize: 12,
  accentColor: "#54734c",
  backgroundColor: "#fafaf8",
  foregroundColor: "#292b28",
  borderColor: "#ddded7",
  studioWidgetBorder: false,
  studioWidgetBorderRadius: 10,
  studioWidgetBackgroundColor: "#f3f3f0",
  studioWidgetTitleFontSize: 12,
  studioCanvasBorder: false,
  studioCanvasShadow: false,
  studioCanvasBackgroundColor: "#fafaf8",
  chartPaletteFills1Color: "#54734c",
  chartPaletteFills2Color: "#b8c4af",
  chartPaletteStrokes1Color: "#54734c",
  chartPaletteStrokes2Color: "#b8c4af",
});
export default function StudioDashboard({
  issues,
  analysis,
  onSelect,
}: {
  issues: Issue[];
  analysis?: Analysis;
  onSelect:(issue:Issue)=>void;
}) {
  const narrow = useNarrowLayout();
  const [editing, setEditing] = useState(false),
    [error, setError] = useState(""),
    [savedStates, setSavedStates] = useState<
      Partial<Record<"mobile" | "desktop", AgReportState>>
    >({});
  const initialState = useMemo<AgReportState>(() => {
    const next = structuredClone(
      analysis
        ? dashboardState
        : (savedStates[narrow ? "mobile" : "desktop"] ?? dashboardState),
    );
    if (narrow) {
      for (const page of next.pages) {
        page.layout = {
          ...page.layout,
          minWidth: 0,
          columns: 1,
          pagePadding: 10,
          widgetPadding: 10,
        };
        if (page.widgetLayout)
          for (const layout of Object.values(page.widgetLayout)) {
            if (layout) {
              layout.xTrack = 0;
              layout.xSpan = 1;
            }
          }
        if (page.widgets?.projects?.type === "grid")
          page.widgets.projects.dataMapping.cols = [
            { id: "projects.location" },
            { id: "projects.issue" },
            { id: "projects.gap" },
          ];
      }
    }
    for (const page of next.pages)
      for (const widget of Object.values(page.widgets ?? {})) {
        if (!widget || !("format" in widget)) continue;
        widget.format = {
          ...widget.format,
          title: {
            ...widget.format?.title,
            typography: {
              fontSize: 12,
              fontFamily: "Geist",
              fontWeight: "normal",
            },
          },
        };
        if (widget.type === "column-chart-stacked")
          widget.format = {
            ...widget.format,
            style: {
              theme: {
                common: { legend: { enabled: true, position: "bottom" } },
              },
            },
          };
      }
    if (narrow)
      for (const page of next.pages)
        if (page.widgets?.funding?.type === "column-chart-stacked")
          page.widgets.funding = {
            ...page.widgets.funding,
            type: "bar-chart-stacked",
          };
    if (!analysis) return next;
    const page = next.pages[0];
    if (
      analysis.kind === "funding-by-issue" &&
      page.widgets?.funding &&
      "dataMapping" in page.widgets.funding
    ) {
      page.widgets.funding = {
        type: "column-chart-stacked",
        dataMapping: {
          categoryKey: [{ id: "projects.issue" }],
          valueKey: [
            { id: "projects.received", aggregation: "sum" },
            { id: "projects.gap", aggregation: "sum" },
          ],
        },
        format: {
          title: {
            text: "Sandbox funding by issue",
            enabled: true,
            typography: { fontSize: 12, fontFamily: "Geist" },
          },
          style: {
            theme: {
              common: { legend: { enabled: true, position: "bottom" } },
            },
          },
        },
      };
    }
    if (analysis.kind === "project-comparison") {
      page.widgetLayout = {
        projects: { xTrack: 0, yTrack: 0, xSpan: 12, ySpan: 12 },
      };
      delete page.widgets?.funding;
    }
    if (narrow && page.widgetLayout)
      for (const layout of Object.values(page.widgetLayout)) {
        if (layout) {
          layout.xTrack = 0;
          layout.xSpan = 1;
        }
      }
    if (narrow && page.widgets?.funding?.type === "column-chart-stacked")
      page.widgets.funding = {
        ...page.widgets.funding,
        type: "bar-chart-stacked",
      };
    return next;
  }, [analysis, savedStates, narrow]);
  const data = useMemo(
    () => ({
      sources: [
        {
          id: "projects",
          name: "Demonstration projects",
          data: dashboardRows(issues),
        },
      ],
    }),
    [issues],
  );
  const widgets=useMemo(()=>({overrides:[{id:"grid" as const,options:{createCellRenderer:(field:{fieldId:string})=>field.fieldId==="projects.location"?projectCellRenderer(issues,onSelect):undefined}}]}),[issues,onSelect]);
  return (
    <section className={styles.dashboard} aria-label="Project analytics">
      <div className={styles.toolbar}>
        <span>Demonstration data · USD</span>
        <button
          aria-pressed={editing}
          onClick={() => setEditing((value) => !value)}
        >
          {editing ? "Done" : "Edit dashboard"}
        </button>
      </div>
      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}
      <div className={styles.studio}>
        <AgStudio
          key={`${analysis?.id ?? "overview"}-${narrow ? "mobile" : "desktop"}`}
          onStateUpdated={(event) =>
            setSavedStates((previous) => ({
              ...previous,
              [narrow ? "mobile" : "desktop"]: event.api.getState(),
            }))
          }
          widgets={config=>({...config,widgets:config.widgets.map(widget=>widget.id==="grid"?{...widget,options:widgets.overrides[0].options}:widget)})}
          panels={{
            view: { left: [], right: [] },
            edit: { left: [], right: ["edit", "data", "filters"] },
          }}
          theme={theme}
          data={data}
          mode={editing ? "edit" : "view"}
          initialState={initialState}
          onErrorRaised={() => setError("Dashboard could not render.")}
        />
      </div>
    </section>
  );
}
