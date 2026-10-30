import { z } from "zod";
import { chatRecordSchema } from "../lib/chatWorkspace";
import type { ChatWorkspaceActions } from "../lib/chatWorkspace";
import {
  checkoutInputSchema,
  type CheckoutInput,
  mapFilterSchema,
  saveRecordsSchema,
  focusOrganizationSchema,
} from "../lib/chatWorkspace";
import { defaultDiscoveryFilters } from "../lib/discoveryFilters";
import { issueKinds } from "../lib/issueKinds";
import { matchesConcern, inOverlayPeriod } from "../lib/concerns";
import type { useWorkspace } from "./useWorkspace";
import type { useOrganizations } from "./useOrganizations";

export function useChatWorkspaceActions(
  state: ReturnType<typeof useWorkspace>,
  organizations: ReturnType<typeof useOrganizations>,
  onOrganizationDrawer: () => void,
  onCheckout: (input: CheckoutInput) => void,
): ChatWorkspaceActions {
  return {
    openCheckout: async (raw) => {
      const input = checkoutInputSchema.parse(raw);
      if (
        input.projectId &&
        !state.allRecords.some(
          (record) => record.project?.id === input.projectId,
        )
      )
        throw new Error("Project unavailable. Search demonstration projects.");
      onCheckout(input);
      return { kind: "checkout", ...input };
    },
    filterMap: async (raw) => {
      const input = mapFilterSchema.parse(raw);
      const country = input.country
        ? state.countries.find(
            (name) =>
              name.toLocaleLowerCase() === input.country.toLocaleLowerCase(),
          )
        : "";
      if (country === undefined)
        throw new Error(
          "Country unavailable. Use a country returned by search.",
        );
      state.setView("Explore");
      state.setCollectionMode("map");
      state.setSelectedId(undefined);
      state.setFilters({ ...state.filters, query: "", kinds: [...issueKinds] });
      state.setDiscoveryFilters({ ...defaultDiscoveryFilters, country });
      state.setOverlay({
        ...state.overlay,
        concerns: input.causes,
        mode: input.mode,
      });
      const count = state.allRecords.filter(
        (record) =>
          (!country || record.country === country) &&
          state.datasets[record.dataset ?? "catalogue"] !== false &&
          inOverlayPeriod(record, state.overlay.period, Date.now()) &&
          input.causes.some((id) => matchesConcern(record, id)),
      ).length;
      return { kind: "map", ...input, country, count };
    },
    saveRecords: async (raw, callId) => {
      const input = saveRecordsSchema.parse(raw);
      const response = await fetch("/api/chat/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordIds: input.recordIds }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(z.object({ error: z.string() }).parse(body).error);
      const { records } = z
        .object({ records: z.array(chatRecordSchema) })
        .parse(body);
      return state.saveFromChat(records, input, callId);
    },
    focusOrganization: async (raw) => {
      const input = focusOrganizationSchema.parse(raw);
      const org = await organizations.focus(input.organizationId, input.topics);
      state.setFilters({ ...state.filters, query: "" });
      state.setView("Organizations");
      state.setCollectionMode("map");
      state.setSelectedId(undefined);
      onOrganizationDrawer();
      return {
        kind: "organization-focus",
        name: org.name,
        topics: input.topics,
      };
    },
  };
}
