import type { Issue, Filters } from "./types";
const reviewed = "2026-10-27";
export const issueKinds = [
  "Water",
  "Hunger",
  "Displacement",
  "Disaster response",
] as const;
export const issues: Issue[] = [
  {
    id: "somalia-water",
    location: "Somalia",
    country: "Somalia",
    coordinates: [46.2, 5.15],
    kind: "Water",
    severity: "Insufficient data",
    summary:
      "Drought and disrupted services put access to safe water at risk. Consult the linked response reports for the latest assessment.",
    source: {
      label: "UNICEF · Horn of Africa",
      url: "https://www.unicef.org/documents/water-crisis-horn-africa",
      published: null,
      reviewed,
    },
    project: {
      id: "somalia-water-demo",
      name: "Restore community water access",
      organisation: "BetterSide Sandbox",
      target: 75000,
      raised: 0,
      reportedOutcome: null,
      demonstration: true,
    },
  },
  {
    id: "sudan-displacement",
    location: "Sudan",
    country: "Sudan",
    coordinates: [30.2, 15.5],
    kind: "Displacement",
    severity: "Insufficient data",
    summary:
      "Conflict has forced families from their homes. UNHCR reports on displacement and the regional response.",
    source: {
      label: "UNHCR · Sudan emergency",
      url: "https://www.unhcr.org/emergencies/sudan-emergency",
      published: null,
      reviewed,
    },
    project: {
      id: "sudan-shelter-demo",
      name: "Emergency shelter supplies",
      organisation: "BetterSide Sandbox",
      target: 120000,
      raised: 0,
      reportedOutcome: null,
      demonstration: true,
    },
  },
  {
    id: "gaza-food",
    location: "Gaza",
    country: "Palestine",
    coordinates: [34.45, 31.5],
    kind: "Hunger",
    severity: "Insufficient data",
    summary:
      "The food emergency requires sustained humanitarian access. WFP publishes updates on food assistance and access constraints.",
    source: {
      label: "WFP · Gaza emergency",
      url: "https://www.wfp.org/Emergencies/Palestine-Emergency",
      published: null,
      reviewed,
    },
    project: {
      id: "gaza-food-demo",
      name: "Community food assistance",
      organisation: "BetterSide Sandbox",
      target: 150000,
      raised: 0,
      reportedOutcome: null,
      demonstration: true,
    },
  },
  {
    id: "ukraine-displacement",
    location: "Ukraine",
    country: "Ukraine",
    coordinates: [31.2, 49.0],
    kind: "Displacement",
    severity: "Insufficient data",
    summary:
      "People displaced by the war need protection, shelter and support. UNHCR maintains the emergency response overview.",
    source: {
      label: "UNHCR · Ukraine emergency",
      url: "https://www.unhcr.org/emergencies/ukraine-emergency",
      published: null,
      reviewed,
    },
    project: {
      id: "ukraine-shelter-demo",
      name: "Support displaced households",
      organisation: "BetterSide Sandbox",
      target: 90000,
      raised: 0,
      reportedOutcome: null,
      demonstration: true,
    },
  },
  {
    id: "drc-response",
    location: "Eastern DR Congo",
    country: "DR Congo",
    coordinates: [29.2, -1.65],
    kind: "Disaster response",
    severity: "Insufficient data",
    summary:
      "Violence and displacement disrupt essential services for children and families. UNICEF reports on humanitarian needs and response.",
    source: {
      label: "UNICEF · DR Congo",
      url: "https://www.unicef.org/drcongo/en/what-we-do/emergency-response/eastern-drc",
      published: null,
      reviewed,
    },
    project: {
      id: "drc-response-demo",
      name: "Essential response supplies",
      organisation: "BetterSide Sandbox",
      target: 60000,
      raised: 0,
      reportedOutcome: null,
      demonstration: true,
    },
  },
];
export function filterIssues(records: Issue[], filters: Filters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return records.filter(
    (issue) =>
      (!filters.kinds.length || filters.kinds.includes(issue.kind)) &&
      (!query ||
        [issue.location, issue.country, issue.kind, issue.project.name].some(
          (value) => value.toLocaleLowerCase().includes(query),
        )),
  );
}
export function money(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
export function freshness(source: Issue["source"]) {
  if (!source.published) return "Publication date unavailable";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(source.published),
  );
}
