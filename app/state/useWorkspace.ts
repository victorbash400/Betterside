"use client";
import { useEffect, useMemo, useState } from "react";
import { useTracking } from "./useTracking";
import { filterIssues } from "../lib/catalogue";
import type { Analysis } from "../lib/analysis";
import type { Filters, Issue, View } from "../lib/types";
export function useWorkspace() {
  const tracking = useTracking();
  const following = tracking.following;
  const [selectedInterestId, setSelectedInterestId] = useState<string>();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis>();
  const [catalogue, setCatalogue] = useState<Issue[]>([]);
  const [view, setView] = useState<View>("Explore"),
    [filters, setFilters] = useState<Filters>({
      query: "",
      kinds: [],
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
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/catalogue", {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error ?? "Could not load funding records.");
        setCatalogue(data.issues);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setError("Could not load funding records.");
      }
    }
    void load();
    return () => controller.abort();
  }, [loadAttempt]);
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
          : catalogue,
        filters,
      ),
    [
      catalogue,
      filters,
      following,
      view,
      selectedInterestId,
      tracking.interests,
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
      setLoadAttempt((value) => value + 1);
    },
    analysis,
    setAnalysis,
    view,
    setView,
    filters,
    setFilters,
    selected,
    setSelectedId,
    following,
    interests: tracking.interests,
    track: tracking.track,
    untrack: tracking.untrack,
    createInterest: tracking.create,
    selectedInterestId,
    setSelectedInterestId,
    sidebarIssues: filterIssues(catalogue, filters),
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
    error: error || tracking.error,
    errorDismissible: !tracking.error,
    setError,
    records,
  };
}
