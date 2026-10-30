import type { CustomCellRendererProps } from "ag-grid-react";
import { Info } from "lucide-react";
import IconButton from "../controls/IconButton";
import type { DirectoryOrganization } from "../../lib/organizations";
export default function OrganizationMapInfoCell({
  data,
  onDetails,
}: CustomCellRendererProps<DirectoryOrganization> & {
  onDetails: (id: string) => void;
}) {
  return data ? (
    <IconButton
      label={`Details for ${data.name}`}
      onClick={() => onDetails(data.id)}
    >
      <Info size={14} />
    </IconButton>
  ) : null;
}
