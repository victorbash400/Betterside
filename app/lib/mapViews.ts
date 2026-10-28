export type MapBasemap = "Atlas" | "Dark";
export interface MapViewSettings {
  basemap: MapBasemap;
  labels: boolean;
  boundaries: boolean;
}
export const defaultMapView: MapViewSettings = {
  basemap: "Atlas",
  labels: true,
  boundaries: true,
};
