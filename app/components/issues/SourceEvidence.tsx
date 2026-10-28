import { ArrowUpRight, ChevronDown, FileText } from "lucide-react";
import type { Source } from "../../lib/types";
import styles from "./SourceEvidence.module.css";
export default function SourceEvidence({
  source,
  label = "Source",
}: {
  source: Source;
  label?: string;
}) {
  return (
    <details className={styles.evidence}>
      <summary>
        <FileText size={14} />
        {label}
        <ChevronDown size={13} />
      </summary>
      <a href={source.url} target="_blank" rel="noreferrer">
        {source.label}
        <ArrowUpRight size={13} />
      </a>
    </details>
  );
}
