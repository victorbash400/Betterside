import { useEffect, useState } from "react";
import { Building2, ChevronDown, ChevronUp } from "lucide-react";
import { organizationsResponseSchema } from "../../lib/responseOrganizations";
import type { z } from "zod";
import type { ConcernId } from "../../lib/concerns";
import OrganizationRow from "./OrganizationRow";
import styles from "./ResponseOrganizations.module.css";
type Result =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; data: z.infer<typeof organizationsResponseSchema> };
export default function ResponseOrganizations({
  country,
  concern,
  embedded = false,
  countryName,
}: {
  country: string;
  countryName?: string;
  embedded?: boolean;
  concern: ConcernId | "all";
}) {
  const [open, setOpen] = useState(embedded);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>({ state: "loading" });
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setResult({ state: "loading" });
    setPage(0);
    async function load() {
      try {
        const query = new URLSearchParams({ country, concern });
        const response = await fetch(`/api/organizations?${query}`, {
          signal: controller.signal,
        });
        const data: unknown = await response.json();
        if (!response.ok) {
          const message =
            data &&
            typeof data === "object" &&
            "error" in data &&
            typeof data.error === "string"
              ? data.error
              : "Organization lookup failed. Retry.";
          throw new Error(message);
        }
        if (!controller.signal.aborted)
          setResult({
            state: "ready",
            data: organizationsResponseSchema.parse(data),
          });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            state: "error",
            message:
              error instanceof Error
                ? error.message
                : "Organization lookup failed. Retry.",
          });
      }
    }
    void load();
    return () => controller.abort();
  }, [open, country, concern, attempt]);
  return (
    <section
      className={styles.organizations}
      aria-label="Response organizations"
    >
      {!embedded && (
        <button
          className={styles.toggle}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Building2 size={14} />
          Organizations
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}
      {open && (
        <div className={styles.content}>
          {result.state === "loading" && (
            <span role="status">Loading organizations</span>
          )}
          {result.state === "error" && (
            <div className={styles.error} role="alert">
              <span>{result.message}</span>
              <button onClick={() => setAttempt(attempt + 1)}>
                Retry organizations
              </button>
            </div>
          )}
          {result.state === "ready" && (
            <>
              <div className={styles.scope}>
                <strong>
                  {result.data.organizations.length} organizations
                </strong>
                <span>
                  {countryName || result.data.country} · {result.data.sector}
                </span>
                <span>Reported presence</span>
                {result.data.truncated && (
                  <span role="alert">Incomplete source pages</span>
                )}
              </div>
              <ul>
                {result.data.organizations
                  .slice(page * 10, (page + 1) * 10)
                  .map((organization) => (
                    <OrganizationRow
                      key={organization.id}
                      organization={organization}
                    />
                  ))}
              </ul>
              {result.data.organizations.length > 10 && (
                <div className={styles.pages}>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    {page + 1} /{" "}
                    {Math.ceil(result.data.organizations.length / 10)}
                  </span>
                  <button
                    disabled={
                      (page + 1) * 10 >= result.data.organizations.length
                    }
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
