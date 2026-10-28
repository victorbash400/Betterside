import MapViewControl from "../map/MapViewControl";
import type { MapViewSettings } from "../../lib/mapViews";
import OrganizationFilterFields from "./OrganizationFilterFields";
import OrganizationSourceList from "./OrganizationSourceList";
import { useState } from "react";
import { Database, SlidersHorizontal } from "lucide-react";
import SettingsPicker from "../settings/SettingsPicker";
import CountryFilter from "../map/CountryFilter";
import ToolbarPopover from "../map/ToolbarPopover";
import {
  organizationTopics,
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
}: {
  filters: OrganizationFilters;
  onChange: (filters: OrganizationFilters) => void;
  countries: string[];
  organizations: DirectoryOrganization[];
  sources: OrganizationDirectory["sources"];
  mapView: MapViewSettings;
  onMapView: (value: MapViewSettings) => void;
  showMap: boolean;
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
      <CountryFilter
        value={filters.country}
        countries={countries}
        onChange={(country) => onChange({ ...filters, country })}
      />
      <SettingsPicker
        label="Organization focus"
        value={filters.topic}
        options={[
          { value: "", label: "All causes" },
          ...organizationTopics.map((value) => ({ value, label: value })),
        ]}
        onChange={(topic) => onChange({ ...filters, topic })}
        width={165}
      />
      <div className={toolbar.group}>
        {showMap && <MapViewControl value={mapView} onChange={onMapView} />}
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
