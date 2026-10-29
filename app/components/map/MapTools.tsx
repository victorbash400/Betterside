import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import {
  concerns,
  matchesConcern,
  type OverlaySettings,
} from "../../lib/concerns";
import type { MapItem } from "../../lib/types";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import IssueLayerToggle from "./IssueLayerToggle";
import LayerControlsDialog from "./LayerControlsDialog";
import styles from "./MapTools.module.css";
export default function MapTools({
  value,
  items,
  mapView,
  onChange,
}: {
  value: OverlaySettings;
  items: MapItem[];
  mapView: boolean;
  onChange: (value: OverlaySettings) => void;
}) {
  const narrow = useNarrowLayout();
  const [expanded, setExpanded] = useState<boolean>();
  const [settings, setSettings] = useState(false);
  const open = expanded ?? !narrow;
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
      <aside className={styles.rail} data-open={open} aria-label="Cause layers">
        <button
          className={styles.header}
          aria-expanded={open}
          aria-controls="issue-layer-list"
          onClick={() => setExpanded(!open)}
        >
          <span>Causes</span>
          <span>
            {value.concerns.length} / {concerns.length}
          </span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {open && (
          <>
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
                  onAreas={
                    value.mode === "Heatmap" &&
                    value.concerns.includes(concern.id) &&
                    (counts.get(concern.id) ?? 0) > 0 &&
                    !items.some(
                      (item) =>
                        matchesConcern(item, concern.id) &&
                        item.geographicPrecision === "Event location",
                    )
                      ? () =>
                          onChange({
                            ...value,
                            mode: "Areas",
                            concerns: value.concerns.includes(concern.id)
                              ? value.concerns
                              : [...value.concerns, concern.id],
                          })
                      : undefined
                  }
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
          </>
        )}
      </aside>
      {settings && (
        <LayerControlsDialog
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
