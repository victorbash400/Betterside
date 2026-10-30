import {
  ArrowLeft,
  PanelRightClose,
  PanelRightOpen,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import {
  organizationCauseTopics,
  type DirectoryOrganization,
} from "../../lib/organizations";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import IconButton from "../controls/IconButton";
import OrganizationCauseOptions from "./OrganizationCauseOptions";
import styles from "./OrganizationIssues.module.css";
export default function OrganizationIssues({
  organization,
  value,
  onChange,
  onClearOrganization,
  onSettings,
}: {
  organization?: DirectoryOrganization;
  value: string[];
  onChange: (topics: string[]) => void;
  onClearOrganization: () => void;
  onSettings: () => void;
}) {
  const narrow = useNarrowLayout();
  const [expanded, setExpanded] = useState<boolean>();
  const open = expanded ?? !narrow;
  const topics = organizationCauseTopics(organization);
  return (
    <aside
      className={styles.panel}
      data-open={open}
      aria-label={
        organization ? `Causes for ${organization.name}` : "Organization causes"
      }
    >
      <div className={styles.header}>
        {open && organization && (
          <IconButton
            label="All causes"
            title="Clear organization selection"
            onClick={onClearOrganization}
          >
            <ArrowLeft size={14} />
          </IconButton>
        )}
        {open && (
          <div className={styles.heading}>
            <span>Causes</span>
            <small>{topics.length}</small>
          </div>
        )}
        <IconButton
          label={open ? "Close causes" : "Open causes"}
          title={open ? "Close causes" : "Open causes"}
          aria-expanded={open}
          onClick={() => setExpanded(!open)}
        >
          {open ? <PanelRightClose /> : <PanelRightOpen />}
        </IconButton>
      </div>
      {open && (
        <>
          <OrganizationCauseOptions
            options={topics}
            value={value}
            onChange={onChange}
          />
          <button className={styles.settings} onClick={onSettings}>
            <SlidersHorizontal size={14} />
            Layer settings
          </button>
        </>
      )}
    </aside>
  );
}
