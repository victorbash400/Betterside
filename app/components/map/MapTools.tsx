import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  concerns,
  matchesConcern,
  concernColor,
  type OverlaySettings,
} from "../../lib/concerns";
import type { MapItem } from "../../lib/types";
import drawer from "./MapDrawer.module.css";
import type { MapGeography } from "../../lib/mapGeography";
import IssueLayerToggle from "./IssueLayerToggle";
import LayerControlsDialog from "./LayerControlsDialog";
import styles from "./MapTools.module.css";
export default function MapTools({
  open,
  geography,
  value,
  items,
  mapView,
  onChange,
}: {
  open: boolean;
  geography: MapGeography;
  value: OverlaySettings;
  items: MapItem[];
  mapView: boolean;
  onChange: (value: OverlaySettings) => void;
}) {
  const [settings, setSettings] = useState(false);
  const counts = useMemo(
    () =>
      new Map(
        concerns.map((concern) => [
          concern.id,
          items.filter((item) => matchesConcern(item, concern.id)).length,
        ]),
      ),
    [items],
  );
  return (
    <>
      <aside
        id="map-causes-drawer"
        className={`${styles.rail} ${drawer.drawer}`}
        data-side="right"
        data-open={open}
        inert={!open}
        aria-hidden={!open}
        aria-label="Cause layers"
      >
        <div className={styles.header}>
          <span>Causes</span>
          <span>
            {value.concerns.length} / {concerns.length}
          </span>
        </div>
        <div className={styles.actions}>
          <button
            onClick={() =>
              onChange({
                ...value,
                concerns: concerns.map((concern) => concern.id),
              })
            }
          >
            Select all
          </button>
          <button onClick={() => onChange({ ...value, concerns: [] })}>
            Clear
          </button>
        </div>
        <div
          className={styles.list}
          id="issue-layer-list"
          role="group"
          aria-label="Problems"
        >
          {concerns.map((concern) => (
            <IssueLayerToggle
              key={concern.id}
              concern={concern}
              selected={value.concerns.includes(concern.id)}
              count={counts.get(concern.id) ?? 0}
              color={concernColor(concern.id, value)}
              onToggle={() =>
                onChange({
                  ...value,
                  concerns: value.concerns.includes(concern.id)
                    ? value.concerns.filter((id) => id !== concern.id)
                    : [...value.concerns, concern.id],
                })
              }
            />
          ))}
        </div>
        <button
          className={styles.settings}
          onClick={() => setSettings(true)}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal size={15} />
          Layer settings
        </button>
      </aside>
      {settings && (
        <LayerControlsDialog
          geography={geography}
          value={value}
          items={items}
          showAppearance={mapView}
          onChange={onChange}
          onClose={() => setSettings(false)}
        />
      )}
    </>
  );
}
