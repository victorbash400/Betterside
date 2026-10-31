import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import IconButton from "../controls/IconButton";
import DataCardHeader from "../issues/DataCardHeader";
import ResponseOrganizations from "../issues/ResponseOrganizations";
import ConcernSummary from "./ConcernSummary";
import ConcernReportList from "./ConcernReportList";
import ConcernLocationMenu from "./ConcernLocationMenu";
import { concernIcons } from "./concernIcons";
import { concerns, type OverlaySettings } from "../../lib/concerns";
import type { OverlayPoint } from "../../lib/overlayData";
import type { MapItem } from "../../lib/types";
import styles from "../issues/DataCard.module.css";
export default function ConcernDetails({
  points,
  onSelect,
  onClose,
}: {
  points: OverlayPoint[];
  onSelect: (item: MapItem) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState("Overview");
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  const point = points[Math.min(selected, points.length - 1)];
  const concern = concerns.find((item) => item.id === point.concern)!;
  const country = point.records[0].reportingArea?.countryCode;
  const views = [
    "Overview",
    ...(country ? ["Organizations"] : []),
    `Reports (${point.records.length})`,
  ];
  return (
    <aside
      ref={root}
      className={styles.card}
      aria-label="Selected concern"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <DataCardHeader
        title={point.location}
        label={concern.label}
        Icon={concernIcons[point.concern]}
        value={
          point.value === null
            ? undefined
            : new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(
                point.value,
              )
        }
        unit={
          point.value === null
            ? "Reported location · impact unquantified"
            : point.records.every((record) => record.dataset === "ucdp")
              ? "Reported incidents"
              : concern.unit
        }
        action={
          <>
            {points.length > 1 && (
              <ConcernLocationMenu
                points={points}
                selected={point.id}
                onSelect={(id) => {
                  setSelected(points.findIndex((entry) => entry.id === id));
                  setView("Overview");
                }}
              />
            )}
            <IconButton label="Close concern" onClick={onClose}>
              <X />
            </IconButton>
          </>
        }
      />
      <div className={styles.tabs} role="group" aria-label="Concern views">
        {views.map((item) => (
          <button
            key={item}
            aria-pressed={view === item}
            onClick={() => setView(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className={styles.body} key={`${point.id}:${view}`}>
        {view === "Overview" ? (
          <ConcernSummary
            point={point}
            onOrganizations={
              country ? () => setView("Organizations") : undefined
            }
          />
        ) : view === "Organizations" && country ? (
          <ResponseOrganizations
            embedded
            country={country}
            countryName={point.records[0].country}
            concern={point.concern}
          />
        ) : (
          <ConcernReportList records={point.records} onSelect={onSelect} />
        )}
      </div>
    </aside>
  );
}
