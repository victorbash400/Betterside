import { useMemo, useState } from "react";
import {
  defaultOrganizationFilters,
  filterOrganizations,
  type OrganizationFilters,
} from "../lib/organizations";
import { useMapGeography } from "./useMapGeography";
import { useOrganizationDirectory } from "./useOrganizationDirectory";
export function useOrganizations(enabled: boolean, query: string) {
  const [filters, setFilters] = useState(defaultOrganizationFilters);
  const [selected, setSelected] = useState<string>();
  const [revision, setRevision] = useState(0);
  const geography = useMapGeography();
  const countries = useMemo(
    () =>
      Object.entries(geography.areas)
        .filter(([code]) => code.length === 3)
        .map(([code, area]) => ({ code, name: area.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [geography.areas],
  );
  const countryCode = countries.find(
    (country) => country.name === filters.country,
  )?.code;
  const directory = useOrganizationDirectory(enabled, countryCode, revision);
  const organizations = useMemo(
    () =>
      directory.data?.organizations.map((org) => ({
        ...org,
        presence: org.presence.map((area) => ({
          ...area,
          country: geography.areas[area.countryCode]?.name ?? area.country,
        })),
      })) ?? [],
    [directory.data, geography.areas],
  );
  const visible = useMemo(
    () => filterOrganizations(organizations, { ...filters, query }),
    [organizations, filters, query],
  );
  const update = (next: OrganizationFilters) => {
    if (next.country !== filters.country) {
      setRevision(0);
      setSelected(undefined);
    }
    setFilters(next);
    if (
      !filterOrganizations(organizations, { ...next, query }).some(
        (org) => org.id === selected,
      )
    )
      setSelected(undefined);
  };
  return {
    ...directory,
    filters,
    update,
    countries,
    visible,
    selected,
    select: setSelected,
    organization: visible.find((org) => org.id === selected),
    refresh: () => setRevision((value) => value + 1),
    countryCode,
  };
}
