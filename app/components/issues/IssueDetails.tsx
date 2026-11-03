import SettingsInlineButton from "../settings/SettingsInlineButton";
import { useState } from "react";
import Dialog from "../controls/Dialog";
import DetailViews from "../controls/DetailViews";
import IssueOverview from "./IssueOverview";
import ResponseOrganizations from "./ResponseOrganizations";
import TrendPanel from "../trends/TrendPanel";
import { concerns, matchesConcern } from "../../lib/concerns";
import { trendDatasets } from "../../lib/trends";
import type { MapItem } from "../../lib/types";
import { samePinTarget } from "../../lib/pins";
import type { Interest, PinTarget } from "../../lib/tracking";
import styles from "./IssueDetails.module.css";
export default function IssueDetails({
  issue,
  onClose,
  onContribute,
  pinned,
  canPin,
  onTogglePin,
  onPinScope,
  pins,
}: {
  issue: MapItem;
  onClose: () => void;
  onContribute: () => void;
  pinned: boolean;
  canPin: boolean;
  onTogglePin: () => void;
  onPinScope: (name: string, target: PinTarget) => void;
  pins: Interest[];
}) {
  const [view, setView] = useState("Information");
  const concern = concerns.find((cause) => matchesConcern(issue, cause.id));
  const code = issue.reportingArea?.countryCode;
  const scope = code
    ? {
        countries: [code],
        concern: concern?.id,
        dataset: issue.dataset,
        recordId: issue.id,
      }
    : undefined;
  const target: PinTarget | undefined =
    code && concern
      ? {
          kind: "scope",
          countryCode: code,
          country: issue.country,
          concern: concern.id,
        }
      : undefined;
  const scopedPin =
    target && pins.some((pin) => samePinTarget(pin.target, target));
  const hasHistory = scope && trendDatasets(scope).length > 0;
  return (
    <Dialog
      title={issue.location}
      size={view === "Information" ? "profile" : "insights"}
      centered
      modal={false}
      onClose={onClose}
    >
      <DetailViews
        views={[
          "Information",
          ...(hasHistory ? ["Trends"] : []),
          ...(code ? ["Organizations"] : []),
        ]}
        value={view}
        onChange={setView}
      />
      {view === "Information" && (
        <IssueOverview
          issue={issue}
          pinned={pinned}
          canPin={canPin}
          onTogglePin={onTogglePin}
          onContribute={onContribute}
        />
      )}
      {view === "Trends" && scope && (
        <TrendPanel key={issue.id} scopes={[scope]} recordId={issue.id} />
      )}
      {view === "Organizations" && code && (
        <ResponseOrganizations
          embedded
          country={code}
          countryName={issue.country}
          concern={concern?.id ?? "all"}
        />
      )}
      {code && concern && (
        <div className={styles.sources}>
          <SettingsInlineButton
            disabled={!canPin || scopedPin}
            onClick={() =>
              onPinScope(`${concern.label} · ${issue.country}`, {
                kind: "scope",
                countryCode: code,
                country: issue.country,
                concern: concern.id,
              })
            }
          >
            {scopedPin ? "Pinned" : `Pin ${concern.label} · ${issue.country}`}
          </SettingsInlineButton>
        </div>
      )}
    </Dialog>
  );
}
