import { useMemo, useState } from "react";
import { concerns } from "../../lib/concerns";
import { matchesCountry, samePinTarget, type pinCountries } from "../../lib/pins";
import type { InterestChoice } from "../../lib/interestCategories";
import type { Interest } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import PinBranchRow from "./PinBranchRow";
import CausePinBranch from "./CausePinBranch";
import OrganizationPinChoices from "./OrganizationPinChoices";

export default function CountryPinRow({
  country,
  interests,
  items,
  following,
  onCreate,
  onPinItem,
  initialExpanded = false,
}: {
  country: ReturnType<typeof pinCountries>[number];
  interests: Interest[];
  items: MapItem[];
  following: string[];
  onCreate: (choice: InterestChoice) => void;
  onPinItem?: (id: string) => void;
  initialExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [organizations, setOrganizations] = useState(false);
  const records = useMemo(
    () => expanded ? items.filter((item) => matchesCountry(item, country)) : [],
    [items, country, expanded],
  );
  const target = { kind: "country" as const, ...country };
  return (
    <PinBranchRow
      label={country.country}
      expanded={expanded}
      onToggle={setExpanded}
      saved={interests.some((pin) => samePinTarget(pin.target, target))}
      onPin={() => onCreate({ name: country.country, target })}
    >
      {concerns.map((cause) => (
        <CausePinBranch
          key={cause.id}
          cause={cause}
          country={country}
          items={records}
          following={following}
          interests={interests}
          onCreate={onCreate}
          onPinItem={onPinItem}
        />
      ))}
      <PinBranchRow
        label={`Organizations in ${country.country}`}
        expanded={organizations}
        onToggle={setOrganizations}
      >
        <OrganizationPinChoices
          query=""
          country={country.countryCode}
          countryName={country.country}
          interests={interests}
          onCreate={onCreate}
        />
      </PinBranchRow>
    </PinBranchRow>
  );
}
