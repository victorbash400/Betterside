import { writeFile } from "node:fs/promises";
import {
  ftsOrganizationsSchema,
  ftsSourceUrl,
} from "../app/lib/ftsOrganizations.ts";
const response = await fetch(ftsSourceUrl, {
  signal: AbortSignal.timeout(90000),
});
if (!response.ok) throw new Error(`FTS returned HTTP ${response.status}.`);
const raw = await response.json();
const feed = ftsOrganizationsSchema.parse(raw);
if (!feed.data.length) throw new Error("FTS directory is empty.");
const snapshot = {
  source: ftsSourceUrl,
  retrievedAt: new Date().toISOString(),
  ...feed,
};
await writeFile(
  new URL("../app/data/ftsOrganizations.json", import.meta.url),
  JSON.stringify(snapshot),
);
console.log(
  JSON.stringify({
    organizations: feed.data.length,
    source: snapshot.source,
    retrievedAt: snapshot.retrievedAt,
  }),
);
