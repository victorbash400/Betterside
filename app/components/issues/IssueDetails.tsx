import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  Bookmark,
  X,
  MessageCircle,
} from "lucide-react";
import IconButton from "../controls/IconButton";
import ProjectFunding from "./ProjectFunding";
import { freshness } from "../../lib/catalogue";
import type { Issue } from "../../lib/types";
import styles from "./IssueDetails.module.css";
export default function IssueDetails({
  issue,
  followed,
  onFollow,
  onClose,
  onContribute,
  onAsk,
}: {
  issue: Issue;
  followed: boolean;
  onFollow: () => void;
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
        <span>{issue.kind}</span>
        <IconButton label="Close area details" onClick={onClose}>
          <X />
        </IconButton>
      </div>
      <div className={styles.content}>
        <h2>{issue.location}</h2>
        <div className={styles.status}>{issue.severity}</div>
        <p className={styles.summary}>{issue.summary}</p>
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
          <button aria-pressed={followed} onClick={onFollow}>
            <Bookmark size={14} fill={followed ? "currentColor" : "none"} />
            {followed ? "Following" : "Follow"}
          </button>
          <button onClick={onAsk}>
            <MessageCircle size={14} />
            Ask about this area
          </button>
        </div>
        <ProjectFunding project={issue.project} onContribute={onContribute} />
      </div>
    </aside>
  );
}
