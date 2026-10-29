import test from "node:test";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { cachedResponse } from "../app/server/cachedResponse.ts";
test("large feed responses compress losslessly and keep encoding-specific conditional caching", async () => {
  const data = {
    records: Array.from({ length: 30000 }, (_, id) => ({
      id,
      source: "https://example.org/report",
      location: "Reported location",
    })),
  };
  const compressed = cachedResponse(
    new Request("http://localhost/api/events", {
      headers: { "Accept-Encoding": "gzip, deflate, br" },
    }),
    data,
    60,
  );
  assert.equal(compressed.headers.get("Content-Encoding"), "gzip");
  assert.equal(compressed.headers.get("Vary"), "Accept-Encoding");
  const bytes = new Uint8Array(await compressed.arrayBuffer());
  assert.ok(bytes.byteLength < 200000);
  assert.deepEqual(JSON.parse(gunzipSync(bytes).toString()), data);
  const etag = compressed.headers.get("etag")!;
  const conditional = cachedResponse(
    new Request("http://localhost/api/events", {
      headers: { "Accept-Encoding": "gzip", "If-None-Match": etag },
    }),
    data,
    60,
  );
  assert.equal(conditional.status, 304);
  const plain = cachedResponse(
    new Request("http://localhost/api/events"),
    data,
    60,
  );
  assert.equal(plain.headers.get("Content-Encoding"), null);
  assert.notEqual(plain.headers.get("etag"), etag);
  assert.deepEqual(await plain.json(), data);
});
