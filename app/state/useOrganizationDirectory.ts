import { useEffect, useState } from "react";
import {
  organizationDirectorySchema,
  type OrganizationDirectory,
} from "../lib/organizations";
import { createAsyncCache } from "../lib/asyncCache";
const cache = createAsyncCache<OrganizationDirectory>({
  maxEntries: 16,
  maxBytes: 32 * 1024 * 1024,
});
export function useOrganizationDirectory(
  enabled: boolean,
  country?: string,
  revision = 0,
) {
  const [data, setData] = useState<OrganizationDirectory>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setBusy(true);
    setError("");
    setData(undefined);
    const parameters = new URLSearchParams();
    if (country) parameters.set("country", country);
    if (revision > 0) parameters.set("refresh", "1");
    const path = `/api/organization-directory?${parameters}`;
    void cache
      .get(
        path,
        async () => {
          const response = await fetch(path);
          const raw = await response.json();
          if (!response.ok)
            throw new Error(raw.error ?? "Organization catalogue unavailable.");
          return organizationDirectorySchema.parse(raw);
        },
        { ttlMs: 60000, errorTtlMs: 0 },
      )
      .then((result) => {
        if (active) setData(result.value);
      })
      .catch((failure) => {
        if (active)
          setError(
            failure instanceof Error
              ? failure.message
              : "Organization catalogue unavailable.",
          );
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, country, revision]);
  return { data, error, busy };
}
