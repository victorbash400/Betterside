import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import Dialog from "../controls/Dialog";
import SettingsGroup from "../settings/SettingsGroup";
import PinFilterMenu, { type PinType } from "./PinFilterMenu";
import PinCountryScope from "./PinCountryScope";
import OrganizationPinChoices from "./OrganizationPinChoices";
import CountryPinChoices from "./CountryPinChoices";
import CausePinChoices from "./CausePinChoices";
import ProblemPinChoices from "./ProblemPinChoices";
import { pinCountries } from "../../lib/pins";
import type { InterestChoice } from "../../lib/interestCategories";
import type { Interest } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import styles from "./NewInterestDialog.module.css";

export default function NewInterestDialog({
  onCreate,
  onClose,
  interests = [],
  items = [],
  following = [],
  onPinItem,
  initialCountry = "",
}: {
  onCreate: (choice: InterestChoice) => void;
  onClose: () => void;
  interests?: Interest[];
  items?: MapItem[];
  following?: string[];
  onPinItem?: (id: string) => void;
  initialCountry?: string;
}) {
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    searchInput.current?.focus();
  }, []);
  const [countryCode, setCountryCode] = useState(initialCountry);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<PinType>("Countries");
  const search = query.trim().toLocaleLowerCase();
  const countries = useMemo(() => pinCountries(items), [items]);
  const country = countries.find((item) => item.countryCode === countryCode);
  return (
    <Dialog title="Pin" onClose={onClose} animated>
      <div className={styles.picker}>
        <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={16} />
          <input
            ref={searchInput}
            aria-label="Search pins"
            placeholder="Search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </label>
        <PinFilterMenu value={kind} onChange={setKind}/>
        </div>
        {kind !== "Countries" && (
          <PinCountryScope countries={countries} value={countryCode} onChange={(code) => {setCountryCode(code); setQuery("");}}/>
        )}
        <div
          className={styles.list}
          role="region"
          aria-label={kind}
          tabIndex={0}
        >
          <SettingsGroup>
          {kind === "Countries" && (
            <CountryPinChoices
              countries={countries}
              search={search}
              interests={interests}
              onCreate={onCreate}
              items={items}
              following={following}
              onPinItem={onPinItem}
              initialCountry={initialCountry}
            />
          )}
          {kind === "Causes" && (
            <CausePinChoices
              country={country}
              search={search}
              interests={interests}
              onCreate={onCreate}
            />
          )}
          {kind === "Problems" && onPinItem && (
            <ProblemPinChoices
              key={`${countryCode}:${search}`}
              items={items}
              country={country}
              search={search}
              following={following}
              onPin={onPinItem}
            />
          )}
          {kind === "Organizations" && (
            <OrganizationPinChoices
              query={query}
              country={countryCode}
              countryName={country?.country}
              interests={interests}
              onCreate={onCreate}
            />
          )}
          </SettingsGroup>
        </div>
      </div>
    </Dialog>
  );
}
