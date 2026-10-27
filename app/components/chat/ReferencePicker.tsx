import { useState } from "react";
import { Search, Folder } from "lucide-react";
import Dialog from "../controls/Dialog";
import type { Issue } from "../../lib/types";
import styles from "./ReferencePicker.module.css";
export default function ReferencePicker({
  issues,
  onSelect,
  onClose,
}: {
  issues: Issue[];
  onSelect: (issue: Issue) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <Dialog title="Select" onClose={onClose}>
      <label className={styles.search}>
        <Search size={16} />
        <input
          autoFocus
          aria-label="Search projects"
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className={styles.items}>
        {issues
          .filter((issue) =>
            [issue.location, issue.project.name].some((value) =>
              value.toLowerCase().includes(query.toLowerCase()),
            ),
          )
          .map((issue) => (
            <button key={issue.id} onClick={() => onSelect(issue)}>
              <Folder size={18} />
              <span>
                {issue.location}
                <small>{issue.project.name}</small>
              </span>
            </button>
          ))}
      </div>
    </Dialog>
  );
}
