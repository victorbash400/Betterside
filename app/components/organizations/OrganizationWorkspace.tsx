import { useState } from "react";
import dynamic from "next/dynamic";
import type { useOrganizations } from "../../state/useOrganizations";
import type { MapViewSettings } from "../../lib/mapViews";
import type { useMapGeography } from "../../state/useMapGeography";
import type { useOrganizationCrisisMap } from "../../state/useOrganizationCrisisMap";
import type { OverlaySettings } from "../../lib/concerns";
import type { MapItem } from "../../lib/types";
import LayerControlsDialog from "../map/LayerControlsDialog";
import OrganizationDetails from "./OrganizationDetails";
import OrganizationRail from "./OrganizationRail";
import OrganizationIssues from "./OrganizationIssues";
import styles from "./OrganizationWorkspace.module.css";
const OrganizationList = dynamic(() => import("./OrganizationList"), {
  ssr: false,
});
const OrganizationMap = dynamic(() => import("../map/GlobeCanvas"), {
  ssr: false,
});
export default function OrganizationWorkspace({
  state,
  query,
  onQuery,
  mode,
  onMode,
  projection,
  onProjection,
  mapView,
  geography,
  crisis,
  onOverlay,
  selectedRecord,
  onSelectRecord,
}: {
  state: ReturnType<typeof useOrganizations>;
  query: string;
  onQuery: (query: string) => void;
  mode: "map" | "list";
  onMode: (value: "map" | "list") => void;
  projection: "globe" | "mercator";
  onProjection: (value: "globe" | "mercator") => void;
  mapView: MapViewSettings;
  geography: ReturnType<typeof useMapGeography>;
  crisis: ReturnType<typeof useOrganizationCrisisMap>;
  onOverlay: (value: OverlaySettings) => void;
  selectedRecord?: MapItem;
  onSelectRecord: (item: MapItem) => void;
}) {
  const [details, setDetails] = useState<string>();
  const [settings, setSettings] = useState(false);
  function country(country: string) {
    state.select(undefined);
    state.update({ ...state.filters, country });
    onMode("map");
  }
  return (
    <div className={styles.workspace}>
      {mode === "list" ? (
        <OrganizationList
          organizations={state.visible}
          selected={state.selected}
          onSelect={(id) => {
            state.select(id);
            setDetails(id);
          }}
        />
      ) : (
        <>
          <OrganizationMap
            geography={geography}
            issues={crisis.items}
            points={crisis.points}
            overlay={crisis.overlay}
            focusAreas={crisis.focusAreas}
            focusRequest={0}
            selected={selectedRecord}
            onSelect={onSelectRecord}
            country={state.organization ? "" : state.filters.country}
            countryCode={state.organization ? undefined : state.countryCode}
            projection={projection}
            onProjection={onProjection}
            mapViewSettings={mapView}
          />
          <OrganizationRail
            query={query}
            onQuery={onQuery}
            organizations={state.visible}
            selected={state.selected}
            onSelect={(id) => {
              state.select(state.selected === id ? undefined : id);
              setDetails(undefined);
            }}
            onDetails={(id) => {
              state.select(id);
              setDetails(id);
            }}
          />
          <OrganizationIssues
            organization={state.organization}
            value={state.filters.topics}
            onChange={(topics) => state.update({ ...state.filters, topics })}
            onSettings={() => setSettings(true)}
            onClearOrganization={() => {
              state.select(undefined);
              setDetails(undefined);
            }}
          />
        </>
      )}
      {mode === "map" && crisis.error && (
        <div className={styles.error} role="alert">
          {crisis.error}
        </div>
      )}
      {settings && (
        <LayerControlsDialog
          geography={geography.areas}
          value={crisis.overlay}
          items={crisis.items}
          onChange={onOverlay}
          onClose={() => setSettings(false)}
          showAppearance={mode === "map"}
        />
      )}
      {state.busy && (
        <span className={styles.status} role="status">
          Loading organizations
        </span>
      )}
      {state.error && (
        <div className={styles.error} role="alert">
          {state.error}
          <button onClick={state.refresh}>Retry</button>
        </div>
      )}
      {state.organization && details === state.selected && (
        <OrganizationDetails
          key={state.organization.id}
          organization={state.organization}
          onClose={() => setDetails(undefined)}
          onCountry={country}
        />
      )}
    </div>
  );
}
