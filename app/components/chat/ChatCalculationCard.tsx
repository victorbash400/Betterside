import type { z } from "zod";
import type { calculationResultSchema } from "../../lib/chatWorkspace";
import styles from "./ChatResult.module.css";
export default function ChatCalculationCard({
  calculation,
}: {
  calculation: z.infer<typeof calculationResultSchema>;
}) {
  const format = (value: number) =>
    new Intl.NumberFormat("en", {
      maximumFractionDigits: calculation.unit === "USD" ? 2 : 6,
    }).format(value);
  return (
    <section className={styles.result} aria-label="Calculation result">
      <div className={styles.heading}>
        <span>
          {
            {
              sum: "Sum",
              subtract: "Difference",
              multiply: "Product",
              divide: "Quotient",
              percentage: "Percentage",
              split: "Budget split",
            }[calculation.operation]
          }
        </span>
        <strong>
          {format(
            calculation.shares ? calculation.values[0] : calculation.result,
          )}{" "}
          {calculation.unit}
          {calculation.operation === "percentage" ? "%" : ""}
        </strong>
      </div>
      {calculation.shares ? (
        <ol className={styles.shares}>
          {calculation.shares.map((value, index) => (
            <li key={index}>
              {format(value)} {calculation.unit}
            </li>
          ))}
        </ol>
      ) : (
        <span className={styles.muted}>
          {calculation.values.map(format).join(" · ")}
        </span>
      )}
    </section>
  );
}
