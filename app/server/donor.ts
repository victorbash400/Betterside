import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
export async function donorSession(create = false) {
  const jar = await cookies();
  let id = jar.get("betterside-donor")?.value;
  if (!id && create) {
    id = randomUUID();
    jar.set("betterside-donor", id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }
  return id;
}
