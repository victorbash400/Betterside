import { readFileSync, writeFileSync } from "node:fs";
import {
  hapiOrganizationCatalogue,
  hapiOrganizationPresence,
} from "../app/lib/organizationAdapters.ts";
import {
  mergeDirectoryOrganizations,
  directoryOrganizationSchema,
} from "../app/lib/organizations.ts";
import { resourceSchema } from "../app/lib/feeds/hapi.ts";
const [orgPath, presencePath, resourcePath] = process.argv.slice(2);
if (!orgPath || !presencePath || !resourcePath)
  throw new Error(
    "Pass downloaded org, operational-presence and resource JSON files.",
  );
const presence = JSON.parse(readFileSync(presencePath, "utf8"));
const resources = resourceSchema.parse(
  JSON.parse(readFileSync(resourcePath, "utf8")),
).data;
const organizations = mergeDirectoryOrganizations([
  ...hapiOrganizationCatalogue(JSON.parse(readFileSync(orgPath, "utf8"))),
  ...hapiOrganizationPresence(presence, resources),
]);
for (const org of organizations) directoryOrganizationSchema.parse(org);
const snapshot = {
  source:
    "https://hapi.humdata.org/api/v2/coordination-context/operational-presence",
  retrievedAt: presence.retrievedAt ?? new Date().toISOString(),
  truncated: presence.truncated ?? false,
  records: presence.data.length,
  organizations,
};
writeFileSync("app/data/hapiOrganizations.json", JSON.stringify(snapshot));
console.log(
  JSON.stringify({
    organizations: organizations.length,
    presenceRecords: presence.data.length,
    areas: organizations.reduce((sum, org) => sum + org.presence.length, 0),
    truncated: snapshot.truncated,
  }),
);
