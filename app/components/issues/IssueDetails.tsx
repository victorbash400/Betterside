import type { InterestChoice } from "../../lib/interestCategories";
import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  X,
  MessageCircle,
} from "lucide-react";
import TrackingButton from "../interests/TrackingButton";
import type { Interest } from "../../state/useTracking";
import IconButton from "../controls/IconButton";
import ProjectFunding from "./ProjectFunding";
import { freshness } from "../../lib/catalogue";
import type { MapItem as Issue } from "../../lib/types";
import styles from "./IssueDetails.module.css";
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
  const [expanded, setExpanded] = useState(false);
  return (
    <aside
      className={styles.details}
      data-expanded={expanded}
      aria-label={`${issue.location} details`}
    >
      <button
        className={styles.handle}
        aria-label={expanded ? "Collapse area details" : "Expand area details"}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
      </button>
      <div className={styles.header}>
        <span>
          {issue.kind}
          {issue.eventStatus ? ` · ${issue.eventStatus}` : ""}
        </span>
        <IconButton label="Close area details" onClick={onClose}>
          <X />
        </IconButton>
      </div>
      <div className={styles.content}>
        <h2>{issue.location}</h2>
        <div className={styles.status}>{issue.severity}</div>
        {issue.summary && <p className={styles.summary}>{issue.summary}</p>}
        <a
          className={styles.source}
          href={issue.source.url}
          target="_blank"
          rel="noreferrer"
        >
          {issue.source.label}
          <ArrowUpRight size={13} />
        </a>
        <span className={styles.date}>{freshness(issue.source)}</span>
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
            Ask about this area
          </button>
        </div>
        {issue.project && (
          <ProjectFunding project={issue.project} onContribute={onContribute} />
        )}
      </div>
    </aside>
  );
}
