"use client";
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
  return (
    <main className={styles.shell}>
      <Sidebar
        view={state.view}
        onView={state.setView}
        onChat={() => state.setChatOpen(true)}
        onSettings={() => state.setSettingsOpen(true)}
        open={state.navigationOpen}
        onClose={() => state.setNavigationOpen(false)}
      />
      <div className={styles.main}>
        <WorkspaceHeader
          view={state.view}
          onMenu={() => state.setNavigationOpen(true)}
          chatOpen={state.chatOpen}
          onChat={() => state.setChatOpen((value) => !value)}
          onSettings={() => state.setSettingsOpen(true)}
        />
        <div className={styles.workspace}>
          <div className={styles.surface}>
            {state.view === "Contributions" ? (
              <ContributionHistory onExplore={() => state.setView("Explore")} />
            ) : (
              <>
                <IssueFilters
                  filters={state.filters}
                  onChange={state.setFilters}
                  count={state.records.length}
                />
                {state.view === "Dashboard" ? (
                  <StudioDashboard
                    issues={state.records}
                    analysis={state.analysis}
                    onSelect={issue=>{state.setSelectedId(issue.id);state.setView("Explore");}}
                  />
                ) : (
                  <div className={styles.mapWorkspace}>
                    <GlobeCanvas
                      issues={state.records}
                      selected={state.selected}
                      onSelect={(issue) => state.setSelectedId(issue.id)}
                      metric={state.filters.metric}
                      onMetric={(metric) =>
                        state.setFilters({ ...state.filters, metric })
                      }
                      projection={state.projection}
                      onProjection={state.setProjection}
                    />
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
                )}
              </>
            )}
          </div>
          {state.chatOpen && (
            <ChatDrawer
              selected={state.selected}
              model={state.model}
              onAnalysis={(analysis) => {
                state.setAnalysis(analysis);
                state.setView("Dashboard");
              }}
              onClose={() => state.setChatOpen(false)}
            />
          )}
        </div>
      </div>
      {state.settingsOpen && (
        <SettingsDialog
          projection={state.projection}
          onProjection={state.setProjection}
          model={state.model}
          onModel={state.setModel}
          onClose={() => state.setSettingsOpen(false)}
        />
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
    </main>
  );
}
