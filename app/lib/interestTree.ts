import type { Interest } from "./tracking.ts";
export function interestPath(interests: Interest[], id?: string) {
  const path: Interest[] = [];
  const seen = new Set<string>();
  let current = interests.find((item) => item.id === id);
  while (current && !seen.has(current.id)) {
    path.unshift(current);
    seen.add(current.id);
    current = interests.find((item) => item.id === current!.parentId);
  }
  return path;
}
export function canMoveInterest(
  interests: Interest[],
  id: string,
  parentId?: string,
) {
  return (
    !parentId ||
    !interestPath(interests, parentId).some((item) => item.id === id)
  );
}
