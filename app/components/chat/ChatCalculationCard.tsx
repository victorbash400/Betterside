import type { z } from "zod";
import type { calculationResultSchema } from "../../lib/chatWorkspace";
import ChatTable from "./ChatTable";
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
        <ChatTable label="Budget allocations">
          <thead>
            <tr>
              <th scope="col">Allocation</th>
              <th scope="col" style={{ textAlign: "right" }}>
                Amount{calculation.unit ? ` · ${calculation.unit}` : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {calculation.shares.map((value, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td style={{ textAlign: "right" }}>{format(value)}</td>
              </tr>
            ))}
          </tbody>
        </ChatTable>
      ) : (
        <span className={styles.muted}>
          {calculation.values.map(format).join(" · ")}
        </span>
      )}
    </section>
  );
}
