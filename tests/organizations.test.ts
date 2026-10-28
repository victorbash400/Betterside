import test from "node:test";
import assert from "node:assert/strict";
import { groupOrganizations } from "../app/lib/responseOrganizations.ts";
const resource = {
  resource_hdx_id: "resource",
  hdx_link: "https://data.humdata.org/dataset/test",
  update_date: "2026-10-20T00:00:00Z",
  dataset_hdx_provider_name: "OCHA",
};
const row = {
  location_code: "UKR",
  location_name: "Ukraine",
  admin_level: 2,
  admin1_code: "UA1",
  admin1_name: "Region",
  admin2_code: "UA11",
  admin2_name: "District",
  resource_hdx_id: "resource",
  org_name: "Test organization",
  org_acronym: "TEST",
  org_type_description: "National NGO",
  sector_code: "PRO",
  sector_name: "Protection",
  reference_period_start: "2026-09-01T00:00:00Z",
  reference_period_end: "2026-09-30T23:59:59Z",
};
test("organization matching respects country and sector, and groups repeated district records without inflating partners", () => {
  const data = [
    row,
    row,
    { ...row, admin2_code: "UA12", admin2_name: "Other district" },
    { ...row, location_code: "SDN" },
    { ...row, sector_code: "WSH", sector_name: "WASH" },
  ];
  const organizations = groupOrganizations({ data }, [resource], "UKR", "PRO");
  assert.equal(organizations.length, 1);
  assert.equal(organizations[0].areas, 2);
  assert.deepEqual(organizations[0].sectors, ["Protection"]);
  assert.equal(organizations[0].sources.length, 1);
});
test("organization names stay source-faithful and old operational periods do not accumulate with newer reports", () => {
  const data = [
    row,
    {
      ...row,
      reference_period_start: "2026-01-01T00:00:00Z",
      admin2_code: "old",
    },
    { ...row, org_name: "Different organization", org_acronym: "TEST" },
  ];
  const organizations = groupOrganizations({ data }, [resource], "UKR");
  assert.equal(organizations.length, 2);
  assert.equal(
    organizations.find((organization) => organization.name === row.org_name)!
      .areas,
    1,
  );
  assert.equal(organizations[0].start, "2026-09-01T00:00:00.000Z");
});
test("missing organization evidence fails explicitly and cannot fabricate source links", () => {
  assert.throws(() => groupOrganizations({ data: [row] }, [], "UKR"), {
    message: "Organization source metadata unavailable. Retry.",
  });
});
