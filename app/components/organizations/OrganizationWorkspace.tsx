import { useState } from "react";
import dynamic from "next/dynamic";
import type { useOrganizations } from "../../state/useOrganizations";
import type { useMapGeography } from "../../state/useMapGeography";
import type { useOrganizationCrisisMap } from "../../state/useOrganizationCrisisMap";
import type { OverlaySettings } from "../../lib/concerns";
import LayerControlsDialog from "../map/LayerControlsDialog";
import OrganizationDetails from "./OrganizationDetails";
import OrganizationRail from "./OrganizationRail";
import OrganizationIssues from "./OrganizationIssues";
import styles from "./OrganizationWorkspace.module.css";
const OrganizationList = dynamic(() => import("./OrganizationList"), {
  ssr: false,
});
export default function OrganizationWorkspace({
  state,
  query,
  onQuery,
  mode,
  onMode,
  organizationsOpen,
  onCloseOrganizations,
  onCloseCauses,
  causesOpen,
  geography,
  crisis,
  onOverlay,
}: {
  state: ReturnType<typeof useOrganizations>;
  query: string;
  onQuery: (query: string) => void;
  mode: "map" | "list";
  onMode: (value: "map" | "list") => void;
  organizationsOpen: boolean;
  onCloseOrganizations: () => void;
  onCloseCauses: () => void;
  causesOpen: boolean;
  geography: ReturnType<typeof useMapGeography>;
  crisis: ReturnType<typeof useOrganizationCrisisMap>;
  onOverlay: (value: OverlaySettings) => void;
}) {
  const [details, setDetails] = useState<string>();
  const [settings, setSettings] = useState(false);
  function country(country: string) {
    state.select(undefined);
    state.update({ ...state.filters, country });
    onMode("map");
  }
  return (
    <div className={styles.workspace} data-map={mode === "map"}>
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
          <OrganizationRail
            open={organizationsOpen}
            onClose={onCloseOrganizations}
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
            open={causesOpen}
            onClose={onCloseCauses}
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
