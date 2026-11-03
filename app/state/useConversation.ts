"use client";
import { pinItemsSchema, unpinItemsSchema } from "../lib/chatPins";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  validateUIMessages,
  lastAssistantMessageIsCompleteWithToolCalls,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { z } from "zod";
import {
  checkoutInputSchema,
  mapFilterSchema,
  saveRecordsSchema,
  focusOrganizationSchema,
  type ChatWorkspaceActions,
  type WorkspaceChatContext,
} from "../lib/chatWorkspace";
import { analysisSchema, type Analysis } from "../lib/analysis";
const storedConversation = z.object({
  version: z.literal(1),
  messages: z.array(z.unknown()),
});
export function useConversation({
  conversationId,
  recordIds,
  areaId,
  model,
  onAnalysis,
  actions,
  context,
}: {
  conversationId: string;
  recordIds: string[];
  areaId?: string;
  model: "fast" | "reasoning";
  onAnalysis: (analysis: Analysis) => void;
  actions: ChatWorkspaceActions;
  context: WorkspaceChatContext;
}) {
  const [draft, setDraft] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { areaId, model, recordIds, context },
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          if (!response.ok) {
            const body = z
              .object({ error: z.string() })
              .parse(await response.json());
            throw new Error(body.error);
          }
          return response;
        },
      }),
    [areaId, model, recordIds, context],
  );
  const executeAction = useEffectEvent(
    async (name: string, input: unknown, callId: string) => {
      switch (name) {
        case "pin_items": return actions.pinItems(pinItemsSchema.parse(input), callId);
        case "unpin_items": return actions.unpinItems(unpinItemsSchema.parse(input));
        case "open_checkout":
          return actions.openCheckout(checkoutInputSchema.parse(input));
        case "filter_map":
          return actions.filterMap(mapFilterSchema.parse(input));
        case "save_records":
          return actions.saveRecords(saveRecordsSchema.parse(input), callId);
        case "focus_organization":
          return actions.focusOrganization(
            focusOrganizationSchema.parse(input),
          );
        default:
          throw new Error("Unknown workspace action.");
      }
    },
  );
  const chat = useChat({
    id: conversationId,
    transport,
    sendAutomaticallyWhen: (state) => lastAssistantMessageIsCompleteWithToolCalls(state)
      || lastAssistantMessageIsCompleteWithApprovalResponses(state),
    onToolCall: async ({ toolCall }) => {
      if (
        ![
          "pin_items",
          "unpin_items",
          "filter_map",
          "save_records",
          "focus_organization",
          "open_checkout",
        ].includes(toolCall.toolName)
      )
        return;
      try {
        const output = await executeAction(
          toolCall.toolName,
          toolCall.input,
          toolCall.toolCallId,
        );
        void chat.addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output,
        });
      } catch (error) {
        void chat.addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: "output-error",
          errorText:
            error instanceof Error ? error.message : "Workspace action failed.",
        });
      }
    },
  });
  const seen = useRef(new Set<string>()),
    applyAnalysis = useEffectEvent(onAnalysis);
  useEffect(() => {
    for (const message of chat.messages)
      for (const part of message.parts) {
        if (["tool-create_goal", "tool-update_goal", "tool-manage_goal"].includes(part.type)
          && "state" in part && part.state === "output-available" && "toolCallId" in part
          && !seen.current.has(`goal:${part.toolCallId}`)) {
          seen.current.add(`goal:${part.toolCallId}`);
          window.dispatchEvent(new Event("betterside-payments-changed"));
        }
        if (
          part.type !== "tool-show_analysis" ||
          !("state" in part) ||
          part.state !== "output-available" ||
          !("output" in part)
        )
          continue;
        const parsed = analysisSchema.safeParse(part.output);
        if (parsed.success && !seen.current.has(parsed.data.id)) {
          seen.current.add(parsed.data.id);
          applyAnalysis(parsed.data);
        }
      }
  }, [chat.messages]);
  const [storageError, setStorageError] = useState(""),
    [hydrated, setHydrated] = useState(false);
  const setMessages = chat.setMessages;
  useEffect(() => {
    let active = true;
    async function restore() {
      setStorageError("");
      try {
        const saved = localStorage.getItem(`betterside-chat:${conversationId}`)
          ?? (conversationId === "default" ? localStorage.getItem("betterside-chat") : null);
        if (saved) {
          const raw = JSON.parse(saved);
          const snapshot = Array.isArray(raw)
            ? { version: 1, messages: raw }
            : storedConversation.parse(raw);
          const messages = snapshot.messages.length
            ? await validateUIMessages({ messages: snapshot.messages })
            : [];
          if (!active) return;
          for (const message of messages)
            for (const part of message.parts) {
              if (["tool-create_goal", "tool-update_goal", "tool-manage_goal"].includes(part.type) && "toolCallId" in part)
                seen.current.add(`goal:${part.toolCallId}`);
              if (part.type === "tool-show_analysis" && "output" in part) {
                const parsed = analysisSchema.safeParse(part.output);
                if (parsed.success) seen.current.add(parsed.data.id);
              }
            }
          setMessages(messages);
        }
        if (active)
          setDraft(
            localStorage.getItem(`betterside-draft:${conversationId}`)
              ?? (conversationId === "default" ? localStorage.getItem("betterside-draft") : null) ?? "",
          );
      } catch {
        if (active) setStorageError("Could not restore conversation.");
      } finally {
        if (active) setHydrated(true);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, [setMessages, conversationId]);
  useEffect(() => {
    if (storageError || !hydrated || chat.status === "streaming") return;
    try {
      localStorage.setItem(
        `betterside-chat:${conversationId}`,
        JSON.stringify({ version: 1, messages: chat.messages }),
      );
      localStorage.setItem(
        `betterside-draft:${conversationId}`,
        draft,
      );
    } catch {
      setStorageError("Could not save conversation.");
    }
  }, [
    draft,
    chat.messages,
    hydrated,
    chat.status,
    conversationId,
    storageError,
  ]);
  const latest = useRef({
    messages: chat.messages,
    draft,
    hydrated,
    storageError,
  });
  latest.current = { messages: chat.messages, draft, hydrated, storageError };
  useEffect(
    () => () => {
      const saved = latest.current;
      if (!saved.hydrated || saved.storageError) return;
      try {
        localStorage.setItem(
          `betterside-chat:${conversationId}`,
          JSON.stringify({ version: 1, messages: saved.messages }),
        );
        localStorage.setItem(
          `betterside-draft:${conversationId}`,
          saved.draft,
        );
      } catch {
        console.error("Could not save chat before closing.");
      }
    },
    [conversationId],
  );
  return {
    ...chat,
    draft,
    setDraft,
    storageError,
    hydrated,
    busy:
      !hydrated || chat.status === "submitted" || chat.status === "streaming",
  };
}
