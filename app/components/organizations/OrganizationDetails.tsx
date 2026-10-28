import { ArrowUpRight } from "lucide-react";
import Dialog from "../controls/Dialog";
import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationDonate from "./OrganizationDonate";
import OrganizationProfile from "./OrganizationProfile";
import styles from "./OrganizationDetails.module.css";
export default function OrganizationDetails({
  organization,
  onClose,
  onCountry,
}: {
  organization: DirectoryOrganization;
  onClose: () => void;
  onCountry: (country: string) => void;
}) {
  return (
    <Dialog
      title={organization.name}
      size="profile"
      onClose={onClose}
      footer={
        <>
          {organization.website && (
            <a
              className={styles.website}
              href={organization.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              Website <ArrowUpRight size={13} />
            </a>
          )}
          <OrganizationDonate
            url={organization.donateUrl}
            name={organization.name}
            prominent
          />
        </>
      }
    >
      <OrganizationProfile
        organization={organization}
        onCountry={(country) => {
          onClose();
          onCountry(country);
        }}
      />
    </Dialog>
  );
}
