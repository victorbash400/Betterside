"use client";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, validateUIMessages } from "ai";
import { z } from "zod";
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
}: {
  conversationId: string;
  recordIds: string[];
  areaId?: string;
  model: "fast" | "reasoning";
  onAnalysis: (analysis: Analysis) => void;
}) {
  const [draft, setDraft] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { areaId, model, recordIds },
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
    [areaId, model, recordIds],
  );
  const chat = useChat({ id: conversationId, transport });
  const seen = useRef(new Set<string>()),
    applyAnalysis = useEffectEvent(onAnalysis);
  useEffect(() => {
    for (const message of chat.messages)
      for (const part of message.parts) {
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
        const saved =
          localStorage.getItem(`betterside-chat:${conversationId}`) ??
          (conversationId === "default"
            ? localStorage.getItem("betterside-chat")
            : null);
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
              if (part.type === "tool-show_analysis" && "output" in part) {
                const parsed = analysisSchema.safeParse(part.output);
                if (parsed.success) seen.current.add(parsed.data.id);
              }
            }
          setMessages(messages);
        }
        if (active)
          setDraft(
            localStorage.getItem(`betterside-draft:${conversationId}`) ??
              (conversationId === "default"
                ? localStorage.getItem("betterside-draft")
                : null) ??
              "",
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
      localStorage.setItem(`betterside-draft:${conversationId}`, draft);
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
        localStorage.setItem(`betterside-draft:${conversationId}`, saved.draft);
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
    busy:
      !hydrated || chat.status === "submitted" || chat.status === "streaming",
  };
}
