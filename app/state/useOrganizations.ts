import { useMemo, useState } from "react";
import {
  defaultOrganizationFilters,
  filterOrganizations,
  type OrganizationFilters,
} from "../lib/organizations";
import { useMapGeography } from "./useMapGeography";
import {
  fetchOrganizationDirectory,
  useOrganizationDirectory,
} from "./useOrganizationDirectory";
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
  function select(id?: string) {
    setSelected(id);
    const organization = organizations.find((org) => org.id === id);
    if (organization && filters.topics.length)
      setFilters({
        ...filters,
        topics: filters.topics.filter((topic) =>
          organization.topics.includes(topic),
        ),
      });
  }
  return {
    ...directory,
    focus: async (
      id: string,
      topics?: string[],
      pinnedCountryCode?: string,
    ) => {
      const result = await fetchOrganizationDirectory(pinnedCountryCode);
      const organization = result.value.organizations.find(
        (org) => org.id === id,
      );
      if (!organization)
        throw new Error("Organization unavailable. Search again.");
      if (topics?.some((topic) => !organization.topics.includes(topic)))
        throw new Error("Cause is not reported by this organization.");
      const country = pinnedCountryCode
        ? countries.find((country) => country.code === pinnedCountryCode)?.name
        : undefined;
      if (pinnedCountryCode && !country)
        throw new Error("Country unavailable. Refresh geography.");
      setFilters({
        ...defaultOrganizationFilters,
        country: country ?? "",
        topics: topics ?? organization.topics,
      });
      setRevision(0);
      setSelected(id);
      return organization;
    },
    filters,
    update,
    countries,
    visible,
    selected,
    select,
    organization: visible.find((org) => org.id === selected),
    refresh: () => setRevision((value) => value + 1),
    countryCode,
  };
}
