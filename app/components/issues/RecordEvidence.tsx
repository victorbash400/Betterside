import type { MapItem } from "../../lib/types";
import { formatDate } from "../../lib/dates";
import { measurementLabels } from "../../lib/measurementLabels";
import CardFacts from "./CardFacts";
import styles from "./RecordEvidence.module.css";
export default function RecordEvidence({ issue }: { issue: MapItem }) {
  return (
    <div className={styles.evidence}>
      <CardFacts
        entries={[
          ...(issue.measurements ?? []).map((measurement) => ({
            label: measurementLabels[measurement.metric],
            value: new Intl.NumberFormat("en", {
              maximumFractionDigits: 1,
            }).format(measurement.value),
          })),
          { label: "Assessment", value: issue.severity },
          ...(issue.recordType
            ? [{ label: "Record", value: issue.recordType }]
            : []),
          ...(issue.geographicPrecision
            ? [{ label: "Map position", value: issue.geographicPrecision }]
            : []),
          ...(issue.sourceAlert
            ? [{ label: "Source alert", value: issue.sourceAlert }]
            : []),
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
      {issue.relatedSources?.map((source) => (
        <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
          {source.label}
        </a>
      ))}
    </div>
  );
}
