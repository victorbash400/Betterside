import test from "node:test";
import assert from "node:assert/strict";
import {
  goalProgress,
  goalMatchesProject,
  profileSchema,
  type ContributionGoal,
} from "../app/lib/profile.ts";
import type { Contribution, MapItem } from "../app/lib/types.ts";
const goal: ContributionGoal = {
  id: "goal",
  category: "Water",
  period: "monthly",
  targetCents: 10000,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const payment: Contribution = {
  id: "p",
  goalId: "goal",
  amount: "25.00",
  currency: "USD",
  status: "COMPLETED",
  createdAt: "2026-09-30T00:00:00.000Z",
  completedAt: "2026-10-01T00:00:00.000Z",
  projectId: "p",
  projectName: "Demo",
};
test("goals count assigned captured money once, on capture month rather than order month", () => {
  const payments = [
    payment,
    payment,
    { ...payment, id: "pending", status: "CREATED" as const },
    { ...payment, id: "other", goalId: "other" },
  ];
  assert.deepEqual(
    goalProgress(goal, payments, "UTC", new Date("2026-10-30T00:00:00Z")),
    { cents: 2500, percent: 25 },
  );
  assert.equal(
    goalProgress(goal, payments, "UTC", new Date("2026-09-30T00:00:00Z")).cents,
    0,
  );
});
test("goals account for partial and full refunds, preserve overflow amounts and cap progress bars", () => {
  assert.equal(
    goalProgress(
      goal,
      [{ ...payment, status: "REFUNDED", refundedCents: 500 }],
      "UTC",
      new Date("2026-10-30T00:00:00Z"),
    ).cents,
    2000,
  );
  assert.equal(
    goalProgress(
      goal,
      [{ ...payment, status: "REFUNDED", refundedCents: 2500 }],
      "UTC",
      new Date("2026-10-30T00:00:00Z"),
    ).cents,
    0,
  );
  assert.deepEqual(
    goalProgress(
      { ...goal, targetCents: 100 },
      [payment],
      "UTC",
      new Date("2026-10-30T00:00:00Z"),
    ),
    { cents: 2500, percent: 100 },
  );
});
test("monthly goals follow the profile timezone; one-time goals retain previous months", () => {
  const paid = { ...payment, completedAt: "2026-10-31T22:00:00.000Z" };
  const now = new Date("2026-11-01T00:30:00.000Z");
  assert.equal(goalProgress(goal, [paid], "Africa/Nairobi", now).cents, 2500);
  assert.equal(goalProgress(goal, [paid], "UTC", now).cents, 0);
  assert.equal(
    goalProgress({ ...goal, period: "once" }, [paid], "UTC", now).cents,
    2500,
  );
});
test("goals reject duplicate IDs and unsupported timezones; cannot pretend unrelated projects fund education", () => {
  assert.equal(
    profileSchema.safeParse({ name: "", timeZone: "bad-zone", goals: [] })
      .success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ name: "", goals: [goal, goal] }).success,
    false,
  );
  const record = { kind: "Water", project: { id: "p" } } as MapItem;
  assert.equal(goalMatchesProject(goal, record), true);
  assert.equal(
    goalMatchesProject({ ...goal, category: "Education" }, record),
    false,
  );
  assert.equal(
    goalMatchesProject({ ...goal, category: "All causes" }, record),
    true,
  );
});

test("goals preserve target text and organization destinations without allowing sandbox routing", () => {
  const input = {
    ...goal,
    targetText: "  Fund clean water access  ",
    organization: {
      id: "water-org",
      name: "Water organization",
      donateUrl: "https://example.org/donate",
    },
    status: "active" as const,
  };
  const parsed = profileSchema.parse({ goals: [input] }).goals[0];
  assert.equal(parsed.targetText, "Fund clean water access");
  assert.equal(parsed.organization?.id, "water-org");
  const project = { kind: "Water", project: { id: "demo" } } as MapItem;
  assert.equal(goalMatchesProject(goal, project), true);
  assert.equal(goalMatchesProject(parsed, project), false);
  assert.equal(
    goalMatchesProject({ ...goal, status: "paused" }, project),
    false,
  );
  assert.equal(
    profileSchema.safeParse({
      goals: [{ ...input, targetText: "x".repeat(181) }],
    }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({
      goals: [
        {
          ...input,
          organization: {
            ...input.organization,
            donateUrl: "javascript:alert(1)",
          },
        },
      ],
    }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({
      goals: [
        {
          ...input,
          organization: {
            ...input.organization,
            donateUrl: "http://example.org/donate",
          },
        },
      ],
    }).success,
    false,
  );
});
