import type { IssueKind } from "./types.ts";
export interface InterestCategory {
  id: string;
  name: string;
  parentId?: string;
  issueKind: IssueKind;
}
// Product taxonomy. Category IDs remain stable when display labels change.
export const interestCategories: InterestCategory[] = [
  { id: "disease", name: "Disease outbreaks", parentId: "health", issueKind: "Health" },
  { id: "catastrophic-hunger", name: "Catastrophic hunger", parentId: "food", issueKind: "Hunger" },
  { id: "humanitarian-needs", name: "Humanitarian needs", issueKind: "Humanitarian needs" },
  { id: "conflict", name: "Conflict", issueKind: "Conflict" },
  { id: "health", name: "Health", issueKind: "Health" },
  { id: "climate", name: "Climate", issueKind: "Climate" },
  { id: "rainfall", name: "Rainfall", parentId: "climate", issueKind: "Climate" },
  { id: "water", name: "Water", issueKind: "Water" },
  {
    id: "drinking-water",
    name: "Safe drinking water",
    parentId: "water",
    issueKind: "Water",
  },
  {
    id: "sanitation",
    name: "Sanitation",
    parentId: "water",
    issueKind: "Water",
  },
  { id: "hygiene", name: "Hygiene", parentId: "water", issueKind: "Water" },
  { id: "food", name: "Food and nutrition", issueKind: "Hunger" },
  {
    id: "food-access",
    name: "Food access",
    parentId: "food",
    issueKind: "Hunger",
  },
  { id: "nutrition", name: "Nutrition", parentId: "food", issueKind: "Hunger" },
  {
    id: "food-security",
    name: "Food security",
    parentId: "food",
    issueKind: "Hunger",
  },
  { id: "displacement", name: "Displacement", issueKind: "Displacement" },
  {
    id: "shelter",
    name: "Shelter",
    parentId: "displacement",
    issueKind: "Displacement",
  },
  {
    id: "protection",
    name: "Protection",
    parentId: "displacement",
    issueKind: "Displacement",
  },
  {
    id: "displaced-families",
    name: "Displaced families",
    parentId: "displacement",
    issueKind: "Displacement",
  },
  {
    id: "disaster-response",
    name: "Disaster response",
    issueKind: "Disaster response",
  },
  {
    id: "flood-response",
    name: "Flood response",
    parentId: "disaster-response",
    issueKind: "Disaster response",
  },
  {
    id: "drought-response",
    name: "Drought response",
    parentId: "disaster-response",
    issueKind: "Disaster response",
  },
  {
    id: "earthquake-response",
    name: "Earthquake response",
    parentId: "disaster-response",
    issueKind: "Disaster response",
  },
  {
    id: "wildfire-response",
    name: "Wildfires",
    parentId: "disaster-response",
    issueKind: "Disaster response",
  },
  {
    id: "storm-response",
    name: "Storms",
    parentId: "disaster-response",
    issueKind: "Disaster response",
  },
  {
    id: "volcano-response",
    name: "Volcanoes",
    parentId: "disaster-response",
    issueKind: "Disaster response",
  },
  {
    id: "emergency-supplies",
    name: "Emergency supplies",
    parentId: "disaster-response",
    issueKind: "Disaster response",
  },
];
export interface InterestChoice {
  name: string;
  categoryId?: string;
  target?: import("./tracking.ts").PinTarget;
}
export function categoryPath(id?: string) {
  const category = interestCategories.find((item) => item.id === id);
  if (!category) return "";
  const parent = interestCategories.find(
    (item) => item.id === category.parentId,
  );
  return parent ? `${parent.name} / ${category.name}` : category.name;
}

export function interestOrder(
  left: { name: string; categoryId?: string },
  right: { name: string; categoryId?: string },
) {
  const rank = (id?: string) => {
    const index = interestCategories.findIndex(
      (category) => category.id === id,
    );
    return index < 0 ? interestCategories.length : index;
  };
  return (
    rank(left.categoryId) - rank(right.categoryId) ||
    left.name.localeCompare(right.name)
  );
}
