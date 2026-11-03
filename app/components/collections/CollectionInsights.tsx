import SettingsInlineButton from "../settings/SettingsInlineButton";
import { useMemo, useState, type ReactNode } from "react";
import DetailViews from "../controls/DetailViews";
import PinCountryScope from "../interests/PinCountryScope";
import TrendPanel from "../trends/TrendPanel";
import ResponseOrganizations from "../issues/ResponseOrganizations";
import { pinCountries, pinTrendScope, samePinTarget } from "../../lib/pins";
import { concerns } from "../../lib/concerns";
import type { Interest, PinTarget } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import styles from "./CollectionInsights.module.css";
export default function CollectionInsights({
  pin,
  pins,
  items,
  children,
  onPin,
  canPin,
  rightInset = 0,
}: {
  pin: Interest;
  pins: Interest[];
  rightInset?: number;
  items: MapItem[];
  children: ReactNode;
  onPin: (name: string, target: PinTarget) => void;
  canPin: boolean;
}) {
  const [view, setView] = useState("Records"),
    [countryCode, setCountryCode] = useState("");
  const countries = useMemo(() => pinCountries(items), [items]);
  const inferred = pinTrendScope(pin, items);
  const country = countries.find(
    (country) => country.countryCode === countryCode,
  );
  const cause =
    pin.target?.kind === "scope" || pin.target?.kind === "cause"
      ? pin.target.concern
      : undefined;
  const scope = country
    ? { countries: [country.countryCode], concern: cause }
    : inferred;
  const code = scope?.countries.length === 1 ? scope.countries[0] : undefined;
  const scopedCountry = countries.find(
    (country) => country.countryCode === code,
  );
  const target: PinTarget | undefined =
    scopedCountry && cause
      ? { kind: "scope", ...scopedCountry, concern: cause }
      : undefined;
  const saved = Boolean(
    target && pins.some((pin) => samePinTarget(pin.target, target)),
  );
  return (
    <div className={styles.exploration} style={{ marginRight: rightInset }}>
      <DetailViews
        views={["Records", "Trends", "Organizations"]}
        value={view}
        onChange={setView}
      />
      {view === "Records" ? (
        children
      ) : (
        <div className={styles.insights}>
          <div className={styles.controls}>
            <PinCountryScope
              countries={countries}
              value={code ?? countryCode}
              onChange={setCountryCode}
            />
            {scopedCountry && cause && (
              <SettingsInlineButton
                disabled={!canPin || saved}
                onClick={() =>
                  onPin(
                    `${concerns.find((item) => item.id === cause)!.label} · ${scopedCountry.country}`,
                    { kind: "scope", ...scopedCountry, concern: cause },
                  )
                }
              >
                {saved ? "Pinned" : "Pin scope"}
              </SettingsInlineButton>
            )}
          </div>
          {view === "Trends" && scope && (
            <TrendPanel key={JSON.stringify(scope)} scopes={[scope]} />
          )}
          {view === "Organizations" && code && (
            <ResponseOrganizations
              key={`${code}:${cause}`}
              embedded
              country={code}
              countryName={scopedCountry?.country}
              concern={cause ?? "all"}
            />
          )}
        </div>
      )}
    </div>
  );
}
