"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { accountSchema, type Account } from "../lib/account";
import { accountRequest, AccountApiError } from "../lib/accountApi";
type State = {
  user: Account | null;
  ready: boolean;
  error: string;
  busy: boolean;
  fetch: typeof fetch;
  reload: () => Promise<void>;
  signedIn: (user: Account) => void;
  update: (user: Account) => void;
  signOut: () => Promise<void>;
  beforeSignOut: (save: () => Promise<void>) => () => void;
};
const AccountContext = createContext<State | null>(null);
export default function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const loadVersion = useRef(0);
  const generation = useRef(0),
    channel = useRef<BroadcastChannel | null>(null);
  const saves = useRef(new Set<() => Promise<void>>());
  const beforeSignOut = useCallback((save: () => Promise<void>) => {
    saves.current.add(save);
    return () => {
      saves.current.delete(save);
    };
  }, []);
  const reload = useCallback(async () => {
    const current = generation.current;
    const version = ++loadVersion.current;
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await response.json();
      if (current !== generation.current || version !== loadVersion.current)
        return;
      if (response.status === 401) {
        setUser(null);
        setError("");
      } else if (!response.ok) {
        setUser(null);
        setError(data.error ?? "Account unavailable. Retry.");
      } else {
        setUser(accountSchema.parse(data.user));
        setError("");
      }
    } catch (failure) {
      if (current === generation.current && version === loadVersion.current) {
        setUser(null);
        setError(
          failure instanceof Error
            ? failure.message
            : "Account unavailable. Retry.",
        );
      }
    } finally {
      if (current === generation.current && version === loadVersion.current)
        setReady(true);
    }
  }, []);
  useEffect(() => {
    void reload();
    const events = new BroadcastChannel("betterside-account");
    channel.current = events;
    events.onmessage = (event) => {
      if (event.data === "profile") {
        void reload();
        return;
      }
      if (event.data !== "changed") return;
      generation.current++;
      setUser(null);
      setReady(false);
      void reload();
    };
    const focus = () => {
      void reload();
    };
    window.addEventListener("focus", focus);
    return () => {
      generation.current++;
      events.close();
      channel.current = null;
      window.removeEventListener("focus", focus);
    };
  }, [reload]);
  const owner = user?.id;
  const authenticatedFetch = useCallback<typeof fetch>(
    async (input, init) => {
      const current = generation.current;
      const headers = new Headers(init?.headers);
      if (owner) headers.set("X-BetterSide-Account", owner);
      const response = await fetch(input, {
        ...init,
        headers,
        credentials: "same-origin",
        cache: "no-store",
      });
      if (current !== generation.current) {
        await response.body?.cancel();
        throw new Error("Account changed. Reload before saving.");
      }
      if (response.status === 401) {
        generation.current++;
        setUser(null);
        setError("Session expired. Sign in again.");
        channel.current?.postMessage("changed");
      }
      return response;
    },
    [owner],
  );
  function signedIn(next: Account) {
    generation.current++;
    setUser(accountSchema.parse(next));
    setReady(true);
    setError("");
    channel.current?.postMessage("changed");
  }
  function update(next: Account) {
    setUser(accountSchema.parse(next));
    channel.current?.postMessage("profile");
  }
  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await Promise.all([...saves.current].map((save) => save()));
      await accountRequest("/api/auth/sign-out", {}, authenticatedFetch);
      generation.current++;
      setUser(null);
      channel.current?.postMessage("changed");
    } catch (failure) {
      setError(
        failure instanceof AccountApiError || failure instanceof Error
          ? failure.message
          : "Could not sign out. Retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AccountContext
      value={{
        user,
        ready,
        error,
        busy,
        fetch: authenticatedFetch,
        reload,
        signedIn,
        update,
        signOut,
        beforeSignOut,
      }}
    >
      {children}
    </AccountContext>
  );
}
export function useAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("Account provider missing.");
  return account;
}
