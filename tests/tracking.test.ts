import test from "node:test";
import assert from "node:assert/strict";
import {
  interestCategories,
  categoryPath,
  interestOrder,
} from "../app/lib/interestCategories.ts";
import { trackingSchema } from "../app/lib/tracking.ts";
test("interest hierarchy has stable unique IDs and valid parent categories", () => {
  assert.equal(
    new Set(interestCategories.map((category) => category.id)).size,
    interestCategories.length,
  );
  for (const category of interestCategories)
    if (category.parentId) {
      const parent = interestCategories.find(
        (item) => item.id === category.parentId,
      );
      assert.ok(parent);
      assert.equal(parent.parentId, undefined);
      assert.equal(parent.issueKind, category.issueKind);
    }
  assert.equal(categoryPath("drinking-water"), "Water / Safe drinking water");
  assert.ok(
    interestOrder(
      { name: "Water", categoryId: "water" },
      { name: "Safe drinking water", categoryId: "drinking-water" },
    ) < 0,
  );
});
test("tracking rejects unknown categories, duplicate assignments, and untracked files", () => {
  const base = {
    version: 1,
    following: ["issue-a"],
    interests: [
      {
        id: "interest-a",
        name: "Water",
        categoryId: "water",
        issueIds: ["issue-a"],
      },
    ],
  };
  assert.equal(trackingSchema.safeParse(base).success, true);
  assert.equal(
    trackingSchema.safeParse({ ...base, following: [] }).success,
    false,
  );
  assert.equal(
    trackingSchema.safeParse({
      ...base,
      interests: [
        base.interests[0],
        { ...base.interests[0], id: "interest-b" },
      ],
    }).success,
    false,
  );
  assert.equal(
    trackingSchema.safeParse({
      ...base,
      interests: [{ ...base.interests[0], categoryId: "unknown" }],
    }).success,
    false,
  );
});
