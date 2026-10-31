import { X } from "lucide-react";
import IconButton from "../controls/IconButton";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  concerns,
  matchesConcern,
  type OverlaySettings,
} from "../../lib/concerns";
import type { MapItem } from "../../lib/types";
import drawer from "./MapDrawer.module.css";
import type { MapGeography } from "../../lib/mapGeography";
import MapLayerGrid from "./MapLayerGrid";
import LayerControlsDialog from "./LayerControlsDialog";
import styles from "./MapTools.module.css";
export default function MapTools({
  open,
  onClose,
  geography,
  value,
  items,
  mapView,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
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
          <IconButton label="Close causes" onClick={onClose}>
            <X size={16} />
          </IconButton>
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
        <MapLayerGrid
          rows={concerns.map((concern) => ({
            id: concern.id,
            label: concern.label,
            count: counts.get(concern.id) ?? 0,
          }))}
          selected={value.concerns}
          onToggle={(id) =>
            onChange({
              ...value,
              concerns: value.concerns.includes(
                id as (typeof value.concerns)[number],
              )
                ? value.concerns.filter((entry) => entry !== id)
                : [...value.concerns, id as (typeof value.concerns)[number]],
            })
          }
        />
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
