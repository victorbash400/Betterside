import type { ICellRendererParams } from "ag-grid-enterprise";
import type { Issue } from "../../lib/types";
import styles from "./ProjectCell.module.css";
export default function ProjectCell({
  value,
  issues,
  onSelect,
}: {
  value: ICellRendererParams["value"];
  issues: Issue[];
  onSelect: (issue: Issue) => void;
}) {
  const issue = issues.find((issue) => issue.location === value);
  if (!issue) return <span>{String(value ?? "")}</span>;
  return (
    <button
      type="button"
      className={styles.link}
      aria-label={`Open ${issue.location} details`}
      onClick={() => onSelect(issue)}
    >
      {issue.location}
    </button>
  );
}
