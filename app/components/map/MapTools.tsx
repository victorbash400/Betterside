import { useState } from "react";
import {
  ChartColumn,
  Table2,
  Layers,
  MapPin,
  Check,
  Focus,
} from "lucide-react";
import IconButton from "../controls/IconButton";
import ContextMenu from "../controls/ContextMenu";
import type { Filters } from "../../lib/types";
import styles from "./MapTools.module.css";
export default function MapTools({
  funding,
  projects,
  markers,
  metric,
  onFunding,
  onProjects,
  onMarkers,
  onMetric,
  onFocus,
  canFocus,
}: {
  funding: boolean;
  projects: boolean;
  markers: boolean;
  metric: Filters["metric"];
  onFunding: () => void;
  onProjects: () => void;
  onMarkers: () => void;
  onMetric: (value: Filters["metric"]) => void;
  onFocus: () => void;
  canFocus: boolean;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <div
        className={styles.rail}
        role="toolbar"
        aria-label="Map workspace tools"
      >
        <IconButton
          label="Funding chart"
          title="Funding chart"
          selected={funding}
          onClick={onFunding}
        >
          <ChartColumn />
        </IconButton>
        <IconButton
          label="Projects table"
          title="Projects table"
          selected={projects}
          onClick={onProjects}
        >
          <Table2 />
        </IconButton>
        <IconButton
          label="Area markers"
          title="Area markers"
          selected={markers}
          onClick={onMarkers}
        >
          <MapPin />
        </IconButton>
        <IconButton
          label="Map layers"
          title="Map layers"
          aria-haspopup="menu"
          aria-expanded={Boolean(menu)}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenu(menu ? null : { x: rect.left - 172, y: rect.top });
          }}
        >
          <Layers />
        </IconButton>
        <IconButton
          label="Focus selected area"
          title="Focus selected area"
          disabled={!canFocus}
          onClick={onFocus}
        >
          <Focus />
        </IconButton>
      </div>
      {menu && (
        <ContextMenu
          {...menu}
          label="Map layers"
          entries={(["Severity", "Funding gap", "Freshness"] as const).map(
            (value) => ({
              label: value,
              icon: metric === value ? Check : undefined,
              action: () => onMetric(value),
            }),
          )}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}
