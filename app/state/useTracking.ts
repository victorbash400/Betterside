import { issueKinds } from "../lib/catalogue";
import { interestPath } from "../lib/interestTree";
import type { MapItem, IssueKind } from "../lib/types";
import { useTrackingStorage } from "./useTrackingStorage";
export type { Interest } from "../lib/tracking";
export function useTracking() {
  const storage = useTrackingStorage();
  function track(issueId: string, interestId?: string, item?: MapItem) {
    storage.update((previous) => ({
      ...previous,
      savedItems: item
        ? [...previous.savedItems.filter((saved) => saved.id !== item.id), item]
        : previous.savedItems,
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
  function create(
    name: string,
    issueId?: string,
    categoryId?: string,
    parentId?: string,
  ) {
    const existing = storage.state.interests.find(
      (interest) =>
        interest.name === name &&
        (!interest.categoryId || interest.categoryId === categoryId) &&
        interest.parentId === parentId,
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
          parentId,
          hiddenKinds: [],
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
    rename: (id: string, name: string) =>
      storage.update((previous) => ({
        ...previous,
        interests: previous.interests.map((item) =>
          item.id === id ? { ...item, name } : item,
        ),
      })),
    moveFolder: (id: string, parentId?: string) =>
      storage.update((previous) => ({
        ...previous,
        interests: previous.interests.map((item) =>
          item.id === id ? { ...item, parentId } : item,
        ),
      })),
    archive: (id: string) =>
      storage.update((previous) => ({
        ...previous,
        interests: previous.interests.map((item) =>
          interestPath(previous.interests, item.id).some(
            (parent) => parent.id === id,
          )
            ? { ...item, archived: true }
            : item,
        ),
      })),
    addMany: (items: MapItem[], interestId?: string) =>
      storage.update((previous) => {
        const ids = new Set(items.map((item) => item.id));
        return {
          ...previous,
          following: Array.from(new Set([...previous.following, ...ids])),
          savedItems: [
            ...previous.savedItems.filter((item) => !ids.has(item.id)),
            ...items,
          ],
          interests: previous.interests.map((interest) => ({
            ...interest,
            issueIds:
              interest.id === interestId
                ? Array.from(new Set([...interest.issueIds, ...ids]))
                : interest.issueIds.filter((id) => !ids.has(id)),
          })),
        };
      }),
    filter: (id: string, kinds: IssueKind[]) =>
      storage.update((previous) => ({
        ...previous,
        interests: previous.interests.map((item) =>
          item.id === id
            ? {
                ...item,
                hiddenKinds: issueKinds.filter((kind) => !kinds.includes(kind)),
              }
            : item,
        ),
      })),
    untrack,
    create,
  };
}
