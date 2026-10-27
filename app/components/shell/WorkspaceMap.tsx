import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import MapTools from "../map/MapTools";
import MapWindow from "../map/MapWindow";
import type { MapItem, Filters } from "../../lib/types";
import type { Analysis } from "../../lib/analysis";
import styles from "./Workspace.module.css";
const GlobeCanvas = dynamic(() => import("../map/GlobeCanvas"), { ssr: false });
const StudioDashboard = dynamic(() => import("../dashboard/StudioDashboard"), {
  ssr: false,
});
export default function WorkspaceMap({
  items,
  selected,
  onSelect,
  metric,
  onMetric,
  projection,
  onProjection,
  analysis,
}: {
  items: MapItem[];
  selected?: MapItem;
  onSelect: (item: MapItem) => void;
  metric: Filters["metric"];
  onMetric: (metric: Filters["metric"]) => void;
  projection: "globe" | "mercator";
  onProjection: (projection: "globe" | "mercator") => void;
  analysis?: Analysis;
}) {
  const [funding, setFunding] = useState(false),
    [projects, setProjects] = useState(false),
    [markers, setMarkers] = useState(true),
    [focus, setFocus] = useState(0),
    [opened, setOpened] = useState({ funding: false, projects: false });
  useEffect(() => {
    if (!analysis) return;
    if (analysis.kind === "project-comparison") {
      setProjects(true);
      setOpened((value) => ({ ...value, projects: true }));
    } else {
      setFunding(true);
      setOpened((value) => ({ ...value, funding: true }));
    }
  }, [analysis]);
  return (
    <div className={styles.mapWorkspace}>
      <GlobeCanvas
        issues={markers ? items : []}
        focusRequest={focus}
        selected={selected}
        onSelect={onSelect}
        metric={metric}
        projection={projection}
        onProjection={onProjection}
      />
      <MapTools
        funding={funding}
        projects={projects}
        markers={markers}
        metric={metric}
        onFunding={() => {
          setOpened((value) => ({ ...value, funding: true }));
          setFunding((value) => !value);
        }}
        onProjects={() => {
          setOpened((value) => ({ ...value, projects: true }));
          setProjects((value) => !value);
        }}
        onMarkers={() => setMarkers((value) => !value)}
        onMetric={onMetric}
        canFocus={Boolean(selected)}
        onFocus={() => setFocus((value) => value + 1)}
      />
      {opened.funding && (
        <MapWindow
          title="Funding"
          hidden={!funding}
          onClose={() => setFunding(false)}
        >
          <StudioDashboard
            issues={items.filter((item) => item.project)}
            analysis={
              analysis?.kind === "project-comparison" ? undefined : analysis
            }
            widget="funding"
            onSelect={onSelect}
          />
        </MapWindow>
      )}
      {opened.projects && (
        <MapWindow
          title="Projects"
          hidden={!projects}
          offset={50}
          onClose={() => setProjects(false)}
        >
          <StudioDashboard
            issues={items.filter((item) => item.project)}
            widget="projects"
            onSelect={onSelect}
          />
        </MapWindow>
      )}
    </div>
  );
}
