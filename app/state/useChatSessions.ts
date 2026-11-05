import { useAccount } from "./AccountContext";
import { accountStorageKey } from "../lib/accountStorage";
import { useEffect, useState } from "react";
import { z } from "zod";
const schema = z.object({
  version: z.literal(1),
  activeId: z.string(),
  items: z.array(z.object({ id: z.string(), title: z.string() })).min(1),
});
export interface ChatSession {
  id: string;
  title: string;
}
const initial = {
  version: 1 as const,
  activeId: "default",
  items: [{ id: "default", title: "Chat" }],
};
export function useChatSessions() {
  const { user } = useAccount();
  const key = accountStorageKey(user!.id, "chats");
  const [state, setState] = useState(initial),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = schema.parse(JSON.parse(raw));
        if (!saved.items.some((item) => item.id === saved.activeId))
          throw new Error();
        setState(saved);
      }
    } catch {
      setError("Could not restore chats.");
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready || error) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      setError("Could not save chats.");
    }
  }, [state, ready, error, key]);
  function create() {
    const id = crypto.randomUUID();
    setState((previous) => ({
      ...previous,
      activeId: id,
      items: [...previous.items, { id, title: "New chat" }],
    }));
  }
  function remove(id: string) {
    setState((previous) => {
      const items = previous.items.filter((item) => item.id !== id);
      if (!items.length) {
        const next = { id: crypto.randomUUID(), title: "New chat" };
        return { ...previous, items: [next], activeId: next.id };
      }
      return {
        ...previous,
        items,
        activeId:
          previous.activeId === id ? items.at(-1)!.id : previous.activeId,
      };
    });
  }
  function rename(id: string, title: string) {
    setState((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        item.id === id ? { ...item, title } : item,
      ),
    }));
  }
  return {
    ...state,
    ready,
    error,
    create,
    remove,
    rename,
    select: (activeId: string) =>
      setState((previous) => ({ ...previous, activeId })),
  };
}
