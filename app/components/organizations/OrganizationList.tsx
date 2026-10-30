import DataGrid from "../grid/DataGrid";
import type { DirectoryOrganization } from "../../lib/organizations";
import { organizationColumns } from "./organizationColumns";

export default function OrganizationList({
  organizations,
  selected,
  onSelect,
}: {
  organizations: DirectoryOrganization[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <DataGrid
      label="Organization directory"
      rowHeight={36}
      rows={organizations}
      columns={organizationColumns}
      selected={selected}
      onOpen={(organization) => onSelect(organization.id)}
    />
  );
}
