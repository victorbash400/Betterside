import { pinItemsSchema, unpinItemsSchema } from "../lib/chatPins";
import { fetchOrganizationDirectory } from "./useOrganizationDirectory";
import { fetchChatRecords } from "./fetchChatRecords";
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
import { concerns, matchesConcern, inOverlayPeriod } from "../lib/concerns";
import type { useWorkspace } from "./useWorkspace";
import type { useOrganizations } from "./useOrganizations";

export function useChatWorkspaceActions(
  state: ReturnType<typeof useWorkspace>,
  organizations: ReturnType<typeof useOrganizations>,
  onOrganizationDrawer: () => void,
  onCheckout: (input: CheckoutInput) => void,
): ChatWorkspaceActions {
  return {
    isPinned: (id) => state.interests.some((pin) => pin.id === id) || state.following.includes(id),
    pinItems: async (raw, callId) => {
      const input = pinItemsSchema.parse(raw);
      const targets = input.targets.filter((target) => target.kind === "organization");
      const directories = await Promise.all([...new Set(targets.map((target) => target.countryCode))]
        .map((country) => fetchOrganizationDirectory(country)));
      const missing = input.targets.filter((target) => target.kind === "record")
        .map((target) => target.recordId).filter((id) => !state.allRecords.some((record) => record.id === id));
      const records = missing.length ? [...state.allRecords, ...await fetchChatRecords(fetch, missing)] : state.allRecords;
      return state.pinFromChat(records, input, callId, directories.flatMap((directory) => directory.value.organizations));
    },
    unpinItems: async (raw) => state.unpinFromChat(state.allRecords, unpinItemsSchema.parse(raw)),
    openPin: async (id) => {
      state.setSettingsOpen(false);
      state.setSelectedId(undefined);
      const pin = state.interests.find((pin) => pin.id === id);
      if (pin?.target?.kind === "organization") {
        await organizations.focus(pin.target.organizationId, undefined, pin.target.countryCode);
        state.setSelectedInterestId(id);
        state.setView("Organizations");
        state.setCollectionMode("map");
        onOrganizationDrawer();
      } else if (pin) {
        state.setSelectedInterestId(id);
        state.setView("Following");
        state.setCollectionMode("list");
        state.setOverlay({ ...state.overlay, concerns: pin.target?.kind === "scope" || pin.target?.kind === "cause"
          ? [pin.target.concern] : concerns.map((cause) => cause.id) });
        state.setDiscoveryFilters(defaultDiscoveryFilters);
        state.setFilters({ ...state.filters, query: "", kinds: [...issueKinds] });
      } else {
        if (!state.following.includes(id)) throw new Error("Pin unavailable. Read list_pins again.");
        state.setSelectedInterestId(undefined);
        state.setDiscoveryFilters(defaultDiscoveryFilters);
        state.setFilters({ ...state.filters, query: "", kinds: [...issueKinds] });
        state.setOverlay({ ...state.overlay, concerns: concerns.map((cause) => cause.id) });
        state.setView("Following");
        state.setCollectionMode("list");
        state.setSelectedId(id);
      }
    },
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
      const records = await fetchChatRecords(fetch, input.recordIds);
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
