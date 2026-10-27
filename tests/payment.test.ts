import test from "node:test";
import assert from "node:assert/strict";
import { amountInCents, decimalAmount } from "../app/lib/payment.ts";
test("currency input converts to exact cents", () => {
  assert.equal(amountInCents("1.01"), 101);
  assert.equal(amountInCents("25"), 2500);
  assert.equal(amountInCents("10000.00"), 1000000);
  assert.equal(decimalAmount(101), "1.01");
});
test("rejects fractions, exponent notation, negatives and out-of-bounds amounts", () => {
  for (const input of [
    "0",
    "0.99",
    "10000.01",
    "-10",
    "1e3",
    "1.001",
    "Infinity",
    "NaN",
    " 25",
    "1.",
    "1..2",
    "1.2.3",
    "",
    ".25",
    "1,000",
  ])
    assert.throws(() => amountInCents(input), input);
});
