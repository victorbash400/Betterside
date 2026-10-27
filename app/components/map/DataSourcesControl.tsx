import { useState } from "react";
import { Database, Check, ChevronDown, RefreshCw } from "lucide-react";
import ContextMenu from "../controls/ContextMenu";
import IconButton from "../controls/IconButton";
import styles from "./DataSourcesControl.module.css";
export default function DataSourcesControl({
  value,
  onChange,
  error,
  busy,
  onRefresh,
}: {
  value: { catalogue: boolean; eonet: boolean };
  onChange: (value: { catalogue: boolean; eonet: boolean }) => void;
  error: string;
  busy: boolean;
  onRefresh: () => void;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <div className={styles.sources}>
      <button
        className={styles.control}
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setMenu({ x: rect.left, y: rect.bottom + 6 });
        }}
      >
        <Database size={16} />
        Data
        <ChevronDown size={13} />
      </button>
      {error && (
        <span role="alert">
          {error}
          <IconButton
            label="Retry data source"
            onClick={onRefresh}
            disabled={busy}
          >
            <RefreshCw />
          </IconButton>
        </span>
      )}
      {menu && (
        <ContextMenu
          {...menu}
          label="Data sources"
          onClose={() => setMenu(null)}
          entries={[
            {
              label: "Sourced sandbox projects",
              icon: value.catalogue ? Check : undefined,
              action: () => onChange({ ...value, catalogue: !value.catalogue }),
            },
            {
              label: "NASA EONET",
              icon: value.eonet ? Check : undefined,
              action: () => onChange({ ...value, eonet: !value.eonet }),
            },
          ]}
        />
      )}
    </div>
  );
}
