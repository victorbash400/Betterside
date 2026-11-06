import test from "node:test";
import assert from "node:assert/strict";
import { chatEvidence } from "../app/agents/chatEvidence.ts";
import { chatInstructions } from "../app/agents/chatInstructions.ts";
import type { ChatAgentContext } from "../app/agents/context.ts";
import type { MapItem } from "../app/lib/types.ts";

const idps: MapItem = {
  id: "idps-sudan", dataset: "hapi-idps", location: "Sudan · Armed clashes", country: "Sudan",
  kind: "Displacement", severity: "Insufficient data", summary: "Reported assessment", coordinates: [30, 15],
  recordType: "Indicator", measurements: [{ metric: "idps", value: 123 }],
  reportingArea: { countryCode: "SDN", adminLevel: 0, admin1Code: null, admin2Code: null },
  referencePeriod: { start: "2026-08-01", end: "2026-08-31" },
  source: { label: "IOM · HDX HAPI", url: "https://example.org/iom", published: "2026-09-01", reviewed: "2026-11-06" },
};
const refugee: MapItem = { ...idps, id: "refugees-sudan", dataset: "hapi-refugees", measurements: [{ metric: "refugees", value: 456 }] };
const context: ChatAgentContext = { records: [refugee, idps], donor: "test", origin: "http://localhost", sources: [] };

test("selected record evidence includes exact measurements, assessment dates, source and compatible history scope", () => {
  const evidence = chatEvidence({ ...context, areaId: idps.id });
  assert.equal(evidence.selectedRecord?.id, idps.id);
  assert.deepEqual(evidence.selectedRecord?.source, {
    label: idps.source.label, url: idps.source.url, updatedAt: "2026-09-01", loadedAt: "2026-11-06",
  });
  assert.deepEqual(evidence.selectedMeasurements, [{ metric: "idps", value: 123, label: "Internally displaced people" }]);
  assert.deepEqual(evidence.selectedHistoryScope, { countries: ["SDN"], dataset: "hapi-idps", concern: "displacement", recordId: idps.id });
  assert.ok(chatInstructions({ ...context, areaId: idps.id }).includes(JSON.stringify(evidence)));
});

test("a single visible record resolves the reference without confusing refugees and internal displacement", () => {
  assert.equal(chatEvidence({ ...context, selectedIds: [idps.id] }).selectedRecord?.id, idps.id);
  assert.equal(chatEvidence({ ...context, areaId: refugee.id }).selectedHistoryScope?.concern, "refugees");
});

test("ambiguous or unavailable references do not fall back to an unrelated catalogue record", () => {
  assert.equal(chatEvidence(context).selection, "none");
  assert.equal(chatEvidence(context).selectedRecord, null);
  assert.deepEqual(chatEvidence(context).workspaceRecords, []);
  const missing = chatEvidence({ ...context, areaId: "missing", selectedIds: [refugee.id] });
  assert.equal(missing.selection, "unavailable");
  assert.equal(missing.selectedRecord, null);
});

test("workspace evidence respects country and cause rather than the largest dataset count", () => {
  const evidence = chatEvidence({ ...context, context: {
    view: "Explore", mode: "map", country: "Sudan", causes: ["displacement"], visualization: "Areas",
  } });
  assert.deepEqual(evidence.workspaceRecords, [idps]);
});
