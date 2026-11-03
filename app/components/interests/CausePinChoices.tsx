import { concerns } from "../../lib/concerns";
import { samePinTarget, type pinCountries } from "../../lib/pins";
import type { InterestChoice } from "../../lib/interestCategories";
import type { Interest, PinTarget } from "../../lib/tracking";
import PinChoiceRow from "./PinChoiceRow";
export default function CausePinChoices({
  country,
  search,
  interests,
  onCreate,
}: {
  country?: ReturnType<typeof pinCountries>[number];
  search: string;
  interests: Interest[];
  onCreate: (choice: InterestChoice) => void;
}) {
  return (
    <>
      {concerns
        .filter((cause) => cause.label.toLocaleLowerCase().includes(search))
        .map((cause) => {
          const target: PinTarget = country
            ? { kind: "scope", ...country, concern: cause.id }
            : { kind: "cause", concern: cause.id };
          return (
            <PinChoiceRow
              key={cause.id}
              kind="cause"
              label={country ? `${cause.label} in ${country.country}` : cause.label}
              saved={interests.some((pin) => samePinTarget(pin.target, target))}
              onChoose={() =>
                onCreate({
                  name: country
                    ? `${cause.label} · ${country.country}`
                    : cause.label,
                  target,
                })
              }
            />
          );
        })}
    </>
  );
}
