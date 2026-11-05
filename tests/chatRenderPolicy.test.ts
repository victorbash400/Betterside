import test from "node:test";
import assert from "node:assert/strict";
import type { UIMessage } from "ai";
import { visibleChatParts } from "../app/lib/chatRenderPolicy.ts";

test("chat preserves text around tool results and hides repeated tables and lookups", () => {
  const table = { kind: "records", total: 1, records: [{ id: "water" }], nextOffset: null };
  const parts = [
    { type: "text", text: "Here is what was reported." },
    { type: "tool-search_records", state: "output-available", output: table },
    { type: "text", text: "The reporting date matters." },
    { type: "tool-search_records", state: "output-available", output: table },
    { type: "tool-search_records", state: "output-available", output: { ...table, presentation: "lookup" } },
    { type: "tool-show_trends", state: "output-available", output: {} },
    { type: "text", text: "Compare the most recent observations." },
    { type: "tool-search_records", state: "output-available", output: { ...table, records: [{ id: "shelter" }] } },
  ] as UIMessage["parts"];
  assert.deepEqual(visibleChatParts(parts).map(({ index }) => index), [0, 1, 2, 5, 6, 7]);
});

test("chat retains approval controls and the newest goal snapshot", () => {
  const parts = [
    { type: "tool-list_goals", state: "output-available", output: {} },
    { type: "tool-manage_goal", state: "approval-requested", approval: { id: "approval" } },
    { type: "tool-create_goal", state: "output-available", output: {} },
    { type: "text", text: "Continue in PayPal to approve." },
  ] as UIMessage["parts"];
  assert.deepEqual(visibleChatParts(parts).map(({ index }) => index), [1, 2, 3]);
});
