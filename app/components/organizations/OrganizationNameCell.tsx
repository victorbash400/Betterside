import type { CustomCellRendererProps } from "ag-grid-react";
import type { DirectoryOrganization } from "../../lib/organizations";
import styles from "../collections/RecordNameCell.module.css";

export default function OrganizationNameCell({
  data,
}: CustomCellRendererProps<DirectoryOrganization>) {
  if (!data) return null;
  return (
    <span className={styles.name}>
      <span>
        {data.name}
        <small>
          {data.acronym && data.acronym !== data.name
            ? data.acronym
            : data.type}
        </small>
      </span>
    </span>
  );
}
