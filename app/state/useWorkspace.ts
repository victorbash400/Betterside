"use client";
import { useEffect, useMemo, useState } from "react";
import {
  concerns,
  defaultOverlaySettings,
  matchesConcern,
  inOverlayPeriod,
  type OverlaySettings,
} from "../lib/concerns";
import {
  defaultDiscoveryFilters,
  matchesDiscoveryFilters,
} from "../lib/discoveryFilters";
import { defaultMapView } from "../lib/mapViews";
import { defaultDatasets } from "../lib/dataSources";
import { deduplicateRecords } from "../lib/feeds/deduplicate";
import { useDiscoveryData } from "./useDiscoveryData";
import { useAppearance } from "./useAppearance";
import { matchesPin, pinCountries } from "../lib/pins";
import { useTracking } from "./useTracking";
import { useMapGeography } from "./useMapGeography";
import { overlayPoints } from "../lib/overlayData";
import { filterIssues, issueKinds } from "../lib/catalogue";
import type { Analysis } from "../lib/analysis";
import type { Filters, MapItem as Issue, View } from "../lib/types";
export function useWorkspace() {
  const tracking = useTracking();
  const appearance = useAppearance();
  const following = tracking.following;
  const [selectedInterestId, setSelectedInterestId] = useState<string>();
  const discovery = useDiscoveryData();
  const geography = useMapGeography();
  const [overlay, setOverlay] = useState<OverlaySettings>(
    defaultOverlaySettings,
  );
  const [mapViewSettings, setMapViewSettings] = useState(defaultMapView);
  const [discoveryFilters, setDiscoveryFilters] = useState(
    defaultDiscoveryFilters,
  );
  const [datasets, setDatasets] = useState(defaultDatasets);
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
  const countryChoices = useMemo(() => pinCountries(catalogue), [catalogue]);
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
  const availableRecords = useMemo(
    () =>
      filterIssues(
        view === "Following"
          ? catalogue.filter((issue) =>
              selectedInterestId
                ? Boolean(activeInterest && matchesPin(issue, activeInterest))
                : following.includes(issue.id),
            )
          : deduplicateRecords(
              catalogue.filter(
                (item) => datasets[item.dataset ?? "catalogue"] !== false,
              ),
            ),
        filters,
      ).filter(
        (item) =>
          (view === "Following" ||
            inOverlayPeriod(item, overlay.period, Date.now())) &&
          matchesDiscoveryFilters(item, discoveryFilters),
      ),
    [
      overlay.period,
      discoveryFilters,
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
  const records = useMemo(
    () =>
      availableRecords.filter(
        (item) =>
          (view === "Following" &&
            overlay.concerns.length === concerns.length) ||
          overlay.concerns.some((id) => matchesConcern(item, id)),
      ),
    [availableRecords, overlay.concerns, view],
  );
  const selected =
    records.find((issue) => issue.id === selectedId) ??
    catalogue.find((issue) => issue.id === selectedId);
  const points = useMemo(
    () =>
      overlayPoints(
        records,
        { concerns: overlay.concerns, scale: overlay.scale },
        geography.areas,
      ),
    [records, overlay.concerns, overlay.scale, geography.areas],
  );
  return {
    geography,
    points,
    appearance,
    mapViewSettings,
    setMapViewSettings,
    discoveryFilters,
    setDiscoveryFilters: (next: typeof discoveryFilters) => {
      setDiscoveryFilters({
        ...next,
        countryCode: countryChoices.find(
          (country) => country.country === next.country,
        )?.countryCode,
      });
      setSelectedId(undefined);
    },
    countries: countryChoices.map((country) => country.country),
    retryCatalogue: () => {
      if (appearance.error) {
        appearance.retry();
        return;
      }
      if (tracking.error) {
        tracking.retry();
        return;
      }
      setError("");
      discovery.refresh();
    },
    analysis,
    overlay,
    setOverlay: (next: OverlaySettings) => {
      setOverlay(next);
      setSelectedId(undefined);
    },
    activeInterest,
    collectionMode,
    setCollectionMode,
    datasets,
    setDatasets,
    dataBusy: discovery.busy,
    dataSources: discovery.sources,
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
    saveFromChat: tracking.saveFromChat,
    pinFromChat: tracking.pinFromChat,
    unpinFromChat: tracking.unpinFromChat,
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
    error: error || appearance.error || tracking.error || discovery.error,
    errorDismissible:
      !appearance.error &&
      !tracking.error &&
      !discovery.error &&
      !discovery.eventError,
    setError,
    records,
    availableRecords,
  };
}
