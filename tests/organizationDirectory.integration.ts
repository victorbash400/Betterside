import test from "node:test";
import assert from "node:assert/strict";
import {
  organizationDirectorySchema,
  filterOrganizations,
  defaultOrganizationFilters,
} from "../app/lib/organizations.ts";
test("organization directory serves real snapshots, caches concurrent requests and keeps source failures explicit", async () => {
  const originalFetch = globalThis.fetch;
  const originalIdentifier = process.env.HDX_HAPI_APP_IDENTIFIER;
  process.env.HDX_HAPI_APP_IDENTIFIER = "directory-integration-test";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("Test provider unavailable");
  };
  try {
    const { GET } = await import("../app/api/organization-directory/route.ts");
    const request = () =>
      new Request("http://localhost/api/organization-directory?refresh=1");
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => GET(request())),
    );
    assert.ok(responses.every((response) => response.status === 200));
    const results = await Promise.all(
      responses.map((response) => response.json()),
    );
    const data = organizationDirectorySchema.parse(results[0]);
    assert.ok(data.organizations.length > 4000);
    assert.ok(
      data.sources.some(
        (source) => source.id === "hapi-snapshot" && source.state === "ready",
      ),
    );
    assert.ok(
      data.sources.some(
        (source) => source.id === "hapi-presence" && source.state === "error",
      ),
    );
    assert.equal(calls, 5);
    const initialCalls = calls;
    const repeat = await GET(request());
    assert.equal(calls, initialCalls);
    assert.equal(repeat.headers.get("etag"), responses[0].headers.get("etag"));
    const conditional = await GET(
      new Request(request().url, {
        headers: { "If-None-Match": responses[0].headers.get("etag")! },
      }),
    );
    assert.equal(conditional.status, 304);
    const countryResponse = await GET(
      new Request(request().url + "&country=KEN"),
    );
    const countryData = organizationDirectorySchema.parse(
      await countryResponse.json(),
    );
    assert.ok(
      countryData.organizations.every((org) =>
        org.presence.every(
          (area) => area.countryCode === "KEN" || area.areaCode === null,
        ),
      ),
    );
    const women = filterOrganizations(countryData.organizations, {
      ...defaultOrganizationFilters,
      country: "Kenya",
      topics: ["Women's rights"],
    });
    assert.ok(women.length > 0);
    assert.ok(women.some((org) => org.id === "profile:womankind"));
    const invalid = await GET(new Request(request().url + "&country=invalid"));
    assert.equal(invalid.status, 400);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalIdentifier === undefined)
      delete process.env.HDX_HAPI_APP_IDENTIFIER;
    else process.env.HDX_HAPI_APP_IDENTIFIER = originalIdentifier;
  }
});
