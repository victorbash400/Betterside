import "server-only";
import { createHash } from "node:crypto";
export function cachedResponse(
  request: Request,
  data: unknown,
  maxAgeSeconds: number,
) {
  const body = JSON.stringify(data);
  const etag = `"${createHash("sha256").update(body).digest("hex")}"`;
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, must-revalidate`,
    ETag: etag,
  };
  if (request.headers.get("if-none-match") === etag)
    return new Response(null, { status: 304, headers });
  return new Response(body, { headers });
}
