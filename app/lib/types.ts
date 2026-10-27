export type IssueKind =
  "Water" | "Hunger" | "Displacement" | "Disaster response";
export type View = "Explore" | "Contributions" | "Following";
export interface Source {
  label: string;
  url: string;
  published: string | null;
  reviewed: string;
}
export interface Issue {
  id: string;
  location: string;
  country: string;
  coordinates: [number, number];
  kind: IssueKind;
  severity: "High" | "Critical" | "Insufficient data";
  summary: string;
  source: Source;
  project: {
    id: string;
    name: string;
    organisation: string;
    target: number;
    raised: number;
    reportedOutcome: string | null;
    demonstration: true;
  };
}
export interface Contribution {
  id: string;
  projectId: string;
  projectName: string;
  amount: string;
  currency: "USD";
  status: "CREATED" | "COMPLETED" | "CANCELLED" | "FAILED" | "REFUNDED";
  createdAt: string;
  captureId?: string;
}
export interface Filters {
  query: string;
  kinds: IssueKind[];
  metric: "Severity" | "Funding gap" | "Freshness";
}
