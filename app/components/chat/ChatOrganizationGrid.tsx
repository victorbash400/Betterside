import type { DirectoryOrganization } from "../../lib/organizations";
import DataGrid from "../grid/DataGrid";
import { organizationColumns } from "../organizations/organizationColumns";
import styles from "./ChatResult.module.css";
export default function ChatOrganizationGrid({
  organizations,
  total,
  nextOffset,
  onSelect,
  onMore,
  busy,
}: {
  organizations: DirectoryOrganization[];
  total: number;
  nextOffset: number | null;
  onSelect: (id: string) => void;
  onMore: () => void;
  busy: boolean;
}) {
  return (
    <div className={styles.result}>
      <div className={styles.heading}>
        <span>{total.toLocaleString("en")} matching organizations</span>
        {nextOffset !== null && (
          <button onClick={onMore} disabled={busy}>
            More results
          </button>
        )}
      </div>
      <div
        className={styles.grid}
        style={{
          height: Math.min(300, 82 + Math.max(1, organizations.length) * 34),
        }}
      >
        <DataGrid
          label="Chat organization results"
          rows={organizations}
          columns={organizationColumns}
          rowHeight={34}
          onOpen={(org) => onSelect(org.id)}
        />
      </div>
    </div>
  );
}
