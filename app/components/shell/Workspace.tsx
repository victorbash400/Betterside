"use client";
import type { SettingsSection } from "../../lib/settings";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import { useOrganizations } from "../../state/useOrganizations";
import OrganizationWorkspace from "../organizations/OrganizationWorkspace";
import OrganizationToolbar from "../organizations/OrganizationToolbar";
import Sidebar from "./Sidebar";
import WorkspaceHeader from "./WorkspaceHeader";
import WorkspaceMap from "./WorkspaceMap";
import CountryOrganizations from "../issues/CountryOrganizations";
import WorkspaceToolbar from "../map/WorkspaceToolbar";
import MapTools from "../map/MapTools";
import IssueDetails from "../issues/IssueDetails";
import InterestActionDialog from "../interests/InterestActionDialog";
import AddItemsDialog from "../interests/AddItemsDialog";
import NewInterestDialog from "../interests/NewInterestDialog";
import SettingsDialog from "../settings/SettingsDialog";
import ContributionDialog from "../payments/ContributionDialog";
import { useWorkspace } from "../../state/useWorkspace";
import { interestPath } from "../../lib/interestTree";
import type { InterestAction } from "../../lib/interestActions";
import type { MapItem } from "../../lib/types";
import type { OverlaySettings } from "../../lib/concerns";
import { useOrganizationCrisisMap } from "../../state/useOrganizationCrisisMap";
import styles from "./Workspace.module.css";
const InterestContents = dynamic(
  () => import("../collections/InterestContents"),
  { ssr: false },
);
const ContributionHistory = dynamic(
  () => import("../payments/ContributionHistory"),
  { ssr: false },
);
const ChatDrawer = dynamic(() => import("../chat/ChatDrawer"), { ssr: false });
export default function Workspace() {
  const state = useWorkspace();
  const narrow = useNarrowLayout();
  const [organizationsOpen, setOrganizationsOpen] = useState(false);
  const [requestedCausesOpen, setCausesOpen] = useState<boolean>();
  const causesOpen = requestedCausesOpen ?? !narrow;
  const [chatContext, setChatContext] = useState<MapItem>();
  const organizations = useOrganizations(
    state.view === "Organizations",
    state.filters.query,
  );
  const crisis = useOrganizationCrisisMap({
    enabled: state.view === "Organizations",
    records: state.allRecords,
    organizations: organizations.visible,
    selected: organizations.organization,
    country: organizations.countryCode,
    topics: organizations.filters.topics,
    geography: state.geography.areas,
    datasets: state.datasets,
    overlay: state.overlay,
  });
  function changeOrganizationOverlay(next: OverlaySettings) {
    state.setOverlay({ ...next, concerns: state.overlay.concerns });
  }
  function updateOrganizations(next: typeof organizations.filters) {
    organizations.update(next);
    state.setSelectedId(undefined);
  }
  function selectOrganization(id?: string) {
    organizations.select(id);
    state.setSelectedId(undefined);
  }
  const [organizationCountry, setOrganizationCountry] = useState<{
    code: string;
    country: string;
  }>();
  const organizationCode = state.allRecords.find(
    (item) =>
      item.country === state.discoveryFilters.country && item.reportingArea,
  )?.reportingArea?.countryCode;
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection>("appearance");
  const [action, setAction] = useState<InterestAction | null>(null),
    [adding, setAdding] = useState(false),
    [creating, setCreating] = useState(false);
  function home() {
    if (state.view === "Organizations") {
      state.setFilters({ ...state.filters, query: "" });
    }
    state.setView("Explore");
    state.setCollectionMode("map");
    state.setSelectedId(undefined);
    state.setSelectedInterestId(undefined);
    state.setSettingsOpen(false);
  }
  function following() {
    if (state.view === "Organizations") {
      state.setFilters({ ...state.filters, query: "" });
    }
    state.setView("Following");
    state.setCollectionMode("list");
    state.setSelectedId(undefined);
    state.setSelectedInterestId(undefined);
    state.setSettingsOpen(false);
  }
  function openInterest(id: string) {
    if (state.view === "Organizations") {
      state.setFilters({ ...state.filters, query: "" });
    }
    state.setSelectedInterestId(id);
    state.setSelectedId(undefined);
    state.setView("Following");
    state.setCollectionMode("list");
    state.setSettingsOpen(false);
  }
  function select(item: MapItem) {
    setChatContext(undefined);
    state.setSelectedId(item.id);
    state.setSettingsOpen(false);
  }
  function openChat(item = state.selected) {
    setChatContext(item);
    state.setSelectedId(undefined);
    state.setChatOpen(true);
  }
  function closeChat() {
    state.setChatOpen(false);
    setChatContext(undefined);
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
      openChat(next.item);
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
  return (
    <div className={styles.shell}>
      <Sidebar
        view={state.view}
        organizationsOpen={
          state.view === "Organizations" &&
          state.collectionMode === "map" &&
          organizationsOpen &&
          !state.settingsOpen
        }
        causesOpen={
          state.view !== "Contributions" && causesOpen && !state.settingsOpen
        }
        onToggleOrganizations={() => {
          if (
            state.view === "Organizations" &&
            state.collectionMode === "map"
          ) {
            setOrganizationsOpen((open) => !open);
          } else {
            state.setView("Organizations");
            state.setCollectionMode("map");
            state.setSelectedId(undefined);
            state.setSelectedInterestId(undefined);
            state.setSettingsOpen(false);
            setOrganizationsOpen(true);
          }
        }}
        onToggleCauses={() => {
          if (state.view === "Contributions") {
            home();
            setCausesOpen(true);
          } else setCausesOpen(!causesOpen);
        }}
        onView={(view) => {
          if (view === "Explore") home();
          else if (view === "Following") following();
          else {
            state.setView(view);
            state.setSelectedInterestId(undefined);
            state.setFilters({ ...state.filters, query: "" });
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
        query={state.filters.query}
        onQuery={(query) => state.setFilters({ ...state.filters, query })}
        settings={state.settingsOpen}
        settingsSection={settingsSection}
        onSettingsSection={setSettingsSection}
      />
      {state.settingsOpen ? (
        <SettingsDialog
          section={settingsSection}
          appearance={state.appearance.value}
          onAppearance={state.appearance.update}
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
            onChat={() => (state.chatOpen ? closeChat() : openChat())}
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
            onRefresh={
              state.view === "Organizations"
                ? organizations.refresh
                : state.refreshData
            }
            busy={
              state.view === "Organizations"
                ? organizations.busy
                : state.dataBusy
            }
          >
            {state.view === "Organizations" && (
              <OrganizationToolbar
                selected={organizations.organization}
                overlay={crisis.overlay}
                onOverlay={changeOrganizationOverlay}
                datasets={state.datasets}
                onDatasets={state.setDatasets}
                crisisSources={state.dataSources}
                crisisError={state.dataError}
                crisisBusy={state.dataBusy}
                onRefreshCrisis={state.refreshData}
                mapView={state.mapViewSettings}
                onMapView={state.setMapViewSettings}
                showMap={state.collectionMode === "map"}
                filters={organizations.filters}
                onChange={updateOrganizations}
                countries={organizations.countries.map(
                  (country) => country.name,
                )}
                organizations={organizations.data?.organizations ?? []}
                sources={organizations.data?.sources ?? []}
              />
            )}
            {state.view !== "Contributions" &&
              state.view !== "Organizations" && (
                <WorkspaceToolbar
                  overlay={state.overlay}
                  onOverlay={state.setOverlay}
                  filters={state.discoveryFilters}
                  onFilters={(value) => {
                    state.setDiscoveryFilters(value);
                    setOrganizationCountry(undefined);
                  }}
                  countries={state.countries}
                  mapView={state.mapViewSettings}
                  onMapView={state.setMapViewSettings}
                  showMap={state.collectionMode === "map"}
                  showSources={state.view === "Explore"}
                  datasets={state.datasets}
                  onDatasets={state.setDatasets}
                  sources={state.dataSources}
                  error={state.dataError}
                  busy={state.dataBusy}
                  onRefresh={state.refreshData}
                  onOrganizations={
                    organizationCode
                      ? () =>
                          setOrganizationCountry({
                            code: organizationCode,
                            country: state.discoveryFilters.country,
                          })
                      : undefined
                  }
                  onAdd={
                    state.activeInterest
                      ? () =>
                          setAction({
                            kind: "add",
                            interest: state.activeInterest!,
                          })
                      : undefined
                  }
                />
              )}
          </WorkspaceHeader>
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
              ) : (
                <div className={styles.discoveryContent}>
                  {state.collectionMode === "list" ? (
                    state.view === "Organizations" ? null : (
                      <InterestContents
                        discovery={state.view === "Explore"}
                        interest={state.activeInterest}
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
                    )
                  ) : (
                    <>
                      <WorkspaceMap
                        geography={state.geography}
                        points={
                          state.view === "Organizations"
                            ? crisis.points
                            : state.points
                        }
                        overlay={
                          state.view === "Organizations"
                            ? crisis.overlay
                            : state.overlay
                        }
                        country={
                          state.view === "Organizations"
                            ? organizations.organization
                              ? ""
                              : organizations.filters.country
                            : state.discoveryFilters.country
                        }
                        countryCode={
                          state.view === "Organizations"
                            ? organizations.organization
                              ? undefined
                              : organizations.countryCode
                            : organizationCode
                        }
                        focusAreas={
                          state.view === "Organizations"
                            ? crisis.focusAreas
                            : undefined
                        }
                        mapViewSettings={state.mapViewSettings}
                        items={
                          state.view === "Organizations"
                            ? crisis.items
                            : state.records
                        }
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
                  {state.view === "Organizations" ? (
                    <OrganizationWorkspace
                      state={{
                        ...organizations,
                        update: updateOrganizations,
                        select: selectOrganization,
                      }}
                      geography={state.geography}
                      crisis={crisis}
                      onOverlay={changeOrganizationOverlay}
                      query={state.filters.query}
                      onQuery={(query) =>
                        state.setFilters({ ...state.filters, query })
                      }
                      mode={state.collectionMode}
                      onMode={state.setCollectionMode}
                      organizationsOpen={organizationsOpen}
                      causesOpen={causesOpen}
                    />
                  ) : (
                    <MapTools
                      open={causesOpen}
                      geography={state.geography.areas}
                      value={state.overlay}
                      items={state.availableRecords}
                      mapView={state.collectionMode === "map"}
                      onChange={state.setOverlay}
                    />
                  )}

                  {organizationCountry && (
                    <CountryOrganizations
                      {...organizationCountry}
                      onClose={() => setOrganizationCountry(undefined)}
                    />
                  )}
                </div>
              )}
              {state.selected &&
                state.view !== "Contributions" &&
                (state.view !== "Organizations" ||
                  crisis.items.some(
                    (item) => item.id === state.selected?.id,
                  )) && (
                  <IssueDetails
                    issue={state.selected}
                    onClose={() => state.setSelectedId(undefined)}
                    onContribute={() => state.setCheckout(state.selected)}
                  />
                )}
            </div>
            {state.chatOpen && (
              <ChatDrawer
                selected={chatContext ?? state.selected}
                issues={
                  state.view === "Organizations" ? crisis.items : state.records
                }
                model={state.model}
                onAnalysis={(analysis) => {
                  state.setAnalysis(analysis);
                  state.setCollectionMode("map");
                }}
                onSelect={setChatContext}
                onClose={closeChat}
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
