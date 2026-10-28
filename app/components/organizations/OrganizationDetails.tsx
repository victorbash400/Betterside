import OrganizationOverview from "./OrganizationOverview";
import OrganizationEvidence from "./OrganizationEvidence";
import { useState, useRef, useEffect } from "react";
import { X, ArrowUpRight } from "lucide-react";
import IconButton from "../controls/IconButton";
import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationDonate from "./OrganizationDonate";
import OrganizationLocations from "./OrganizationLocations";
import card from "../issues/DataCard.module.css";
import styles from "./OrganizationDetails.module.css";
export default function OrganizationDetails({
  organization,
  onClose,
  onCountry,
  map = false,
}: {
  organization: DirectoryOrganization;
  map?: boolean;
  onClose: () => void;
  onCountry: (country: string) => void;
}) {
  const [view, setView] = useState("Overview");
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <aside
      ref={root}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
      className={`${card.card} ${map ? styles.card : ""}`}
      aria-label={`${organization.name} details`}
    >
      <header className={styles.header}>
        <span>
          <h2>{organization.name}</h2>
          {organization.type && <small>{organization.type}</small>}
        </span>
        <IconButton label="Close organization" onClick={onClose}>
          <X />
        </IconButton>
      </header>
      <div className={styles.donate}>
        <OrganizationDonate
          url={organization.donateUrl}
          name={organization.name}
        />
        {organization.website && (
          <a
            href={organization.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Website
            <ArrowUpRight size={13} />
          </a>
        )}
      </div>
      <div className={card.tabs} role="group" aria-label="Organization views">
        {["Overview", "Where they work", "Evidence"].map((name) => (
          <button
            key={name}
            disabled={
              name === "Where they work" && organization.presence.length === 0
            }
            title={
              name === "Where they work" && organization.presence.length === 0
                ? "Operating areas not reported"
                : undefined
            }
            aria-pressed={view === name}
            onClick={() => setView(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className={card.body}>
        {view === "Overview" && (
          <OrganizationOverview organization={organization} />
        )}
        {view === "Where they work" && (
          <OrganizationLocations
            organization={organization}
            onCountry={onCountry}
          />
        )}
        {view === "Evidence" && (
          <OrganizationEvidence organization={organization} />
        )}
      </div>
    </aside>
  );
}
