import test from "node:test";
import assert from "node:assert/strict";
import type { UIMessage } from "ai";
import { showThinkingIndicator, toolCallStatus, visibleChatParts } from "../app/lib/chatRenderPolicy.ts";

test("only active unfinished tools shimmer, including across approval and cancellation", () => {
  const part = { type: "tool-manage_goal", toolCallId: "manage" };
  for (const state of ["input-streaming", "input-available"]) {
    assert.equal(toolCallStatus({ ...part, state } as UIMessage["parts"][number], true), "running");
    assert.equal(toolCallStatus({ ...part, state } as UIMessage["parts"][number], false), "stopped");
  }
  for (const [state, expected] of [["output-available", "done"], ["output-error", "error"],
    ["output-denied", "cancelled"], ["approval-requested", "approval"]]) {
    for (const busy of [true, false]) assert.equal(toolCallStatus({ ...part, state } as UIMessage["parts"][number], busy), expected);
  }
  for (const busy of [true, false]) assert.equal(toolCallStatus({ ...part, state: "approval-responded",
    approval: { id: "approval", approved: false } } as UIMessage["parts"][number], busy), "cancelled");
  assert.equal(toolCallStatus({ ...part, state: "approval-responded",
    approval: { id: "approval", approved: true } } as UIMessage["parts"][number], true), "running");
  assert.equal(toolCallStatus({ type: "text", text: "Answer" }, true), undefined);
});

test("the thinking dot stops when the current assistant turn emits text or starts a tool", () => {
  const user: UIMessage = { id: "user", role: "user", parts: [{ type: "text", text: "Show a trend" }] };
  const assistant: UIMessage = { id: "assistant", role: "assistant", parts: [{ type: "step-start" }] };
  assert.equal(showThinkingIndicator([user, assistant], true), true);
  assert.equal(showThinkingIndicator([user, assistant], false), false);
  for (const part of [
    { type: "text", text: "Here is the trend", state: "streaming" },
    { type: "tool-show_trends", toolCallId: "trend", state: "input-streaming" },
  ] as UIMessage["parts"]) {
    assert.equal(showThinkingIndicator([user, { ...assistant, parts: [part] }], true), false);
  }
});

test("chat retains every tool indicator while hiding repeated tables and lookups", () => {
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
  assert.equal(visibleChatParts(parts).length, parts.length);
  assert.deepEqual(visibleChatParts(parts).filter(({ showResult }) => showResult).map(({ index }) => index), [0, 1, 2, 5, 6, 7]);
});

test("chat retains approval controls and the newest goal snapshot", () => {
  const parts = [
    { type: "tool-list_goals", state: "output-available", output: {} },
    { type: "tool-manage_goal", state: "approval-requested", approval: { id: "approval" } },
    { type: "tool-create_goal", state: "output-available", output: {} },
    { type: "text", text: "Continue in PayPal to approve." },
  ] as UIMessage["parts"];
  assert.equal(visibleChatParts(parts).length, parts.length);
  assert.deepEqual(visibleChatParts(parts).filter(({ showResult }) => showResult).map(({ index }) => index), [1, 2, 3]);
});

test("repeated history calls keep their tool indicators without duplicating the same chart", () => {
  const output = { kind: "trends", view: "Chart", series: [{ id: "sudan" }], failures: [] };
  const parts = [
    { type: "tool-show_trends", toolCallId: "history", input: {}, state: "output-available", output: { ...output, fetchedAt: "first" } },
    { type: "tool-show_trends", toolCallId: "history", input: {}, state: "output-available", output: { ...output, fetchedAt: "second" } },
    { type: "tool-show_trends", toolCallId: "history", input: {}, state: "output-available", output: { ...output, view: "Compare data" } },
  ] as UIMessage["parts"];
  assert.deepEqual(visibleChatParts(parts).map(({ showResult }) => showResult), [true, false, true]);
});
