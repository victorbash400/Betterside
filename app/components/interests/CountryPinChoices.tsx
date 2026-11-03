import type { pinCountries } from "../../lib/pins";
import type { InterestChoice } from "../../lib/interestCategories";
import type { Interest } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import CountryPinRow from "./CountryPinRow";

export default function CountryPinChoices({
  countries,
  search,
  interests,
  items,
  following,
  onCreate,
  onPinItem,
  initialCountry,
}: {
  countries: ReturnType<typeof pinCountries>;
  search: string;
  interests: Interest[];
  items: MapItem[];
  following: string[];
  onCreate: (choice: InterestChoice) => void;
  onPinItem?: (id: string) => void;
  initialCountry?: string;
}) {
  return countries
    .filter((country) => country.country.toLocaleLowerCase().includes(search))
    .toSorted(
      (a, b) => Number(b.countryCode === initialCountry) - Number(a.countryCode === initialCountry),
    )
    .map((country) => (
      <CountryPinRow
        key={country.countryCode}
        country={country}
        interests={interests}
        items={items}
        following={following}
        onCreate={onCreate}
        onPinItem={onPinItem}
        initialExpanded={country.countryCode === initialCountry}
      />
    ));
}
