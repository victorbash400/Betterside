import "server-only";
import { contributions } from "./contributions.ts";
import { createHash } from "node:crypto";
import { tool } from "ai";
import { z } from "zod";
import { searchRecords } from "../lib/researchRecords.ts";
import { calculate } from "../lib/chatCalculation.ts";
import {
  searchInputSchema,
  mapFilterSchema,
  saveRecordsSchema,
  focusOrganizationSchema,
  calculationInputSchema,
} from "../lib/chatWorkspace.ts";
import {
  defaultOrganizationFilters,
  filterOrganizations,
  organizationTopics,
} from "../lib/organizations.ts";
import { loadOrganizationDirectory } from "./organizationDirectory.ts";
import { createPayPalOrder } from "./createPayPalOrder.ts";
import type { MapItem } from "../lib/types.ts";
export function workspaceTools({
  records,
  selectedIds,
  donor,
  origin,
}: {
  records: MapItem[];
  selectedIds?: string[];
  donor: string;
  origin: string;
}) {
  return {
    search_records: tool({
      description:
        "Search real sourced crisis records and demonstration projects; display results as an inline sortable grid. Use scope all to discover data even when the map has no causes selected. Literal query terms only; structured country/kind/dataset filters are preferred. Page size 20, use nextOffset. projectsOnly finds sandbox funding projects; do not add query terms like demonstration or project unless they occur in the project name. Omit dataset when finding projects. Use sort funding-gap with projectsOnly true for the largest sandbox funding gaps; name and country sorting are also available.",
      inputSchema: searchInputSchema,
      execute: async ({ scope, projectsOnly, ...query }) => {
        const ids = new Set(selectedIds ?? []);
        const candidates = records.filter(
          (record) =>
            (scope === "all" || ids.has(record.id)) &&
            (!projectsOnly || record.project),
        );
        return {
          kind: "records" as const,
          ...searchRecords(candidates, query),
        };
      },
    }),
    search_organizations: tool({
      description:
        "Search source-reported organizations and operating countries. Returns an inline organization grid. Query is the literal organization name or acronym. Topics must use the named source categories. Country is a literal country name; not a headquarters filter. Does not claim impact or imply organizations receive BetterSide payments.",
      inputSchema: z.object({
        query: z.string().max(200).default(""),
        country: z.string().max(120).default(""),
        topics: z.array(z.enum(organizationTopics)).default([]),
        offset: z.number().int().min(0).max(20000).default(0),
      }),
      execute: async ({ query, country, topics, offset }) => {
        const directory = await loadOrganizationDirectory();
        const matches = filterOrganizations(directory.organizations, {
          ...defaultOrganizationFilters,
          query,
          topics,
        }).filter(
          (org) =>
            !country ||
            org.presence.some((area) =>
              area.country
                .toLocaleLowerCase()
                .includes(country.toLocaleLowerCase()),
            ),
        );
        return {
          kind: "organizations" as const,
          total: matches.length,
          organizations: matches.slice(offset, offset + 20),
          nextOffset: offset + 20 < matches.length ? offset + 20 : null,
        };
      },
    }),
    filter_map: tool({
      description:
        "Apply the map's country, cause layers and visualization controls. Use exact country names returned by search or empty string for all countries. An empty causes array removes every layer. Map and Table remain separate; this opens Map. Only do this when the user asks to change/show/filter the map.",
      inputSchema: mapFilterSchema,
    }),
    focus_organization: tool({
      description:
        "Focus a source organization from search_organizations in the map drawer. Choose explicit supported topics from that organization's returned topics; empty topics draws no layers. Crisis measurements are scoped to reported operations, never organization impact or beneficiaries.",
      inputSchema: focusOrganizationSchema,
    }),
    save_records: tool({
      description:
        "Save explicit sourced record IDs into a named interest folder when asked. IDs must come from search_records or available records. No payment occurs; an interest named Donation plan is still a saved list, not a paid contribution.",
      inputSchema: saveRecordsSchema,
    }),
    calculate: tool({
      description:
        "Compute deterministic arithmetic or split a USD budget into cent-exact shares. Operations divide/percentage take numerator and denominator. Split takes [amount, number of shares]. Do not sum overlapping humanitarian populations, sectors, time periods, host/origin populations or units. Financial totals are sandbox project values only.",
      inputSchema: calculationInputSchema,
      execute: async (input) => calculate(input),
    }),
    list_contributions: tool({
      description:
        "Read this visitor's actual sandbox orders from the payment ledger and show an inline grid. CREATED is awaiting approval, not paid. Only COMPLETED confirms capture; CANCELLED/FAILED/REFUNDED are not completed contributions. Never infer completion from chat messages or a prepared order. Only this visitor's records are accessible.",
      inputSchema: z.object({
        status: z
          .enum(["CREATED", "COMPLETED", "CANCELLED", "FAILED", "REFUNDED"])
          .optional(),
        offset: z.number().int().min(0).max(20000).default(0),
      }),
      execute: async ({ status, offset }) => {
        const records = (await contributions(donor)).filter(
          (record) => !status || record.status === status,
        );
        return {
          kind: "contributions" as const,
          records: records.slice(offset, offset + 20),
          total: records.length,
          nextOffset: offset + 20 < records.length ? offset + 20 : null,
        };
      },
    }),
    prepare_payment: tool({
      description:
        "Create a real PayPal SANDBOX order and render its approval card inline. Only when the user explicitly requests checkout for a specific available demonstration project and an exact USD amount. Search projects first if needed. Real source organizations cannot be paid through this tool. This prepares an order only: the user must approve payment in PayPal. Never capture, approve or claim payment completion.",
      inputSchema: z.object({
        projectId: z.string().min(1).max(160),
        amount: z.string().max(12),
      }),
      execute: async (input, { toolCallId }) => {
        if (!records.some((record) => record.project?.id === input.projectId))
          throw new Error("Project unavailable in this workspace.");
        const requestId = createHash("sha256")
          .update(JSON.stringify([donor, toolCallId]))
          .digest("hex")
          .slice(0, 38);
        return createPayPalOrder({
          ...input,
          donor,
          originUrl: origin,
          requestId,
        });
      },
    }),
  };
}
