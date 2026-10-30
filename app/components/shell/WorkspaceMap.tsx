import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import MapWindow from "../map/MapWindow";
import type { MapItem, Filters } from "../../lib/types";
import type { OverlaySettings } from "../../lib/concerns";
import type { MapViewSettings } from "../../lib/mapViews";
import type { Analysis } from "../../lib/analysis";
import type { OverlayPoint } from "../../lib/overlayData";
import type { useMapGeography } from "../../state/useMapGeography";
import styles from "./Workspace.module.css";
const GlobeCanvas = dynamic(() => import("../map/GlobeCanvas"), { ssr: false });
const StudioDashboard = dynamic(() => import("../dashboard/StudioDashboard"), {
  ssr: false,
});
export default function WorkspaceMap({
  geography,
  points,
  items,
  selected,
  onSelect,
  metric,
  onMetric,
  projection,
  onProjection,
  analysis,
  overlay,
  country,
  countryCode,
  focusAreas,
  mapViewSettings,
}: {
  geography: ReturnType<typeof useMapGeography>;
  points: OverlayPoint[];
  items: MapItem[];
  selected?: MapItem;
  onSelect: (item: MapItem) => void;
  metric: Filters["metric"];
  onMetric: (metric: Filters["metric"]) => void;
  projection: "globe" | "mercator";
  onProjection: (projection: "globe" | "mercator") => void;
  analysis?: Analysis;
  overlay: OverlaySettings;
  country: string;
  countryCode?: string;
  focusAreas?: string[];
  mapViewSettings: MapViewSettings;
}) {
  const [funding, setFunding] = useState(false),
    [projects, setProjects] = useState(false),
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
        geography={geography}
        points={points}
        issues={items}
        overlay={overlay}
        country={country}
        countryCode={countryCode}
        focusAreas={focusAreas}
        mapViewSettings={mapViewSettings}
        focusRequest={0}
        selected={selected}
        onSelect={onSelect}
        metric={metric}
        projection={projection}
        onProjection={onProjection}
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
