import { Search, X } from "lucide-react";
import styles from "./OrganizationSearch.module.css";
export default function OrganizationSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.search}>
      <Search size={14} aria-hidden="true" />
      <input
        type="search"
        aria-label="Search organization list"
        placeholder="Search organizations"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          aria-label="Clear organization search"
          onClick={() => onChange("")}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
