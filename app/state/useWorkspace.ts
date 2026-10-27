"use client";
import { useEffect, useMemo, useState } from "react";
import { useDiscoveryData } from "./useDiscoveryData";
import { useTracking } from "./useTracking";
import { filterIssues, issueKinds } from "../lib/catalogue";
import type { Analysis } from "../lib/analysis";
import type { Filters, MapItem as Issue, View } from "../lib/types";
export function useWorkspace() {
  const tracking = useTracking();
  const following = tracking.following;
  const [selectedInterestId, setSelectedInterestId] = useState<string>();
  const discovery = useDiscoveryData();
  const [datasets, setDatasets] = useState({ catalogue: true, eonet: true });
  const [collectionMode, setCollectionMode] = useState<"list" | "map">("map");
  const [analysis, setAnalysis] = useState<Analysis>();
  const catalogue = useMemo(
    () =>
      Array.from(
        new Map(
          [
            ...tracking.savedItems,
            ...discovery.catalogue,
            ...discovery.events,
          ].map((item) => [item.id, item]),
        ).values(),
      ),
    [tracking.savedItems, discovery.catalogue, discovery.events],
  );
  const [view, setView] = useState<View>("Explore"),
    [filters, setFilters] = useState<Filters>({
      query: "",
      kinds: [...issueKinds],
      metric: "Severity",
    }),
    [selectedId, setSelectedId] = useState<string>(),
    [projection, setProjection] = useState<"globe" | "mercator">("globe"),
    [model, setModel] = useState<"fast" | "reasoning">("fast");
  const [chatOpen, setChatOpen] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false),
    [navigationOpen, setNavigationOpen] = useState(false),
    [checkout, setCheckout] = useState<Issue>(),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const savedModel = localStorage.getItem("betterside-model");
      if (savedModel === "fast" || savedModel === "reasoning")
        setModel(savedModel);
    } catch {
      setError("Could not restore saved preferences.");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("betterside-model", model);
    } catch {
      setError("Could not save preferences.");
    }
  }, [model, loaded]);
  const activeInterest = tracking.interests.find(
    (item) => item.id === selectedInterestId,
  );
  const records = useMemo(
    () =>
      filterIssues(
        view === "Following"
          ? catalogue.filter((issue) =>
              selectedInterestId
                ? tracking.interests
                    .find((interest) => interest.id === selectedInterestId)
                    ?.issueIds.includes(issue.id)
                : following.includes(issue.id),
            )
          : catalogue.filter((item) =>
              item.dataset === "eonet" ? datasets.eonet : datasets.catalogue,
            ),
        {
          ...filters,
          kinds:
            view === "Following" && activeInterest
              ? issueKinds.filter(
                  (kind) => !activeInterest.hiddenKinds.includes(kind),
                )
              : filters.kinds,
        },
      ),
    [
      catalogue,
      filters,
      following,
      view,
      selectedInterestId,
      tracking.interests,
      activeInterest,
      datasets,
    ],
  );
  const selected = catalogue.find((issue) => issue.id === selectedId);
  return {
    retryCatalogue: () => {
      if (tracking.error) {
        tracking.retry();
        return;
      }
      setError("");
      discovery.refresh();
    },
    analysis,
    activeInterest,
    collectionMode,
    setCollectionMode,
    datasets,
    setDatasets,
    dataBusy: discovery.busy,
    dataError: discovery.eventError,
    refreshData: discovery.refresh,
    allRecords: catalogue,
    setAnalysis,
    view,
    setView,
    filters,
    setFilters,
    selected,
    setSelectedId,
    following,
    interests: tracking.interests.filter((item) => !item.archived),
    trackingReady: tracking.ready && !tracking.error,
    track: (id: string, interestId?: string) =>
      tracking.track(
        id,
        interestId,
        catalogue.find((item) => item.id === id),
      ),
    addItems: tracking.addMany,
    renameInterest: tracking.rename,
    moveInterest: tracking.moveFolder,
    archiveInterest: tracking.archive,
    filterInterest: tracking.filter,
    untrack: tracking.untrack,
    createInterest: tracking.create,
    selectedInterestId,
    setSelectedInterestId,
    projection,
    setProjection,
    model,
    setModel,
    chatOpen,
    setChatOpen,
    settingsOpen,
    setSettingsOpen,
    navigationOpen,
    setNavigationOpen,
    checkout,
    setCheckout,
    error:
      error ||
      tracking.error ||
      discovery.error ||
      (collectionMode === "list" ? discovery.eventError : ""),
    errorDismissible:
      !tracking.error && !discovery.error && !discovery.eventError,
    setError,
    records,
  };
}
