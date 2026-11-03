import SettingsInlineButton from "../settings/SettingsInlineButton";
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
  pinned,
  canPin,
  onPin,
}: {
  organization: DirectoryOrganization;
  onClose: () => void;
  onCountry: (country: string) => void;
  pinned: boolean; canPin:boolean; onPin:()=>void;
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
      <SettingsInlineButton className={styles.pin} disabled={!canPin||pinned} onClick={onPin}>{pinned?"Pinned":"Pin organization"}</SettingsInlineButton>
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
