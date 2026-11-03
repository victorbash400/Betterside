import DataGrid from "../grid/DataGrid";
import type { DirectoryOrganization } from "../../lib/organizations";
import { organizationColumns } from "./organizationColumns";

export default function OrganizationList({
  organizations,
  selected,
  loading = false,
  onSelect,
}: {
  organizations: DirectoryOrganization[];
  selected?: string;
  loading?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <DataGrid
      label="Organization directory"
      emptyMessage="Adjust search or filters to view organizations."
      loading={loading}
      rowHeight={36}
      rows={organizations}
      columns={organizationColumns}
      selected={selected}
      onOpen={(organization) => onSelect(organization.id)}
    />
  );
}
