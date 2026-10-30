import MapViewFields from "../map/MapViewFields";
import ViewSettingsControl from "../map/ViewSettingsControl";
import type { MapViewSettings } from "../../lib/mapViews";
import OrganizationFilterFields from "./OrganizationFilterFields";
import OrganizationSourceList from "./OrganizationSourceList";
import OverlayModeControl from "../map/OverlayModeControl";
import DataSourceFields from "../map/DataSourceFields";
import OrganizationCauseControl from "./OrganizationCauseControl";
import type { OverlaySettings } from "../../lib/concerns";
import type { DatasetSelection, FeedStatus } from "../../lib/dataSources";
import CountryFilter from "../map/CountryFilter";
import {
  organizationCauseTopics,
  type OrganizationFilters,
  type OrganizationDirectory,
  type DirectoryOrganization,
} from "../../lib/organizations";
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
      <ViewSettingsControl
        sections={[
          {
            id: "filters",
            label: "Filters",
            content: (
              <OrganizationFilterFields
                filters={filters}
                onChange={onChange}
                organizations={organizations}
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
          {
            id: "sources",
            label: "Sources",
            content: (
              <>
                <OrganizationSourceList sources={sources} />
                {showMap && (
                  <DataSourceFields
                    value={datasets}
                    statuses={crisisSources}
                    onChange={onDatasets}
                    error={crisisError}
                    busy={crisisBusy}
                    onRefresh={onRefreshCrisis}
                  />
                )}
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
