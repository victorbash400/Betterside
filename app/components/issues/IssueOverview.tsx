import { ArrowUpRight } from "lucide-react";
import TrackingButton from "../interests/TrackingButton";
import ProjectFunding from "./ProjectFunding";
import { concerns, matchesConcern } from "../../lib/concerns";
import { measurementLabels } from "../../lib/measurementLabels";
import { formatDate } from "../../lib/dates";
import { recordPrecision } from "../../lib/recordValues";
import type { MapItem } from "../../lib/types";
import styles from "./IssueDetails.module.css";

export default function IssueOverview({
  issue,
  onContribute,
  pinned,
  canPin,
  onTogglePin,
}: {
  issue: MapItem;
  onContribute: () => void;
  pinned: boolean;
  canPin: boolean;
  onTogglePin: () => void;
}) {
  const concern = concerns.find((entry) => matchesConcern(issue, entry.id));
  const facts = [
    { label: "Country", value: issue.country },
    ...(issue.measurements ?? []).map((measurement) => ({
      label: measurementLabels[measurement.metric],
      value: new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(
        measurement.value,
      ),
    })),
    ...(issue.eventStatus
      ? [{ label: "Status", value: issue.eventStatus }]
      : []),
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
          ...(issue.referencePeriod.end
            ? [
                {
                  label: "Reference through",
                  value: formatDate(issue.referencePeriod.end, "UTC"),
                },
              ]
            : []),
        ]
      : []),
    ...(issue.geographicPrecision
      ? [{ label: "Reporting geography", value: recordPrecision(issue) }]
      : []),
    ...(issue.sourceAlert
      ? [{ label: "Source alert", value: issue.sourceAlert }]
      : []),
  ];
  const sources = [issue.source, ...(issue.relatedSources ?? [])].filter(
    (source, index, all) =>
      all.findIndex((entry) => entry.url === source.url) === index,
  );
  return (
    <div className={styles.content}>
      <span className={styles.type}>{concern?.label ?? issue.kind}</span>
      {issue.summary && <p>{issue.summary}</p>}
      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.sources}>
        <TrackingButton
          pinned={pinned}
          disabled={!canPin}
          onToggle={onTogglePin}
        />
        {sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
          >
            {source.label}
            <ArrowUpRight size={13} />
          </a>
        ))}
      </div>
      {issue.project && (
        <ProjectFunding project={issue.project} onContribute={onContribute} />
      )}
    </div>
  );
}
