import { concerns, matchesConcern } from "./concerns.ts";
import { trendDatasets, type TrendScope } from "./trends.ts";
import type { PinTarget, Interest } from "./tracking.ts";
import type { MapItem } from "./types.ts";

export function matchesPin(item: MapItem, pin: Interest) {
  if (pin.target?.kind === "organization") return false;
  if (pin.target?.kind === "scope")
    return (
      matchesCountry(item, pin.target) &&
      matchesConcern(item, pin.target.concern)
    );
  if (pin.target?.kind === "country") {
    return item.reportingArea
      ? item.reportingArea.countryCode === pin.target.countryCode
      : item.country === pin.target.country;
  }
  if (pin.target?.kind === "cause")
    return matchesConcern(item, pin.target.concern);
  return pin.issueIds.includes(item.id);
}

export function pinCountries(items: MapItem[]) {
  const countries = new Map<string, { country: string; countryCode: string }>();
  for (const item of items) {
    if (
      item.reportingArea &&
      item.country &&
      !countries.has(item.reportingArea.countryCode)
    )
      countries.set(item.reportingArea.countryCode, {
        country: item.country,
        countryCode: item.reportingArea.countryCode,
      });
  }
  return [...countries.values()].sort((a, b) =>
    a.country.localeCompare(b.country),
  );
}

export function matchesCountry(
  item: MapItem,
  country: { countryCode: string; country: string },
) {
  return item.reportingArea
    ? item.reportingArea.countryCode === country.countryCode
    : item.country === country.country;
}
export function samePinTarget(
  a: PinTarget | undefined,
  b: PinTarget | undefined,
): boolean {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === "organization" && b.kind === "organization")
    return (
      a.organizationId === b.organizationId && a.countryCode === b.countryCode
    );
  if (a.kind === "cause" && b.kind === "cause") return a.concern === b.concern;
  if (a.kind === "country" && b.kind === "country")
    return a.countryCode === b.countryCode;
  return (
    a.kind === "scope" &&
    b.kind === "scope" &&
    a.countryCode === b.countryCode &&
    a.concern === b.concern
  );
}
export function pinTrendScope(
  pin: Interest,
  items: MapItem[],
): TrendScope | undefined {
  if (pin.target?.kind === "country")
    return { countries: [pin.target.countryCode] };
  if (pin.target?.kind === "scope")
    return { countries: [pin.target.countryCode], concern: pin.target.concern };
  if (!pin.target && pin.issueIds.length === 1) {
    const record = items.find((item) => item.id === pin.issueIds[0]);
    if (!record?.reportingArea) return undefined;
    const concern = concerns.find((cause) =>
      matchesConcern(record, cause.id),
    )?.id;
    return {
      countries: [record.reportingArea.countryCode],
      dataset: record.dataset,
      concern,
      recordId: record.id,
    };
  }
  const codes = [
    ...new Set(
      items
        .filter((item) => matchesPin(item, pin))
        .flatMap((item) =>
          item.reportingArea ? [item.reportingArea.countryCode] : [],
        ),
    ),
  ];
  if (!codes.length || codes.length > 4) return undefined;
  return {
    countries: codes,
    concern: pin.target?.kind === "cause" ? pin.target.concern : undefined,
  };
}

export function comparablePins(pins: Interest[], items: MapItem[]) {
  return pins.flatMap((pin) => {
    const scope = pinTrendScope(pin, items);
    return scope && trendDatasets(scope).length ? [{ pin, scope }] : [];
  });
}
