import type { DatasetId } from "./dataSources.ts";
const minute = 60_000;
const hour = 60 * minute;
export const sourceTtl: Record<Exclude<DatasetId, "catalogue">, number> = {
  ucdp: 24 * hour,
  usgs: 5 * minute,
  gdacs: 15 * minute,
  eonet: 30 * minute,
  ifrc: hour,
  "hapi-needs": 6 * hour,
  "hapi-food": 6 * hour,
  "hapi-famine": 6 * hour,
  "hapi-idps": 6 * hour,
  "hapi-conflict": 6 * hour,
  "hapi-rainfall": 6 * hour,
  "hapi-funding": 6 * hour,
  "hapi-refugees": 24 * hour,
  "hapi-risk": 24 * hour,
};
export const cacheLifetimes = {
  failure: 2 * minute,
  metadata: 6 * hour,
  organizations: 12 * hour,
  geography: 7 * 24 * hour,
};
