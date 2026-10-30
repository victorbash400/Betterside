import MapViewControl from "../map/MapViewControl";
import type { MapViewSettings } from "../../lib/mapViews";
import OrganizationFilterFields from "./OrganizationFilterFields";
import OrganizationSourceList from "./OrganizationSourceList";
import { useState } from "react";
import { Database, SlidersHorizontal } from "lucide-react";
import OverlayModeControl from "../map/OverlayModeControl";
import DataSourcesControl from "../map/DataSourcesControl";
import OrganizationCauseControl from "./OrganizationCauseControl";
import type { OverlaySettings } from "../../lib/concerns";
import type { DatasetSelection, FeedStatus } from "../../lib/dataSources";
import CountryFilter from "../map/CountryFilter";
import ToolbarPopover from "../map/ToolbarPopover";
import {
  organizationCauseTopics,
  type OrganizationFilters,
  type OrganizationDirectory,
  type DirectoryOrganization,
} from "../../lib/organizations";
import toolbar from "../map/WorkspaceToolbar.module.css";
import styles from "./OrganizationToolbar.module.css";
export default function OrganizationToolbar({
  filters,
  onChange,
  countries,
  organizations,
  sources,
  mapView,
  onMapView,
  showMap,
  selected,
  overlay,
  onOverlay,
  datasets,
  onDatasets,
  crisisSources,
  crisisError,
  crisisBusy,
  onRefreshCrisis,
}: {
  filters: OrganizationFilters;
  onChange: (filters: OrganizationFilters) => void;
  countries: string[];
  organizations: DirectoryOrganization[];
  sources: OrganizationDirectory["sources"];
  mapView: MapViewSettings;
  onMapView: (value: MapViewSettings) => void;
  showMap: boolean;
  selected?: DirectoryOrganization;
  overlay: OverlaySettings;
  onOverlay: (value: OverlaySettings) => void;
  datasets: DatasetSelection;
  onDatasets: (value: DatasetSelection) => void;
  crisisSources: FeedStatus[];
  crisisError: string;
  crisisBusy: boolean;
  onRefreshCrisis: () => void;
}) {
  const [open, setOpen] = useState<{
    kind: "filters" | "sources";
    x: number;
    y: number;
  }>();
  function toggle(kind: "filters" | "sources", button: HTMLButtonElement) {
    const rect = button.getBoundingClientRect();
    setOpen(
      open?.kind === kind
        ? undefined
        : { kind, x: rect.left, y: rect.bottom + 6 },
    );
  }
  return (
    <div
      className={styles.bar}
      role="toolbar"
      aria-label="Organization filters"
    >
      {showMap && <OverlayModeControl value={overlay} onChange={onOverlay} />}
      <CountryFilter
        value={filters.country}
        countries={countries}
        onChange={(country) => onChange({ ...filters, country })}
      />
      <OrganizationCauseControl
        value={filters.topics}
        options={organizationCauseTopics(selected)}
        onChange={(topics) => onChange({ ...filters, topics })}
      />
      <div className={toolbar.group}>
        {showMap && (
          <MapViewControl
            value={mapView}
            onChange={onMapView}
            overlay={overlay}
            onOverlay={onOverlay}
          />
        )}
        <button
          className={toolbar.control}
          title="Organization filters"
          aria-label="Organization filters"
          aria-haspopup="dialog"
          aria-expanded={open?.kind === "filters"}
          onClick={(event) => toggle("filters", event.currentTarget)}
        >
          <SlidersHorizontal />
        </button>
        <button
          className={toolbar.control}
          title="Organization sources"
          aria-label="Organization sources"
          aria-haspopup="dialog"
          aria-expanded={open?.kind === "sources"}
          onClick={(event) => toggle("sources", event.currentTarget)}
        >
          <Database />
        </button>
      </div>
      {showMap && (
        <DataSourcesControl
          label="Crisis data"
          value={datasets}
          statuses={crisisSources}
          onChange={onDatasets}
          error={crisisError}
          busy={crisisBusy}
          onRefresh={onRefreshCrisis}
        />
      )}
      {open && (
        <ToolbarPopover
          x={open.x}
          y={open.y}
          label={
            open.kind === "sources"
              ? "Organization sources"
              : "Organization filters"
          }
          onClose={() => setOpen(undefined)}
        >
          {open.kind === "filters" ? (
            <OrganizationFilterFields
              filters={filters}
              onChange={onChange}
              organizations={organizations}
            />
          ) : (
            <OrganizationSourceList sources={sources} />
          )}
        </ToolbarPopover>
      )}
    </div>
  );
}
