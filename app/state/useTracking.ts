import { useEffect, useState } from "react";
import { z } from "zod";
export interface Interest {
  id: string;
  name: string;
  issueIds: string[];
}
const schema = z.object({
  version: z.literal(1),
  following: z.array(z.string()),
  interests: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      issueIds: z.array(z.string()),
    }),
  ),
});
const initial = {
  version: 1 as const,
  following: [] as string[],
  interests: [] as Interest[],
};
export function useTracking() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(initial);
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("betterside-tracking");
      if (saved) {
        const next = schema.parse(JSON.parse(saved));
        if (
          next.interests.some((interest) =>
            interest.issueIds.some((id) => !next.following.includes(id)),
          )
        )
          throw new Error();
        setState(next);
      } else {
        const legacy = localStorage.getItem("betterside-following");
        if (legacy)
          setState({
            ...initial,
            following: z.array(z.string()).parse(JSON.parse(legacy)),
          });
      }
    } catch {
      setError("Could not restore interests.");
    }
    setReady(true);
  }, [attempt]);
  useEffect(() => {
    if (!ready || error) return;
    try {
      localStorage.setItem("betterside-tracking", JSON.stringify(state));
    } catch {
      setError("Could not save interests.");
    }
  }, [state, ready, error]);
  function track(issueId: string, interestId?: string) {
    setState((previous) => ({
      ...previous,
      following: previous.following.includes(issueId)
        ? previous.following
        : [...previous.following, issueId],
      interests: previous.interests.map((interest) => ({
        ...interest,
        issueIds:
          interest.id === interestId
            ? [...interest.issueIds.filter((id) => id !== issueId), issueId]
            : interest.issueIds.filter((id) => id !== issueId),
      })),
    }));
  }
  function untrack(issueId: string) {
    setState((previous) => ({
      ...previous,
      following: previous.following.filter((id) => id !== issueId),
      interests: previous.interests.map((interest) => ({
        ...interest,
        issueIds: interest.issueIds.filter((id) => id !== issueId),
      })),
    }));
  }
  function create(name: string, issueId?: string) {
    const id = crypto.randomUUID();
    setState((previous) => ({
      ...previous,
      following:
        issueId && !previous.following.includes(issueId)
          ? [...previous.following, issueId]
          : previous.following,
      interests: [
        ...previous.interests.map((interest) =>
          issueId
            ? {
                ...interest,
                issueIds: interest.issueIds.filter(
                  (value) => value !== issueId,
                ),
              }
            : interest,
        ),
        { id, name, issueIds: issueId ? [issueId] : [] },
      ],
    }));
    return id;
  }
  return {
    ...state,
    ready,
    error,
    track,
    untrack,
    create,
    retry: () => {
      setReady(false);
      setError("");
      setAttempt((value) => value + 1);
    },
  };
}
