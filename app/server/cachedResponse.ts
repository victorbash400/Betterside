import "server-only";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
export function cachedResponse(
  request: Request,
  data: unknown,
  maxAgeSeconds: number,
) {
  const json = JSON.stringify(data);
  const acceptsGzip = (request.headers.get("accept-encoding") ?? "")
    .split(",")
    .some((part) => {
      const [encoding, ...parameters] = part.trim().split(";");
      return (
        encoding === "gzip" &&
        !parameters.some((parameter) => parameter.trim() === "q=0")
      );
    });
  const compressed = acceptsGzip && Buffer.byteLength(json) > 1024 * 1024;
  const body = compressed ? new Uint8Array(gzipSync(json)) : json;
  const etag = `"${createHash("sha256").update(body).digest("hex")}"`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, must-revalidate`,
    Vary: "Accept-Encoding",
    ETag: etag,
    ...(compressed ? { "Content-Encoding": "gzip" } : {}),
  };
  if (request.headers.get("if-none-match") === etag)
    return new Response(null, { status: 304, headers });
  return new Response(body, { headers });
}
