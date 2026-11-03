import { useEffect, useRef, useState } from "react";
import {
  organizationDirectorySchema,
  type OrganizationDirectory,
} from "../lib/organizations";
import { createAsyncCache } from "../lib/asyncCache";
import { cacheLifetimes } from "../lib/feedCachePolicy";
const cache = createAsyncCache<OrganizationDirectory>({
  maxEntries: 32,
  maxBytes: 32 * 1024 * 1024,
});
function directoryPath(country?: string) {
  const parameters = new URLSearchParams();
  if (country) parameters.set("country", country);
  return `/api/organization-directory?${parameters}`;
}
export async function fetchOrganizationDirectory(country?: string, refresh = false) {
  const path = directoryPath(country);
  if (refresh) cache.invalidate(path);
  return cache.get(
    path,
    async () => {
      const response = await fetch(refresh ? `${path}&refresh=1` : path, {
        cache: refresh ? "reload" : "default",
      });
      const raw = await response.json();
      if (!response.ok)
        throw new Error(raw.error ?? "Organization catalogue unavailable.");
      return organizationDirectorySchema.parse(raw);
    },
    {
      ttlMs: (value) => value.sources.some((source) => source.state === "error" || source.state === "partial")
        ? cacheLifetimes.failure : cacheLifetimes.organizations,
      errorTtlMs: cacheLifetimes.failure,
    },
  );
}
export function useOrganizationDirectory(enabled: boolean, country?: string, revision = 0) {
  const key = directoryPath(country);
  const cached = cache.peek(key)?.value;
  const previousRevision = useRef(revision);
  const [state, setState] = useState<{
    key: string;
    data?: OrganizationDirectory;
    error: string;
    busy: boolean;
  }>(() => ({ key, data: cached, error: "", busy: enabled && !cached }));
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const refresh = revision > previousRevision.current;
    previousRevision.current = revision;
    const saved = cache.peek(key)?.value;
    if (saved && !refresh) {
      setState({ key, data: saved, error: "", busy: false });
      return;
    }
    setState({ key, data: saved, error: "", busy: !saved });
    void fetchOrganizationDirectory(country, refresh)
      .then((result) => {
        if (active) setState({ key, data: result.value, error: "", busy: false });
      })
      .catch((failure) => {
        if (active) setState({ key, data: saved, busy: false,
          error: failure instanceof Error ? failure.message : "Organization catalogue unavailable." });
      });
    return () => { active = false; };
  }, [enabled, country, key, revision]);
  return state.key === key ? state : { data: cached, error: "", busy: enabled && !cached };
}
