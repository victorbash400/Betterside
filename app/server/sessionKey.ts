import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
const tokenSchema = z
  .string()
  .length(64)
  .refine((value) =>
    Array.from(value).every((char) => "0123456789abcdef".includes(char)),
  );
export function sessionKey(value: string | undefined) {
  if (!value) return null;
  const parts = value.split(".");
  if (
    parts.length !== 2 ||
    !z.guid().safeParse(parts[0]).success ||
    !tokenSchema.safeParse(parts[1]).success
  )
    return null;
  return {
    pk: `DONOR#${parts[0]}`,
    sk: `SESSION#${createHash("sha256").update(parts[1]).digest("hex")}`,
    owner: parts[0],
  };
}
export function newSessionKey(owner: string) {
  z.guid().parse(owner);
  const value = `${owner}.${randomBytes(32).toString("hex")}`;
  return { value, key: sessionKey(value)! };
}
