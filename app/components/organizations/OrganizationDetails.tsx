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
      centered
      modal={false}
      onClose={onClose}
      footer={
        organization.website || organization.donateUrl ? (
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
            {organization.donateUrl && (
              <OrganizationDonate
                url={organization.donateUrl}
                name={organization.name}
                prominent
              />
            )}
          </>
        ) : undefined
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
