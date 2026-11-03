import SettingsInlineButton from "../settings/SettingsInlineButton";
import { useState } from "react";
import Dialog from "../controls/Dialog";
import DetailViews from "../controls/DetailViews";
import TrendPanel from "../trends/TrendPanel";
import ResponseOrganizations from "./ResponseOrganizations";
import { concerns, type ConcernId } from "../../lib/concerns";
import { samePinTarget } from "../../lib/pins";
import type { Interest, PinTarget } from "../../lib/tracking";
import styles from "./IssueDetails.module.css";
export interface ScopeSelection {
  code: string;
  country: string;
  concern?: ConcernId;
}
export default function ScopeDetails({
  scope,
  onClose,
  onPin,
  canPin,
  pins,
}: {
  scope: ScopeSelection;
  pins: Interest[];
  onClose: () => void;
  onPin: (name: string, target: PinTarget) => void;
  canPin: boolean;
}) {
  const [view, setView] = useState("Trends");
  const cause = concerns.find((cause) => cause.id === scope.concern);
  const name = cause ? `${cause.label} · ${scope.country}` : scope.country;
  const target: PinTarget = cause
    ? {
        kind: "scope",
        country: scope.country,
        countryCode: scope.code,
        concern: cause.id,
      }
    : { kind: "country", country: scope.country, countryCode: scope.code };
  const saved = pins.some((pin) => samePinTarget(pin.target, target));
  return (
    <Dialog
      title={name}
      size="insights"
      centered
      modal={false}
      onClose={onClose}
    >
      <DetailViews
        views={["Trends", "Organizations"]}
        value={view}
        onChange={setView}
      />
      {view === "Trends" ? (
        <TrendPanel
          scopes={[{ countries: [scope.code], concern: scope.concern }]}
        />
      ) : (
        <ResponseOrganizations
          embedded
          country={scope.code}
          countryName={scope.country}
          concern={scope.concern ?? "all"}
        />
      )}
      <div className={styles.sources}>
        <SettingsInlineButton disabled={!canPin || saved} onClick={() => onPin(name, target)}>
          {saved ? "Pinned" : `Pin ${name}`}
        </SettingsInlineButton>
      </div>
    </Dialog>
  );
}
