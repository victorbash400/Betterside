export function amountInCents(value: string): number {
  const parts = value.split(".");
  if (
    parts.length > 2 ||
    parts[0].length === 0 ||
    parts[0].length > 5 ||
    parts[1]?.length > 2
  )
    throw new Error("Enter an amount from $1 to $10,000.");
  if (
    !parts.every(
      (part) =>
        part.length > 0 &&
        Array.from(part).every(
          (character) => character >= "0" && character <= "9",
        ),
    )
  )
    throw new Error("Enter a valid amount.");
  const cents =
    Number(parts[0]) * 100 + Number((parts[1] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 100 || cents > 1000000)
    throw new Error("Enter an amount from $1 to $10,000.");
  return cents;
}
export function decimalAmount(cents: number) {
  return (cents / 100).toFixed(2);
}
