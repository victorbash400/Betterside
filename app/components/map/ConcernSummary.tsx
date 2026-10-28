import { ArrowRight } from "lucide-react";
import CardFacts from "../issues/CardFacts";
import SourceEvidence from "../issues/SourceEvidence";
import type { OverlayPoint } from "../../lib/overlayData";
import { formatDate } from "../../lib/dates";
import styles from "../issues/DataCard.module.css";
export default function ConcernSummary({
  point,
  onOrganizations,
}: {
  point: OverlayPoint;
  onOrganizations?: () => void;
}) {
  const source = point.records[0].source;
  const entries = [
    ...(point.period
      ? [
          {
            label: "Reference period",
            value: `${formatDate(point.period.start, "UTC")}${point.period.end ? ` – ${formatDate(point.period.end, "UTC")}` : ""}`,
          },
        ]
      : []),
    { label: "Source updated", value: formatDate(source.published, "UTC") },
    {
      label: "Map position",
      value:
        point.precision ??
        point.records[0].geographicPrecision ??
        "Reported location",
    },
    {
      label: "Coverage",
      value: `${point.records.length} ${point.records.some((item) => item.reportingArea?.adminLevel === 2) ? (point.records.length === 1 ? "reporting district" : "reporting districts") : point.records.length === 1 ? "report" : "reports"}`,
    },
    ...(point.period?.end &&
    Date.parse(point.period.end) > Date.now() &&
    point.concern === "war"
      ? [{ label: "Period status", value: "In progress" }]
      : []),
  ];
  return (
    <>
      <CardFacts entries={entries} />
      {onOrganizations && (
        <button className={styles.primary} onClick={onOrganizations}>
          Organizations
          <ArrowRight size={15} />
        </button>
      )}
      <SourceEvidence source={source} />
      {point.area && (
        <SourceEvidence
          label="Map boundaries"
          source={{
            label: point.area.source,
            url: point.area.url,
            published: null,
            reviewed: "",
          }}
        />
      )}
    </>
  );
}
