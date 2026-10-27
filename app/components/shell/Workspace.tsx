"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./Sidebar";
import WorkspaceHeader from "./WorkspaceHeader";
import WorkspaceMap from "./WorkspaceMap";
import IssueDetails from "../issues/IssueDetails";
import DataSourcesControl from "../map/DataSourcesControl";
import InterestContents from "../collections/InterestContents";
import InterestActionDialog from "../interests/InterestActionDialog";
import AddItemsDialog from "../interests/AddItemsDialog";
import NewInterestDialog from "../interests/NewInterestDialog";
import SettingsDialog from "../settings/SettingsDialog";
import ContributionDialog from "../payments/ContributionDialog";
import ContributionHistory from "../payments/ContributionHistory";
import { useWorkspace } from "../../state/useWorkspace";
import { issueKinds } from "../../lib/catalogue";
import { interestPath } from "../../lib/interestTree";
import type { InterestAction } from "../../lib/interestActions";
import type { MapItem } from "../../lib/types";
import styles from "./Workspace.module.css";
const ChatDrawer = dynamic(() => import("../chat/ChatDrawer"), { ssr: false });
export default function Workspace() {
  const state = useWorkspace();
  const [action, setAction] = useState<InterestAction | null>(null),
    [adding, setAdding] = useState(false),
    [creating, setCreating] = useState(false);
  function home() {
    state.setView("Explore");
    state.setCollectionMode("map");
    state.setSelectedId(undefined);
    state.setSelectedInterestId(undefined);
    state.setSettingsOpen(false);
  }
  function following() {
    state.setView("Following");
    state.setCollectionMode("list");
    state.setSelectedId(undefined);
    state.setSelectedInterestId(undefined);
    state.setSettingsOpen(false);
  }
  function openInterest(id: string) {
    state.setSelectedInterestId(id);
    state.setSelectedId(undefined);
    state.setView("Following");
    state.setCollectionMode("list");
    state.setSettingsOpen(false);
  }
  function select(item: MapItem) {
    state.setSelectedId(item.id);
    state.setSettingsOpen(false);
  }
  function handleAction(next: InterestAction) {
    if (next.kind === "open-item") {
      select(next.item);
      return;
    }
    if (next.kind === "map-item") {
      select(next.item);
      state.setCollectionMode("map");
      if (state.view === "Contributions") state.setView("Explore");
      return;
    }
    if (next.kind === "chat-item") {
      select(next.item);
      state.setChatOpen(true);
      return;
    }
    if (next.kind === "remove-item") {
      if (next.interestId) state.track(next.item.id);
      else state.untrack(next.item.id);
      return;
    }
    if (next.kind === "chat") {
      openInterest(next.interest.id);
      state.setChatOpen(true);
      return;
    }
    setAction(next);
  }
  const path = interestPath(
    state.interests,
    state.view === "Following" ? state.selectedInterestId : undefined,
  );
  const collectionFilters = {
    ...state.filters,
    kinds: state.activeInterest
      ? issueKinds.filter(
          (kind) => !state.activeInterest!.hiddenKinds.includes(kind),
        )
      : state.filters.kinds,
  };
  function onFilters(filters: typeof state.filters) {
    if (state.activeInterest) {
      state.filterInterest(state.activeInterest.id, filters.kinds);
      state.setFilters({ ...state.filters, query: filters.query });
    } else state.setFilters(filters);
  }
  return (
    <div className={styles.shell}>
      <Sidebar
        view={state.view}
        onView={(view) => {
          if (view === "Explore") home();
          else if (view === "Following") following();
          else {
            state.setView(view);
            state.setSelectedId(undefined);
            state.setSettingsOpen(false);
          }
        }}
        onSettings={() => state.setSettingsOpen(true)}
        open={state.navigationOpen}
        onClose={() => state.setNavigationOpen(false)}
        issues={state.allRecords}
        interests={state.interests}
        trackingReady={state.trackingReady}
        following={state.following}
        activeInterestId={state.selectedInterestId}
        onInterest={openInterest}
        onCreateInterest={(choice) =>
          state.createInterest(choice.name, undefined, choice.categoryId)
        }
        onInterestAction={handleAction}
        onTrack={state.track}
        selected={state.selected?.id}
        onSelect={select}
        issueKinds={collectionFilters.kinds}
        onIssueKinds={(kinds) => onFilters({ ...collectionFilters, kinds })}
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
            path={path}
            onMenu={() => state.setNavigationOpen(true)}
            onChat={() => state.setChatOpen((value) => !value)}
            chatOpen={state.chatOpen}
            onHome={home}
            onBack={() => {
              const parent = path.at(-2);
              if (parent) openInterest(parent.id);
              else if (path.length) following();
              else home();
            }}
            onFollowing={following}
            onInterest={openInterest}
            mode={state.collectionMode}
            onMode={state.setCollectionMode}
            onCreate={() => setCreating(true)}
            onRefresh={state.refreshData}
            busy={state.dataBusy}
          />
          <div className={styles.workspace}>
            <div className={styles.surface}>
              {state.view === "Contributions" ? (
                <ContributionHistory
                  onExplore={home}
                  onProject={(projectId) => {
                    const item = state.allRecords.find(
                      (item) => item.project?.id === projectId,
                    );
                    home();
                    if (item) select(item);
                  }}
                />
              ) : state.collectionMode === "list" ? (
                <InterestContents
                  discovery={state.view === "Explore"}
                  interest={state.activeInterest}
                  interests={state.interests}
                  items={state.records}
                  onAdd={() =>
                    state.activeInterest
                      ? setAction({
                          kind: "add",
                          interest: state.activeInterest,
                        })
                      : setAdding(true)
                  }
                  onSelect={select}
                  onAction={handleAction}
                  canEdit={state.trackingReady}
                />
              ) : (
                <>
                  <div className={styles.dataToolbar}>
                    <DataSourcesControl
                      value={state.datasets}
                      onChange={state.setDatasets}
                      error={state.dataError}
                      busy={state.dataBusy}
                      onRefresh={state.refreshData}
                    />
                    <span className={styles.recordCount}>
                      {state.records.length} records
                    </span>
                    {state.activeInterest && (
                      <button
                        className={styles.addItems}
                        onClick={() =>
                          setAction({
                            kind: "add",
                            interest: state.activeInterest!,
                          })
                        }
                      >
                        Add items
                      </button>
                    )}
                  </div>
                  <WorkspaceMap
                    items={state.records}
                    selected={state.selected}
                    onSelect={select}
                    metric={state.filters.metric}
                    onMetric={(metric) =>
                      state.setFilters({ ...state.filters, metric })
                    }
                    projection={state.projection}
                    onProjection={state.setProjection}
                    analysis={state.analysis}
                  />
                </>
              )}
              {state.selected && state.view !== "Contributions" && (
                <IssueDetails
                  issue={state.selected}
                  followed={state.following.includes(state.selected.id)}
                  interests={state.interests}
                  trackingReady={state.trackingReady}
                  onTrack={(interestId) =>
                    state.track(state.selected!.id, interestId)
                  }
                  onUntrack={() => state.untrack(state.selected!.id)}
                  onCreateInterest={(choice) => {
                    const id = state.createInterest(
                      choice.name,
                      state.selected!.id,
                      choice.categoryId,
                    );
                    state.track(state.selected!.id, id);
                  }}
                  onClose={() => state.setSelectedId(undefined)}
                  onContribute={() => state.setCheckout(state.selected)}
                  onAsk={() => state.setChatOpen(true)}
                />
              )}
            </div>
            {state.chatOpen && (
              <ChatDrawer
                selected={state.selected}
                issues={state.records}
                model={state.model}
                onAnalysis={(analysis) => {
                  state.setAnalysis(analysis);
                  state.setCollectionMode("map");
                }}
                onSelect={select}
                onClose={() => state.setChatOpen(false)}
              />
            )}
          </div>
        </main>
      )}
      {state.checkout?.project && (
        <ContributionDialog
          issue={{ ...state.checkout, project: state.checkout.project }}
          onClose={() => state.setCheckout(undefined)}
        />
      )}
      {action && (
        <InterestActionDialog
          action={action}
          interests={state.interests}
          items={state.allRecords}
          onClose={() => setAction(null)}
          onAdd={state.addItems}
          onCreate={(choice, parentId) =>
            state.createInterest(
              choice.name,
              undefined,
              choice.categoryId,
              parentId,
            )
          }
          onRename={state.renameInterest}
          onArchive={(id) => {
            state.archiveInterest(id);
            if (path.some((item) => item.id === id)) following();
          }}
          onMoveFolder={state.moveInterest}
          onMoveItem={state.track}
        />
      )}
      {adding && (
        <AddItemsDialog
          items={state.allRecords}
          onClose={() => setAdding(false)}
          onAdd={(items) => {
            state.addItems(items);
            setAdding(false);
          }}
        />
      )}
      {creating && (
        <NewInterestDialog
          interests={state.interests}
          onClose={() => setCreating(false)}
          onCreate={(choice) => {
            state.createInterest(choice.name, undefined, choice.categoryId);
            setCreating(false);
          }}
        />
      )}
      {state.error && (
        <div className={styles.error} role="alert">
          {state.error}
          <button onClick={state.retryCatalogue}>Retry</button>
          {state.errorDismissible && (
            <button onClick={() => state.setError("")}>Dismiss</button>
          )}
        </div>
      )}
    </div>
  );
}
