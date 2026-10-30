import "server-only";
import { tool } from "ai";
import { calculate } from "../lib/chatCalculation.ts";
import { calculationInputSchema } from "../lib/chatWorkspace.ts";
export const calculateTool = tool({
  description:
    "Compute deterministic arithmetic or split a USD budget into cent-exact shares. Operations divide/percentage take numerator and denominator. Split takes [amount, number of shares]. Do not sum overlapping humanitarian populations, sectors, time periods, host/origin populations or units. Financial totals are sandbox project values only.",
  inputSchema: calculationInputSchema,
  execute: async (input) => calculate(input),
});
