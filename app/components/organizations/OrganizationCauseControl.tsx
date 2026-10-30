import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ToolbarPopover from "../map/ToolbarPopover";
import OrganizationCauseOptions from "./OrganizationCauseOptions";
import styles from "../map/WorkspaceToolbar.module.css";

export default function OrganizationCauseControl({
  value,
  options,
  onChange,
}: {
  value: string[];
  options: string[];
  onChange: (topics: string[]) => void;
}) {
  const [open, setOpen] = useState<{ x: number; y: number }>();
  return (
    <>
      <button
        className={styles.control}
        aria-label="Organization causes"
        aria-haspopup="dialog"
        aria-expanded={Boolean(open)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setOpen(open ? undefined : { x: rect.left, y: rect.bottom + 6 });
        }}
      >
        {value.length === 1
          ? value[0]
          : value.length
            ? `${value.length} causes`
            : "Causes"}
        <ChevronDown size={12} />
      </button>
      {open && (
        <ToolbarPopover
          {...open}
          label="Organization causes"
          onClose={() => setOpen(undefined)}
        >
          <div className={styles.causeActions}>
            <button
              className={styles.reset}
              onClick={() => onChange([...options])}
            >
              Select all
            </button>
            <button className={styles.reset} onClick={() => onChange([])}>
              Clear
            </button>
          </div>
          <OrganizationCauseOptions
            options={options}
            value={value}
            onChange={onChange}
          />
        </ToolbarPopover>
      )}
    </>
  );
}
