import { Building2, X } from "lucide-react";
import IconButton from "../controls/IconButton";
import DataCardHeader from "./DataCardHeader";
import ResponseOrganizations from "./ResponseOrganizations";
import styles from "./DataCard.module.css";
export default function CountryOrganizations({
  code,
  country,
  onClose,
}: {
  code: string;
  country: string;
  onClose: () => void;
}) {
  return (
    <aside className={styles.card} aria-label="Country organizations">
      <DataCardHeader
        title={country}
        label="Organizations"
        Icon={Building2}
        action={
          <IconButton label="Close organizations" onClick={onClose}>
            <X />
          </IconButton>
        }
      />
      <div className={styles.body}>
        <ResponseOrganizations
          embedded
          country={code}
          countryName={country}
          concern="all"
        />
      </div>
    </aside>
  );
}
