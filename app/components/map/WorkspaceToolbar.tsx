import { Building2, ChartNoAxesCombined } from "lucide-react";
import OverlayModeControl from "./OverlayModeControl";
import CountryFilter from "./CountryFilter";
import DiscoveryFilterFields from "./DiscoveryFilterFields";
import ViewSettingsControl from "./ViewSettingsControl";
import MapViewFields from "./MapViewFields";
import DataSourceFields from "./DataSourceFields";
import type { OverlaySettings } from "../../lib/concerns";
import type { DiscoveryFilters as Filters } from "../../lib/discoveryFilters";
import type { MapViewSettings } from "../../lib/mapViews";
import type { DatasetSelection, FeedStatus } from "../../lib/dataSources";
import styles from "./WorkspaceToolbar.module.css";
export default function WorkspaceToolbar({
  overlay,
  onOverlay,
  filters,
  onFilters,
  countries,
  mapView,
  onMapView,
  showMap,
  showSources,
  datasets,
  onDatasets,
  sources,
  error,
  busy,
  onRefresh,
  onOrganizations,
  onTrends,
  onAdd,
}: {
  overlay: OverlaySettings;
  onOverlay: (value: OverlaySettings) => void;
  filters: Filters;
  onFilters: (value: Filters) => void;
  countries: string[];
  mapView: MapViewSettings;
  onMapView: (value: MapViewSettings) => void;
  showMap: boolean;
  showSources: boolean;
  datasets: DatasetSelection;
  onDatasets: (value: DatasetSelection) => void;
  sources: FeedStatus[];
  error: string;
  busy: boolean;
  onRefresh: () => void;
  onOrganizations?: () => void;
  onTrends?: () => void;
  onAdd?: () => void;
}) {
  return (
    <div className={styles.bar} role="toolbar" aria-label="Discovery toolbar">
      {showMap && <OverlayModeControl value={overlay} onChange={onOverlay} />}
      <CountryFilter
        countries={countries}
        value={filters.country}
        onChange={(country) => onFilters({ ...filters, country })}
      />
      <ViewSettingsControl
        sections={[
          {
            id: "filters",
            label: "Filters",
            content: (
              <DiscoveryFilterFields
                value={filters}
                onChange={onFilters}
                overlay={overlay}
                onOverlay={onOverlay}
              />
            ),
          },
          ...(showMap
            ? [
                {
                  id: "map",
                  label: "Map",
                  content: (
                    <MapViewFields
                      value={mapView}
                      onChange={onMapView}
                      overlay={overlay}
                      onOverlay={onOverlay}
                    />
                  ),
                },
              ]
            : []),
          ...(showSources
            ? [
                {
                  id: "sources",
                  label: "Sources",
                  content: (
                    <DataSourceFields
                      value={datasets}
                      statuses={sources}
                      onChange={onDatasets}
                      error={error}
                      busy={busy}
                      onRefresh={onRefresh}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />
      {onTrends && <button className={styles.control} onClick={onTrends} aria-label="Country trends"><ChartNoAxesCombined size={15}/></button>}
      {onOrganizations && (
        <button
          className={styles.control}
          aria-label="Country organizations"
          title="Organizations"
          onClick={onOrganizations}
        >
          <Building2 size={15} />
          <span className={styles.optional}>Organizations</span>
        </button>
      )}
      {onAdd && (
        <button className={styles.control} onClick={onAdd}>
          Add items
        </button>
      )}
    </div>
  );
}
