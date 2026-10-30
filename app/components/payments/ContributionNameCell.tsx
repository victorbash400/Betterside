import { Heart } from "lucide-react";
import type { CustomCellRendererProps } from "ag-grid-react";
import type { Contribution } from "../../lib/types";
import styles from "../collections/RecordNameCell.module.css";

export default function ContributionNameCell({
  data,
}: CustomCellRendererProps<Contribution>) {
  if (!data) return null;
  return (
    <span className={styles.name}>
      <Heart size={19} strokeWidth={1.7} />
      <span>
        {data.projectName}
        <small>Sandbox</small>
      </span>
    </span>
  );
}
