import type { InterestChoice } from "../../lib/interestCategories";
import { useState } from "react";
import { ArrowUpRight, X, MessageCircle } from "lucide-react";
import TrackingButton from "../interests/TrackingButton";
import type { Interest } from "../../state/useTracking";
import IconButton from "../controls/IconButton";
import ProjectFunding from "./ProjectFunding";
import RecordEvidence from "./RecordEvidence";
import ResponseOrganizations from "./ResponseOrganizations";
import { concerns, matchesConcern } from "../../lib/concerns";
import DataCardHeader from "./DataCardHeader";
import CardFacts from "./CardFacts";
import SourceEvidence from "./SourceEvidence";
import { concernIcons } from "../map/concernIcons";
import { FileText } from "lucide-react";
import { measurementLabels } from "../../lib/measurementLabels";
import { formatDate } from "../../lib/dates";
import type { MapItem as Issue } from "../../lib/types";
import styles from "./DataCard.module.css";
export default function IssueDetails({
  issue,
  followed,
  interests,
  trackingReady,
  onTrack,
  onUntrack,
  onCreateInterest,
  onClose,
  onContribute,
  onAsk,
}: {
  issue: Issue;
  followed: boolean;
  interests: Interest[];
  trackingReady: boolean;
  onTrack: (interestId?: string) => void;
  onUntrack: () => void;
  onCreateInterest: (choice: InterestChoice) => void;
  onClose: () => void;
  onContribute: () => void;
  onAsk: () => void;
}) {
  const [view, setView] = useState("Overview");
  const concern = concerns.find((entry) => matchesConcern(issue, entry.id));
  const measurement = issue.measurements?.[0];
  const country = issue.reportingArea?.countryCode;
  const views = [
    "Overview",
    ...(concern && country ? ["Organizations"] : []),
    "Evidence",
  ];
  return (
    <aside className={styles.card} aria-label={`${issue.location} details`}>
      <DataCardHeader
        title={issue.country || issue.location}
        label={concern?.label ?? issue.kind}
        Icon={concern ? concernIcons[concern.id] : FileText}
        value={
          measurement
            ? new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(
                measurement.value,
              )
            : undefined
        }
        unit={
          measurement
            ? measurementLabels[measurement.metric]
            : issue.eventStatus
        }
        action={
          <IconButton label="Close area details" onClick={onClose}>
            <X />
          </IconButton>
        }
      />
      <div className={styles.tabs} role="group" aria-label="Report views">
        {views.map((item) => (
          <button
            key={item}
            aria-pressed={view === item}
            onClick={() => setView(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className={styles.body}>
        {view === "Organizations" && concern && country ? (
          <ResponseOrganizations
            key={issue.id}
            embedded
            country={country}
            countryName={issue.country}
            concern={concern.id}
          />
        ) : view === "Evidence" ? (
          <>
            {issue.summary && <p className={styles.summary}>{issue.summary}</p>}
            <RecordEvidence issue={issue} />
            <SourceEvidence source={issue.source} />
          </>
        ) : (
          <>
            <CardFacts
              entries={[
                { label: "Location", value: issue.location },
                {
                  label: "Source updated",
                  value: formatDate(issue.source.published, "UTC"),
                },
                ...(issue.referencePeriod
                  ? [
                      {
                        label: "Reference from",
                        value: formatDate(issue.referencePeriod.start, "UTC"),
                      },
                      {
                        label: "Reference through",
                        value: issue.referencePeriod.end
                          ? formatDate(issue.referencePeriod.end, "UTC")
                          : "Not reported",
                      },
                    ]
                  : []),
              ]}
            />
            <div className={styles.actions}>
              <TrackingButton
                disabled={!trackingReady}
                issueId={issue.id}
                followed={followed}
                interests={interests}
                onTrack={onTrack}
                onUntrack={onUntrack}
                onCreate={onCreateInterest}
              />
              <button onClick={onAsk}>
                <MessageCircle size={14} />
                Ask
              </button>
            </div>
            {concern && country && (
              <button
                className={styles.primary}
                onClick={() => setView("Organizations")}
              >
                Organizations
                <ArrowUpRight size={14} />
              </button>
            )}
            {issue.project && (
              <ProjectFunding
                project={issue.project}
                onContribute={onContribute}
              />
            )}
          </>
        )}
      </div>
    </aside>
  );
}
