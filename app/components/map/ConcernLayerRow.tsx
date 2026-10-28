import LayerSelect from "./LayerSelect";
import {
  concerns,
  concernColor,
  type ConcernId,
  type OverlaySettings,
} from "../../lib/concerns";
import type { OverlayPoint } from "../../lib/overlayData";
import { formatDate } from "../../lib/dates";
import styles from "./ConcernLayerRow.module.css";
export const layerPalette = [
  { value: "#cf554b", label: "Red" },
  { value: "#8d65ba", label: "Purple" },
  { value: "#d79b31", label: "Amber" },
  { value: "#409bb7", label: "Blue" },
  { value: "#528c73", label: "Green" },
  { value: "#a63c67", label: "Rose" },
];
export default function ConcernLayerRow({
  id,
  value,
  points,
  onChange,
}: {
  id: ConcernId;
  value: OverlaySettings;
  points: OverlayPoint[];
  onChange: (value: OverlaySettings) => void;
}) {
  const concern = concerns.find((item) => item.id === id)!,
    layer = points.filter((point) => point.concern === id);
  const maximum = Math.max(0, ...layer.map((point) => point.value ?? 0));
  const ends = layer
    .flatMap((point) => (point.period?.end ? [point.period.end] : []))
    .sort();
  const color = concernColor(id, value),
    options = layerPalette.some((item) => item.value === color)
      ? layerPalette
      : [{ value: color, label: "Default" }, ...layerPalette];
  return (
    <section className={styles.layer} aria-label={`${concern.label} layer`}>
      <div className={styles.controls}>
        <span>{concern.label}</span>
        <LayerSelect
          label={`${concern.label} color`}
          value={color}
          options={options}
          onChange={(next) =>
            onChange({ ...value, colors: { ...value.colors, [id]: next } })
          }
        />
      </div>
      <dl className={styles.values}>
        <dt>Measure</dt>
        <dd>
          {layer.some((point) => point.value !== null)
            ? concern.unit
            : "Reported locations · impact unquantified"}
        </dd>
        {maximum > 0 && (
          <>
            <dt>Range</dt>
            <dd>0 – {new Intl.NumberFormat("en").format(maximum)}</dd>
          </>
        )}
        {ends.at(-1) && (
          <>
            <dt>Reference ends</dt>
            <dd>{formatDate(ends.at(-1), "UTC")}</dd>
          </>
        )}
        {!layer.length && (
          <>
            <dt>Coverage</dt>
            <dd>Unavailable</dd>
          </>
        )}
      </dl>
    </section>
  );
}
