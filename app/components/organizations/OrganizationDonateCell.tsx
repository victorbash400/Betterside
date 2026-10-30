import type { CustomCellRendererProps } from "ag-grid-react";
import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationDonate from "./OrganizationDonate";

export default function OrganizationDonateCell({
  data,
}: CustomCellRendererProps<DirectoryOrganization>) {
  return data ? (
    <OrganizationDonate url={data.donateUrl} name={data.name} />
  ) : null;
}
