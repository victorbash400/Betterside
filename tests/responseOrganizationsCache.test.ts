import test from "node:test";
import assert from "node:assert/strict";
import {
  responseOrganizationsPath,
  cachedResponseOrganizations,
  fetchResponseOrganizations,
} from "../app/state/responseOrganizationsCache.ts";

test("reopening country organizations reuses the same result until explicit refresh", async () => {
  const original = globalThis.fetch;
  const path = responseOrganizationsPath("PAK", "hunger");
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return Response.json({ country: "Pakistan", sector: "Food security", truncated: false, organizations: [] });
  };
  try {
    const [first, concurrent] = await Promise.all([
      fetchResponseOrganizations(path), fetchResponseOrganizations(path),
    ]);
    assert.equal(requests, 1);
    assert.equal(first, concurrent);
    assert.equal(cachedResponseOrganizations(path), first);
    assert.equal(await fetchResponseOrganizations(path), first);
    assert.equal(requests, 1);
    const refreshed = await fetchResponseOrganizations(path, true);
    assert.equal(requests, 2);
    assert.equal(cachedResponseOrganizations(path), refreshed);
    await fetchResponseOrganizations(path);
    assert.equal(requests, 2);
    assert.equal(cachedResponseOrganizations(responseOrganizationsPath("KEN", "hunger")), undefined);
  } finally {
    globalThis.fetch = original;
  }
});
