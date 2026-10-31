import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { profileResponseSchema, type DonorProfile } from "../lib/profile";
import { contributionRecordSchema } from "../lib/chatWorkspace";
export function useDonorProfile() {
  const [snapshot, setSnapshot] =
    useState<z.infer<typeof profileResponseSchema>>();
  const current = useRef(snapshot);
  current.current = snapshot;
  const [payments, setPayments] = useState<
    z.infer<typeof contributionRecordSchema>[]
  >([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const writing = useRef(false);
  const requestVersion = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const load = useCallback(async (signal: AbortSignal) => {
    const version = ++requestVersion.current;
    setError("");
    try {
      const responses = await Promise.all([
        fetch("/api/profile", { cache: "no-store", signal }),
        fetch("/api/contributions", { cache: "no-store", signal }),
      ]);
      const [profile, contributionData] = await Promise.all(
        responses.map(async (response) => {
          const body = await response.json();
          if (!response.ok)
            throw new Error(body.error ?? "Profile unavailable.");
          return body;
        }),
      );
      const parsed = profileResponseSchema.parse(profile);
      const ledger = z
        .object({ contributions: z.array(contributionRecordSchema) })
        .parse(contributionData);
      if (
        !signal.aborted &&
        version === requestVersion.current &&
        !writing.current
      ) {
        current.current = parsed;
        setSnapshot(parsed);
        setPayments(ledger.contributions);
      }
    } catch (failure) {
      if (!signal.aborted && version === requestVersion.current)
        setError(
          failure instanceof Error ? failure.message : "Profile unavailable.",
        );
    }
  }, [fetch]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const focus = () => {
      if (!writing.current) void load(controller.signal);
    };
    window.addEventListener("focus", focus);
    window.addEventListener("betterside-profile-changed", focus);
    return () => {
      controller.abort();
      window.removeEventListener("focus", focus);
      window.removeEventListener("betterside-profile-changed", focus);
    };
  }, [load, attempt]);
  async function save(profile: DonorProfile) {
    if (!current.current || writing.current)
      throw new Error("Profile is busy. Retry.");
    requestVersion.current++;
    writing.current = true;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, revision: current.current.revision }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Could not save profile.");
      const next = profileResponseSchema.parse(body);
      current.current = next;
      setSnapshot(next);
      window.dispatchEvent(new Event("betterside-profile-changed"));
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not save profile.",
      );
      throw failure;
    } finally {
      writing.current = false;
      setSaving(false);
    }
  }
  return {
    profile: snapshot?.profile,
    payments,
    error,
    saving,
    save,
    retry: () => setAttempt((value) => value + 1),
  };
}
