import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  directoryOrganizationSchema,
  filterOrganizations,
  defaultOrganizationFilters,
  mergeDirectoryOrganizations,
  organizationCountryOverview,
  reportedOrganizationId,
  organizationCauseTopics,
  organizationMapScope,
} from "../app/lib/organizations.ts";
import {
  iatiOrganizations,
  hapiOrganizationCatalogue,
  hapiOrganizationPresence,
} from "../app/lib/organizationAdapters.ts";
import { organizationMapGeometry } from "../app/components/organizations/organizationMapLayers.ts";
import { mapGeographySchema } from "../app/lib/mapGeography.ts";
const evidence = {
  label: "Test source",
  url: "https://example.org/source",
  date: "2026-10-28",
};
const base = directoryOrganizationSchema.parse({
  id: "test:a",
  name: "Example organization",
  acronym: "EX",
  type: "NGO",
  identifiers: [],
  topics: ["Women's rights"],
  description: null,
  website: null,
  donateUrl: null,
  logoUrl: null,
  presence: [],
  size: null,
  evaluations: [],
  sources: [evidence],
});
const presence = {
  countryCode: "KEN",
  country: "Kenya",
  region: null,
  areaCode: null,
  sectors: ["Protection"],
  start: "2026-01-01T00:00:00Z",
  end: null,
  evidence,
};
const geography = mapGeographySchema.parse(
  JSON.parse(
    readFileSync(
      new URL("../public/geography/areas.json", import.meta.url),
      "utf8",
    ),
  ),
);
test("organization filtering combines verified topic, country, type, donation availability and search", () => {
  const a = {
    ...base,
    donateUrl: "https://example.org/donate",
    presence: [presence],
  };
  const b = {
    ...base,
    id: "test:b",
    topics: ["Human rights"],
    presence: [presence],
  };
  assert.deepEqual(
    filterOrganizations([a, b], {
      ...defaultOrganizationFilters,
      query: "example",
      topic: "Women's rights",
      country: "Kenya",
      type: "NGO",
      donation: "verified",
    }).map((org) => org.id),
    [a.id],
  );
  assert.equal(
    filterOrganizations([a], {
      ...defaultOrganizationFilters,
      country: "Uganda",
    }).length,
    0,
  );
  assert.equal(
    filterOrganizations([b], {
      ...defaultOrganizationFilters,
      donation: "verified",
    }).length,
    0,
  );
});
test("IATI identity is retained and headquarters is never used as operating presence or donation authority", () => {
  const [org] = iatiOrganizations({
    count: 1,
    next: null,
    results: [
      {
        id: "uuid",
        human_readable_name: "Example",
        short_name: "example",
        organisation_identifier: "GB-CHC-123",
        organisation_type: "21",
        website: "https://example.org",
        description: "Mission",
        hq_country: "GB",
      },
    ],
  });
  assert.equal(org.id, "iati:GB-CHC-123");
  assert.equal(org.type, "International NGO");
  assert.deepEqual(org.presence, []);
  assert.equal(org.donateUrl, null);
  assert.deepEqual(org.evaluations, []);
});
test("HAPI catalogues preserve exact identities and never merge different same-acronym organizations", () => {
  const orgs = hapiOrganizationCatalogue({
    data: [
      { name: "Example A", acronym: "EX", org_type_description: "NGO" },
      { name: "Example B", acronym: "EX", org_type_description: "NGO" },
    ],
  });
  assert.notEqual(orgs[0].id, orgs[1].id);
  assert.equal(mergeDirectoryOrganizations(orgs).length, 2);
  assert.equal(orgs[0].donateUrl, null);
  assert.notEqual(
    reportedOrganizationId("Example A", "EX", "NGO"),
    reportedOrganizationId("Example A", "EX", null),
  );
});
test("presence sectors keep explicit GBV focus while generic protection is not relabelled as women's rights", () => {
  const row = {
    location_code: "KEN",
    location_name: "Kenya",
    admin1_code: null,
    admin1_name: "Region",
    admin2_code: null,
    admin2_name: null,
    admin_level: 0,
    resource_hdx_id: "resource",
    org_acronym: "EX",
    org_name: "Example",
    org_type_description: "NGO",
    sector_code: "PRO-GBV",
    sector_name: "Gender Based Violence",
    reference_period_start: "2026-01-01T00:00:00",
    reference_period_end: null,
  };
  const resource = {
    resource_hdx_id: "resource",
    hdx_link: "https://data.humdata.org/dataset/test",
    dataset_hdx_provider_name: "Provider",
    update_date: "2026-10-01T00:00:00Z",
  };
  const [gbv] = hapiOrganizationPresence({ data: [row] }, [resource]);
  assert.ok(gbv.topics.includes("Women's rights"));
  assert.equal(gbv.presence[0].region, "Region");
  assert.equal(gbv.presence[0].evidence.url, resource.hdx_link);
  const [general] = hapiOrganizationPresence(
    { data: [{ ...row, sector_code: "PRO" }] },
    [resource],
  );
  assert.ok(!general.topics.includes("Women's rights"));
  assert.throws(() => hapiOrganizationPresence({ data: [row] }, []), {
    message: "Organization source metadata unavailable.",
  });
});
test("explicit profile links retain identifiers, evidence and all sectors without duplicating operating areas", () => {
  const merged = mergeDirectoryOrganizations([
    { ...base, presence: [presence] },
    {
      ...base,
      identifiers: [{ scheme: "IATI", value: "identifier" }],
      presence: [{ ...presence, sectors: ["Health"] }],
      topics: ["Health"],
    },
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].presence.length, 1);
  assert.deepEqual(merged[0].presence[0].sectors, ["Health", "Protection"]);
  assert.equal(merged[0].identifiers[0].value, "identifier");
  assert.equal(base.presence.length, 0);
});
test("global operating overview counts countries without creating office coordinates", () => {
  const org = {
    ...base,
    presence: [
      { ...presence, region: "Region A", areaCode: "KENA" },
      { ...presence, region: "Region B", areaCode: "KENB" },
    ],
  };
  const overview = organizationCountryOverview(org);
  assert.equal(overview.presence.length, 1);
  assert.equal(overview.presence[0].areaCode, null);
  assert.equal(overview.presence[0].region, null);
  assert.equal(org.presence.length, 2);
  const map = organizationMapGeometry([overview], geography);
  assert.equal(map.features.length, 1);
  assert.equal(map.features[0].geometry.type, "MultiPolygon");
  assert.equal(map.features[0].properties?.count, 1);
  assert.equal(
    organizationMapGeometry([{ ...base, presence: [] }], geography).features
      .length,
    0,
  );
});
test("mapped p-codes use the real district polygon while unmapped region names remain country scoped", () => {
  const code = Object.keys(geography).find(
    (code) => code.startsWith("UA") && code.length > 4,
  )!;
  const org = {
    ...base,
    presence: [
      {
        ...presence,
        countryCode: "UKR",
        country: "Ukraine",
        areaCode: code,
        region: "District",
      },
    ],
  };
  const map = organizationMapGeometry([org, org], geography);
  assert.deepEqual(map.features[0].geometry, geography[code].geometry);
  assert.equal(map.features[0].properties?.count, 1);
  const national = organizationMapGeometry(
    [{ ...org, presence: [{ ...org.presence[0], areaCode: "UNKNOWN" }] }],
    geography,
  );
  assert.deepEqual(national.features[0].geometry, geography.UKR.geometry);
});
test("reviewed profiles and real catalogue snapshots validate with evidence and no fabricated donation links", () => {
  const profiles = JSON.parse(
    readFileSync(
      new URL("../app/data/organizationProfiles.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(profiles.length, 16);
  for (const raw of profiles) {
    const org = directoryOrganizationSchema.parse(raw);
    assert.ok(org.sources.length);
    if (org.donateUrl)
      assert.ok(org.sources.some((source) => source.url === org.donateUrl));
    if (org.size) assert.ok(org.size.evidence.url);
  }
  const iati = JSON.parse(
    readFileSync(
      new URL("../app/data/iatiOrganizations.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(iati.count, 2130);
  assert.equal(iati.results.length, 2130);
  const hapi = JSON.parse(
    readFileSync(
      new URL("../app/data/hapiOrganizations.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(hapi.records, 37923);
  assert.equal(hapi.truncated, false);
  assert.equal(hapi.organizations.length, 2534);
  for (const raw of hapi.organizations) {
    const org = directoryOrganizationSchema.parse(raw);
    assert.equal(org.donateUrl, null);
    assert.equal(org.size, null);
    assert.deepEqual(org.evaluations, []);
  }
});

test("sector filters require evidence in the selected country", () => {
  const organization = {
    ...base,
    presence: [
      presence,
      {
        ...presence,
        countryCode: "UGA",
        country: "Uganda",
        sectors: ["Health"],
      },
    ],
  };
  assert.equal(
    filterOrganizations([organization], {
      ...defaultOrganizationFilters,
      country: "Kenya",
      sector: "Health",
    }).length,
    0,
  );
  assert.equal(
    filterOrganizations([organization], {
      ...defaultOrganizationFilters,
      country: "Uganda",
      sector: "Health",
    }).length,
    1,
  );
});

test("selecting an organization exposes all of its reported causes, including beyond the active cause", () => {
  const organization = { ...base, topics: ["Water", "Health"] };
  const candidates = filterOrganizations([organization], {
    ...defaultOrganizationFilters,
    topic: "Water",
  });
  assert.deepEqual(organizationCauseTopics(candidates[0]), ["Water", "Health"]);
  assert.deepEqual(organizationCauseTopics({ ...base, topics: [] }), []);
  assert.ok(organizationCauseTopics().includes("Hunger"));
});

test("selected organizations show worldwide reported coverage while unselected map results respect country filters", () => {
  const organization = {
    ...base,
    presence: [
      presence,
      { ...presence, countryCode: "UGA", country: "Uganda" },
    ],
  };
  const candidates = filterOrganizations([organization], {
    ...defaultOrganizationFilters,
    country: "Kenya",
  });
  const focused = organizationMapScope(candidates, organization, "KEN");
  assert.deepEqual(
    focused[0].presence.map((area) => area.countryCode),
    ["KEN", "UGA"],
  );
  assert.equal(organizationMapGeometry(focused, geography).features.length, 2);
  const overview = organizationMapScope(candidates, undefined, "KEN");
  assert.deepEqual(
    overview[0].presence.map((area) => area.countryCode),
    ["KEN"],
  );
  assert.equal(organization.presence.length, 2);
});
