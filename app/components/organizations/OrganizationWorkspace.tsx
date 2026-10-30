import { useState } from "react";
import dynamic from "next/dynamic";
import type { useOrganizations } from "../../state/useOrganizations";
import type { MapViewSettings } from "../../lib/mapViews";
import OrganizationDetails from "./OrganizationDetails";
import OrganizationRail from "./OrganizationRail";
import OrganizationIssues from "./OrganizationIssues";
import styles from "./OrganizationWorkspace.module.css";
const OrganizationList = dynamic(() => import("./OrganizationList"), {
  ssr: false,
});
const OrganizationMap = dynamic(() => import("./OrganizationMap"), {
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
}: {
  state: ReturnType<typeof useOrganizations>;
  query: string;
  onQuery: (query: string) => void;
  mode: "map" | "list";
  onMode: (value: "map" | "list") => void;
  projection: "globe" | "mercator";
  onProjection: (value: "globe" | "mercator") => void;
  mapView: MapViewSettings;
}) {
  const [details, setDetails] = useState<string>();
  function country(country: string) {
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
            organizations={state.visible}
            selected={state.organization}
            country={state.countryCode}
            projection={projection}
            onProjection={onProjection}
            mapView={mapView}
            onCountry={country}
          />
          <OrganizationRail
            query={query}
            onQuery={onQuery}
            organizations={state.visible}
            selected={state.selected}
            onSelect={(id) => {
              state.select(id);
              setDetails(undefined);
            }}
            onDetails={(id) => {
              state.select(id);
              setDetails(id);
            }}
          />
          <OrganizationIssues
            organization={state.organization}
            value={state.filters.topic}
            onChange={(topic) => state.update({ ...state.filters, topic })}
          />
        </>
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
