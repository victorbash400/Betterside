import {
  calculationInputSchema,
  type calculationResultSchema,
} from "./chatWorkspace.ts";
import type { z } from "zod";
export function calculate(
  input: z.infer<typeof calculationInputSchema>,
): z.infer<typeof calculationResultSchema> {
  const { operation, values } = calculationInputSchema.parse(input);
  let result: number;
  let shares: number[] | undefined;
  switch (operation) {
    case "sum":
      result = values.reduce((total, value) => total + value, 0);
      break;
    case "subtract":
      result = values
        .slice(1)
        .reduce((total, value) => total - value, values[0]);
      break;
    case "multiply":
      result = values.reduce((total, value) => total * value, 1);
      break;
    case "divide":
    case "percentage":
      if (values.length !== 2 || values[1] === 0)
        throw new Error("Provide two values and a nonzero divisor.");
      result = (values[0] / values[1]) * (operation === "percentage" ? 100 : 1);
      break;
    case "split": {
      const [amount, count] = values;
      if (
        values.length !== 2 ||
        !Number.isInteger(count) ||
        count < 1 ||
        count > 100 ||
        amount < 0 ||
        Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001
      )
        throw new Error("Split requires an amount in cents and 1–100 shares.");
      const cents = Math.round(amount * 100),
        base = Math.floor(cents / count),
        remainder = cents % count;
      shares = Array.from(
        { length: count },
        (_, index) => (base + (index < remainder ? 1 : 0)) / 100,
      );
      result = amount / count;
      break;
    }
  }
  if (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER)
    throw new Error("Calculation is outside the supported range.");
  return {
    ...input,
    kind: "calculation",
    result,
    ...(shares ? { shares } : {}),
  };
}
