import test from "node:test";
import assert from "node:assert/strict";
import { hasInlineResult } from "../app/lib/chatRenderPolicy.ts";
import type { UIMessage } from "ai";
test("successful inline results replace duplicate assistant prose using structured tool states", () => {
  for (const type of ["tool-pin_items", "tool-show_trends", "tool-get_contribution", "tool-manage_goal"])
    assert.equal(hasInlineResult([{ type, toolCallId: "call", state: "output-available", input: {}, output: {} }] as UIMessage["parts"]), true);
  assert.equal(hasInlineResult([{ type: "tool-manage_goal", toolCallId: "call", state: "approval-requested", input: {}, approval: { id: "approval" } }] as UIMessage["parts"]), true);
  assert.equal(hasInlineResult([{ type: "text", text: "A normal answer" }]), false);
  assert.equal(hasInlineResult([{ type: "tool-show_trends", toolCallId: "call", state: "output-error", input: {}, errorText: "Unavailable" }] as UIMessage["parts"]), false);
});
