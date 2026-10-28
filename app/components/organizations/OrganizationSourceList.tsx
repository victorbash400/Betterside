import type { OrganizationDirectory } from "../../lib/organizations";
import styles from "./OrganizationSourceList.module.css";
export default function OrganizationSourceList({
  sources,
}: {
  sources: OrganizationDirectory["sources"];
}) {
  return (
    <div className={styles.sources}>
      {sources.map((source) => (
        <article key={source.id} data-state={source.state}>
          {source.url ? (
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.label}
            </a>
          ) : (
            <span className={styles.name}>{source.label}</span>
          )}
          <span>{source.count.toLocaleString("en")} organizations</span>
          <span>
            {source.state === "ready"
              ? "Available"
              : source.state === "partial"
                ? "Partial coverage"
                : source.state === "unconfigured"
                  ? "Setup required"
                  : "Unavailable"}
          </span>
          {source.message && <small>{source.message}</small>}
        </article>
      ))}
    </div>
  );
}
