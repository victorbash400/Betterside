import { useTrackingStorage } from "./useTrackingStorage";
export type { Interest } from "../lib/tracking";
export function useTracking() {
  const storage = useTrackingStorage();
  function track(issueId: string, interestId?: string) {
    storage.update((previous) => ({
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
    storage.update((previous) => ({
      ...previous,
      following: previous.following.filter((id) => id !== issueId),
      interests: previous.interests.map((interest) => ({
        ...interest,
        issueIds: interest.issueIds.filter((id) => id !== issueId),
      })),
    }));
  }
  function create(name: string, issueId?: string, categoryId?: string) {
    const existing = storage.state.interests.find(
      (interest) =>
        interest.name === name &&
        (!interest.categoryId || interest.categoryId === categoryId),
    );
    const id = existing?.id ?? crypto.randomUUID();
    storage.update((previous) => ({
      ...previous,
      following:
        issueId && !previous.following.includes(issueId)
          ? [...previous.following, issueId]
          : previous.following,
      interests: [
        ...previous.interests
          .filter((interest) => interest.id !== id)
          .map((interest) =>
            issueId
              ? {
                  ...interest,
                  issueIds: interest.issueIds.filter(
                    (value) => value !== issueId,
                  ),
                }
              : interest,
          ),
        {
          id,
          name,
          categoryId,
          issueIds: issueId
            ? [
                ...(existing?.issueIds ?? []).filter(
                  (value) => value !== issueId,
                ),
                issueId,
              ]
            : (existing?.issueIds ?? []),
        },
      ],
    }));
    return id;
  }
  return {
    ...storage.state,
    ready: storage.ready,
    error: storage.error,
    retry: storage.retry,
    track,
    untrack,
    create,
  };
}
