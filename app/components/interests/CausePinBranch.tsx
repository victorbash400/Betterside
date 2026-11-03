import { useMemo, useState } from "react";
import { matchesConcern, type ConcernId } from "../../lib/concerns";
import { samePinTarget, type pinCountries } from "../../lib/pins";
import type { InterestChoice } from "../../lib/interestCategories";
import type { Interest } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import PinChoiceRow from "./PinChoiceRow";
import PinBranchRow from "./PinBranchRow";
import ProblemPinChoices from "./ProblemPinChoices";

export default function CausePinBranch({
  cause,
  country,
  interests,
  items,
  following,
  onCreate,
  onPinItem,
}: {
  cause: { id: ConcernId; label: string };
  country: ReturnType<typeof pinCountries>[number];
  interests: Interest[];
  items: MapItem[];
  following: string[];
  onCreate: (choice: InterestChoice) => void;
  onPinItem?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const target = { kind: "scope" as const, ...country, concern: cause.id };
  const records = useMemo(
    () => items.filter((item) => matchesConcern(item, cause.id)),
    [items, cause.id],
  );
  const saved = interests.some((pin) => samePinTarget(pin.target, target));
  const label = `${cause.label} in ${country.country}`;
  function pin() {
    onCreate({ name: `${cause.label} · ${country.country}`, target });
  }
  if (!onPinItem || !records.length) {
    return <PinChoiceRow kind="cause" label={label} saved={saved} onChoose={pin} />;
  }
  return (
    <PinBranchRow
      label={label}
      expanded={expanded}
      onToggle={setExpanded}
      saved={saved}
      onPin={pin}
    >
      <ProblemPinChoices
        items={records}
        country={country}
        search=""
        following={following}
        onPin={onPinItem}
      />
    </PinBranchRow>
  );
}
