"use client";
import { useState } from "react";
import MapTools from "../map/MapTools";
import MapWindow from "../map/MapWindow";
import dynamic from "next/dynamic";
import Sidebar from "./Sidebar";
import WorkspaceHeader from "./WorkspaceHeader";
import IssueFilters from "../issues/IssueFilters";
import IssueDetails from "../issues/IssueDetails";
import SettingsDialog from "../settings/SettingsDialog";
import ContributionDialog from "../payments/ContributionDialog";
import ContributionHistory from "../payments/ContributionHistory";
import { useWorkspace } from "../../state/useWorkspace";
import styles from "./Workspace.module.css";
const GlobeCanvas = dynamic(() => import("../map/GlobeCanvas"), { ssr: false });
const StudioDashboard = dynamic(() => import("../dashboard/StudioDashboard"), {
  ssr: false,
});
const ChatDrawer = dynamic(() => import("../chat/ChatDrawer"), { ssr: false });
export default function Workspace() {
  const state = useWorkspace();
  const [fundingOpen, setFundingOpen] = useState(false),
    [projectsOpen, setProjectsOpen] = useState(false),
    [markers, setMarkers] = useState(true),
    [focusRequest, setFocusRequest] = useState(0);
  const [openedWindows, setOpenedWindows] = useState({
    funding: false,
    projects: false,
  });
  function toggleFunding() {
    setOpenedWindows((value) => ({ ...value, funding: true }));
    setFundingOpen((value) => !value);
  }
  function toggleProjects() {
    setOpenedWindows((value) => ({ ...value, projects: true }));
    setProjectsOpen((value) => !value);
  }
  function home() {
    state.setView("Explore");
    state.setSelectedId(undefined);
    state.setSettingsOpen(false);
  }
  return (
    <div className={styles.shell}>
      <Sidebar
        view={state.view}
        onView={(view) => {
          state.setView(view);
          state.setSettingsOpen(false);
          if (view === "Explore") state.setSelectedId(undefined);
        }}
        onSettings={() => state.setSettingsOpen(true)}
        open={state.navigationOpen}
        onClose={() => state.setNavigationOpen(false)}
        issues={state.records}
        selected={state.selected?.id}
        onSelect={(issue) => {
          state.setSelectedId(issue.id);
          state.setView("Explore");
          state.setSettingsOpen(false);
        }}
        query={state.filters.query}
        onQuery={(query) => state.setFilters({ ...state.filters, query })}
        settings={state.settingsOpen}
      />
      {state.settingsOpen ? (
        <SettingsDialog
          projection={state.projection}
          onProjection={state.setProjection}
          model={state.model}
          onModel={state.setModel}
          onClose={() => state.setSettingsOpen(false)}
          onNavigation={() => state.setNavigationOpen(true)}
        />
      ) : (
        <main className={styles.main}>
          <WorkspaceHeader
            view={state.view}
            onMenu={() => state.setNavigationOpen(true)}
            onChat={() => state.setChatOpen((value) => !value)}
            chatOpen={state.chatOpen}
            onHome={home}
          />
          <div className={styles.workspace}>
            <div className={styles.surface}>
              {state.view === "Contributions" ? (
                <ContributionHistory onExplore={home} />
              ) : (
                <>
                  <IssueFilters
                    filters={state.filters}
                    onChange={state.setFilters}
                    count={state.records.length}
                  />
                  <div className={styles.mapWorkspace}>
                    <GlobeCanvas
                      issues={markers ? state.records : []}
                      focusRequest={focusRequest}
                      selected={state.selected}
                      onSelect={(issue) => state.setSelectedId(issue.id)}
                      metric={state.filters.metric}
                      projection={state.projection}
                      onProjection={state.setProjection}
                    />
                    <MapTools
                      funding={fundingOpen}
                      projects={projectsOpen}
                      markers={markers}
                      metric={state.filters.metric}
                      onFunding={toggleFunding}
                      onProjects={toggleProjects}
                      onMarkers={() => setMarkers((value) => !value)}
                      onMetric={(metric) =>
                        state.setFilters({ ...state.filters, metric })
                      }
                      canFocus={Boolean(state.selected)}
                      onFocus={() => setFocusRequest((value) => value + 1)}
                    />
                    {openedWindows.funding && (
                      <MapWindow
                        title="Funding"
                        hidden={!fundingOpen}
                        onClose={() => setFundingOpen(false)}
                      >
                        <StudioDashboard
                          issues={state.records}
                          analysis={
                            state.analysis?.kind === "project-comparison"
                              ? undefined
                              : state.analysis
                          }
                          widget="funding"
                          onSelect={(issue) => state.setSelectedId(issue.id)}
                        />
                      </MapWindow>
                    )}
                    {openedWindows.projects && (
                      <MapWindow
                        title="Projects"
                        hidden={!projectsOpen}
                        offset={50}
                        onClose={() => setProjectsOpen(false)}
                      >
                        <StudioDashboard
                          issues={state.records}
                          widget="projects"
                          onSelect={(issue) => state.setSelectedId(issue.id)}
                        />
                      </MapWindow>
                    )}
                    {state.selected && (
                      <IssueDetails
                        issue={state.selected}
                        followed={state.following.includes(state.selected.id)}
                        onFollow={() => state.follow(state.selected!.id)}
                        onClose={() => state.setSelectedId(undefined)}
                        onContribute={() => state.setCheckout(state.selected)}
                        onAsk={() => state.setChatOpen(true)}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
            {state.chatOpen && (
              <ChatDrawer
                selected={state.selected}
                issues={state.records}
                model={state.model}
                onAnalysis={(analysis) => {
                  state.setAnalysis(analysis);
                  state.setView("Explore");
                  setOpenedWindows((value) => ({
                    ...value,
                    [analysis.kind === "project-comparison"
                      ? "projects"
                      : "funding"]: true,
                  }));
                  if (analysis.kind === "project-comparison")
                    setProjectsOpen(true);
                  else setFundingOpen(true);
                }}
                onSelect={(issue) => {
                  state.setSelectedId(issue.id);
                  state.setView("Explore");
                }}
                onClose={() => state.setChatOpen(false)}
              />
            )}
          </div>
        </main>
      )}
      {state.checkout && (
        <ContributionDialog
          issue={state.checkout}
          onClose={() => state.setCheckout(undefined)}
        />
      )}
      {state.error && (
        <div className={styles.error} role="alert">
          {state.error}
          <button onClick={state.retryCatalogue}>Retry</button>
          <button onClick={() => state.setError("")}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
