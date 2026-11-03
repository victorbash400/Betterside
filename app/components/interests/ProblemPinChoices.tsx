import { useMemo, useState } from "react";
import { matchesCountry, type pinCountries } from "../../lib/pins";
import type { MapItem } from "../../lib/types";
import PinChoiceRow from "./PinChoiceRow";
import styles from "./NewInterestDialog.module.css";
export default function ProblemPinChoices({
  items,
  country,
  search,
  following,
  onPin,
}: {
  items: MapItem[];
  country?: ReturnType<typeof pinCountries>[number];
  search: string;
  following: string[];
  onPin: (id: string) => void;
}) {
  const [limit, setLimit] = useState(80);
  const records = useMemo(
    () =>
      items.filter(
        (item) =>
          (!country || matchesCountry(item, country)) &&
          [
            item.location,
            item.country,
            item.kind,
            item.summary,
            item.project?.name,
          ].some((value) => value?.toLocaleLowerCase().includes(search)),
      ),
    [items, country, search],
  );
  return (
    <>
      {records.slice(0, limit).map((item) => (
        <PinChoiceRow
          key={item.id}
          kind="record"
          label={item.project?.name ?? item.location}
          detail={`${item.country} · ${item.kind} · ${item.source.label}`}
          saved={following.includes(item.id)}
          onChoose={() => onPin(item.id)}
        />
      ))}
      {records.length > limit && (
        <button className={styles.more} onClick={() => setLimit(limit + 80)}>
          Show more
        </button>
      )}
    </>
  );
}
