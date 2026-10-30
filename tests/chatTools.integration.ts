import test from "node:test";
import assert from "node:assert/strict";
import { workspaceTools } from "../app/tools/index.ts";
import type { MapItem } from "../app/lib/types.ts";
import { recordsResultSchema } from "../app/lib/chatWorkspace.ts";
const record: MapItem = {
  id: "qa-record",
  location: "Kenya",
  country: "Kenya",
  kind: "Hunger",
  coordinates: [37, 0],
  severity: "Insufficient data",
  summary: "Source data",
  source: {
    label: "Provider",
    url: "https://example.org/source",
    published: null,
    reviewed: "2026-10-30",
  },
};
const options = { toolCallId: "qa-call", messages: [], context: {} };
const tools = workspaceTools({
  records: [record],
  selectedIds: [],
  donor: "isolated-tool-test",
  origin: "http://localhost:3000",
});
test("AI discovers sourced data when no map causes are selected", async () => {
  const result = recordsResultSchema.parse(
    await tools.search_records.execute!(
      { scope: "all", projectsOnly: false, offset: 0, sort: "recent" },
      options,
    ),
  );
  assert.equal(result.total, 1);
  assert.deepEqual(recordsResultSchema.parse(result).records, [record]);
  const current = recordsResultSchema.parse(
    await tools.search_records.execute!(
      { scope: "selection", projectsOnly: false, offset: 0, sort: "recent" },
      options,
    ),
  );
  assert.equal(current.total, 0);
});
test("non-project sources cannot prepare sandbox payments", async () => {
  await assert.rejects(
    async () => {
      await tools.prepare_payment.execute!(
        { projectId: record.id, amount: "25" },
        options,
      );
    },
    { message: "Project unavailable in this workspace." },
  );
});
test("workspace mutations are delegated to the live client, not replayed on the server", () => {
  assert.equal(tools.open_checkout.execute, undefined);
  assert.equal(tools.save_records.execute, undefined);
  assert.equal(tools.filter_map.execute, undefined);
  assert.equal(tools.focus_organization.execute, undefined);
});

test("chart tool derives widgets from authoritative records", async () => {
  const output = await tools.show_chart.execute!(
    { type: "bar", metric: "records", groupBy: "country" },
    options,
  );
  assert.equal((output as { kind: string }).kind, "chart");
});
