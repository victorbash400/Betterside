import SettingsInlineButton from "../settings/SettingsInlineButton";
import { useOrganizationDirectory } from "../../state/useOrganizationDirectory";
import { samePinTarget } from "../../lib/pins";
import type { Interest } from "../../lib/tracking";
import type { InterestChoice } from "../../lib/interestCategories";
import LoadingRegion from "../controls/LoadingRegion";
import PinChoiceRow from "./PinChoiceRow";
import styles from "./NewInterestDialog.module.css";
import { useState } from "react";
export default function OrganizationPinChoices({
  query,
  country,
  countryName,
  interests,
  onCreate,
}: {
  query: string;
  country: string;
  countryName?: string;
  interests: Interest[];
  onCreate: (choice: InterestChoice) => void;
}) {
  const [revision, setRevision] = useState(0);
  const [limit, setLimit] = useState(100);
  const directory = useOrganizationDirectory(
    true,
    country || undefined,
    revision,
  );
  if (directory.busy)
    return <LoadingRegion compact label="Loading organizations" />;
  if (directory.error)
    return (
      <div role="alert">
        {directory.error}
        <SettingsInlineButton onClick={() => setRevision(revision + 1)}>Retry</SettingsInlineButton>
      </div>
    );
  const search = query.trim().toLocaleLowerCase();
  const options =
    directory.data?.organizations.filter(
      (org) =>
        (!country ||
          org.presence.some((area) => area.countryCode === country)) &&
        (org.name.toLocaleLowerCase().includes(search) ||
          org.acronym.toLocaleLowerCase().includes(search)),
    ) ?? [];
  return (
    <>
      {options.slice(0, limit).map((org) => {
        const target = {
          kind: "organization" as const,
          organizationId: org.id,
          ...(country && countryName
            ? { countryCode: country, country: countryName }
            : {}),
        };
        return (
          <PinChoiceRow
            key={org.id}
            kind="organization"
            label={org.name}
            detail={org.acronym || undefined}
            saved={interests.some((pin) => samePinTarget(pin.target, target))}
            onChoose={() =>
              onCreate({
                name: countryName ? `${org.name} · ${countryName}` : org.name,
                target,
              })
            }
          />
        );
      })}
      {options.length > limit && (
        <button className={styles.more} onClick={() => setLimit(limit + 100)}>
          Show more
        </button>
      )}
    </>
  );
}
