import test from "node:test";
import assert from "node:assert/strict";
import { issues, filterIssues } from "../app/lib/catalogue.ts";
test("shared filters combine location search and issue categories", () => {
  assert.equal(
    filterIssues(issues, {
      query: "Somalia",
      kinds: ["Water"],
      metric: "Severity",
    }).length,
    1,
  );
  assert.equal(
    filterIssues(issues, {
      query: "Somalia",
      kinds: ["Hunger"],
      metric: "Severity",
    }).length,
    0,
  );
});
test("public sources cannot become sandbox recipients and no severity is fabricated", () => {
  for (const issue of issues) {
    assert.equal(issue.project.demonstration, true);
    assert.equal(issue.project.organisation, "BetterSide Sandbox");
    assert.equal(issue.severity, "Insufficient data");
    assert.equal(issue.project.reportedOutcome, null);
    assert.equal(new URL(issue.source.url).protocol, "https:");
  }
});
