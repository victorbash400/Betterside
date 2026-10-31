import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "../app/server/aws.ts";
import { listGoalsTool } from "../app/tools/list-goals.ts";
import { createGoalTool } from "../app/tools/create-goal.ts";
import { updateGoalTool } from "../app/tools/update-goal.ts";
import { goalsResultSchema } from "../app/lib/chatGoals.ts";
import { loadProfile } from "../app/server/profile.ts";
const options = { toolCallId: "qa-create", messages: [], context: {} };
test("goal tools persist owner-scoped targets, prevent duplicate replay and reject stale edits", async () => {
  assert.equal(requireTable(), "BetterSide-dev");
  const donor = `qa-goal-tools-${randomUUID()}`;
  const context = { donor, records: [], origin: "http://localhost:3000" };
  const other = { ...context, donor: `${donor}-other` };
  const create = createGoalTool(context), update = updateGoalTool(context);
  const input = { category: "Education" as const, targetCents: 15000, period: "monthly" as const, revision: 0 };
  try {
    const initial = goalsResultSchema.parse(await listGoalsTool(context).execute!({}, options));
    assert.equal(initial.revision, 0);
    assert.deepEqual(initial.goals, []);
    const created = goalsResultSchema.parse(await create.execute!(input, options));
    assert.equal(created.revision, 1);
    assert.equal(created.goals[0].targetCents, 15000);
    assert.equal(created.goals[0].contributedCents, 0);
    assert.equal(created.goals[0].percent, 0);
    assert.equal(created.availableCategories.includes("Education"), false);
    const replay = goalsResultSchema.parse(await create.execute!(input, options));
    assert.equal(replay.revision, 1);
    assert.equal(replay.goals.length, 1);
    const id = created.goals[0].id;
    await assert.rejects(async () => create.execute!({ ...input, targetCents: 20000 }, options));
    await assert.rejects(async () => updateGoalTool(other).execute!({ goalId: id, revision: 1, targetCents: 20000 }, options));
    await assert.rejects(async () => update.execute!({ goalId: id, revision: 0, targetCents: 20000 }, options));
    const edited = goalsResultSchema.parse(await update.execute!({ goalId: id, revision: 1, targetCents: 20000 }, options));
    assert.equal(edited.revision, 2);
    assert.equal(edited.goals[0].targetCents, 20000);
    assert.equal(edited.goals[0].category, "Education");
    assert.equal(edited.goals[0].period, "monthly");
    assert.equal(edited.goals[0].createdAt, created.goals[0].createdAt);
    assert.equal((await loadProfile(other.donor)).revision, 0);
    assert.equal((await loadProfile(donor)).profile.goals.length, 1);
  } finally {
    await database.send(new DeleteCommand({ TableName: requireTable(), Key: { pk: `DONOR#${donor}`, sk: "PROFILE" } }));
  }
});
