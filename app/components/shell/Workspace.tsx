"use client";
import LoadingRegion from "../controls/LoadingRegion";
import ChatDrawerLoading from "../chat/ChatDrawerLoading";
import type { CheckoutInput } from "../../lib/chatWorkspace";
import type { SettingsSection } from "../../lib/settings";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useChatWorkspaceActions } from "../../state/useChatWorkspaceActions";
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
import CollectionInsights from "../collections/CollectionInsights";
import PinnedCompareDialog from "../interests/PinnedCompareDialog";
import ScopeDetails, { type ScopeSelection } from "../issues/ScopeDetails";
import type { PinTarget } from "../../lib/tracking";
import InterestActionDialog from "../interests/InterestActionDialog";
import AddItemsDialog from "../interests/AddItemsDialog";
import NewInterestDialog from "../interests/NewInterestDialog";
import SettingsDialog from "../settings/SettingsDialog";
import ContributionsModal from "../payments/ContributionsModal";
import GoalsModal from "../profile/GoalsModal";
import ContributionDialog from "../payments/ContributionDialog";
import { useWorkspace } from "../../state/useWorkspace";
import { issueKinds } from "../../lib/catalogue";
import { interestPath } from "../../lib/interestTree";
import type { InterestAction } from "../../lib/interestActions";
import type { MapItem } from "../../lib/types";
import { concerns, type OverlaySettings } from "../../lib/concerns";
import { defaultDiscoveryFilters } from "../../lib/discoveryFilters";
import { useOrganizationCrisisMap } from "../../state/useOrganizationCrisisMap";
import styles from "./Workspace.module.css";
const InterestContents = dynamic(
  () => import("../collections/InterestContents"),
  { ssr: false, loading: () => <LoadingRegion label="Loading table" /> },
);
const ChatDrawer = dynamic(() => import("../chat/ChatDrawer"), {
  ssr: false,
  loading: () => <ChatDrawerLoading />,
});
export default function Workspace() {
  const state = useWorkspace();
  const [scopeDetails, setScopeDetails] = useState<ScopeSelection>();
  const [comparingPins, setComparingPins] = useState(false);
  function pinScope(name: string, target: PinTarget) {
    state.createInterest(name, undefined, undefined, undefined, target);
  }
  const [chatCheckout, setChatCheckout] = useState<CheckoutInput>();
  const [contributionsOpen, setContributionsOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  useEffect(() => {
    if (new URL(window.location.href).searchParams.get("goals") === "1") setGoalsOpen(true);
  }, []);
  const narrow = useNarrowLayout();
  const [organizationsOpen, setOrganizationsOpen] = useState(false);
  const [requestedCausesOpen, setCausesOpen] = useState<boolean>();
  const causesOpen = requestedCausesOpen ?? !narrow;
  const [chatContext, setChatContext] = useState<MapItem>();
  const organizations = useOrganizations(
    state.view === "Organizations",
    state.filters.query,
  );
  const chatActions = useChatWorkspaceActions(
    state,
    organizations,
    () => setOrganizationsOpen(true),
    setChatCheckout,
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
  const organizationCode = (state.activeInterest?.target?.kind === "country" || state.activeInterest?.target?.kind === "scope") && state.view === "Following"
    ? state.activeInterest.target.countryCode : state.allRecords.find(
    (item) =>
      item.country === state.discoveryFilters.country && item.reportingArea,
  )?.reportingArea?.countryCode;
  const scopedCountryName=state.discoveryFilters.country || ((state.activeInterest?.target?.kind==="country" || state.activeInterest?.target?.kind==="scope") ? state.activeInterest.target.country : "");
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection>("appearance");
  useEffect(() => {
    if (
      new URL(window.location.href).searchParams.get("profile") === "payments"
    ) {
      setSettingsSection("paypal");
      state.setSettingsOpen(true);
    }
  }, [state.setSettingsOpen]);
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
    state.setOverlay({ ...state.overlay, concerns: concerns.map((cause) => cause.id) });
    state.setDiscoveryFilters(defaultDiscoveryFilters);
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
    const pin = state.interests.find((item) => item.id === id);
    if (pin?.target?.kind === "organization") {
      state.setError("");
      void organizations.focus(pin.target.organizationId,undefined,pin.target.countryCode).then(() => {
        state.setView("Organizations");
        state.setFilters({...state.filters, query:""});
        state.setSelectedInterestId(id);
        state.setSelectedId(undefined);
        state.setCollectionMode("map");
        state.setSettingsOpen(false);
        setOrganizationsOpen(true);
      }).catch((error) => state.setError(error instanceof Error ? error.message : "Organization unavailable."));
      return;
    }
    state.setOverlay({ ...state.overlay, concerns: pin?.target?.kind === "cause" || pin?.target?.kind === "scope"
      ? [pin.target.concern] : concerns.map((cause) => cause.id) });
    state.setDiscoveryFilters(defaultDiscoveryFilters);
    state.setFilters({ ...state.filters, query: "", kinds: [...issueKinds] });
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
    if (next.kind === "pin-item") {
      state.track(next.item.id);
      return;
    }
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
    if (next.kind === "archive" && next.interest.target) {
      state.archiveInterest(next.interest.id);
      if (state.selectedInterestId === next.interest.id) following();
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
        contributionsOpen={contributionsOpen}
        goalsOpen={goalsOpen}
        onToggleGoals={() => {
          setContributionsOpen(false);
          setGoalsOpen((open) => !open);
        }}
        onToggleContributions={() => {
          setGoalsOpen(false);
          setContributionsOpen((open) => !open);
        }}
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
        onProfile={() => {
          setSettingsSection("profile");
          state.setSettingsOpen(true);
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
        onComparePins={() => setComparingPins(true)}
        onRequestPin={() => setCreating(true)}
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
          records={state.allRecords}
          onCheckout={setChatCheckout}
          onContributions={() => {
            setContributionsOpen(true);
          }}
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
                  onTrends={organizationCode ? () => setScopeDetails({code:organizationCode,country:scopedCountryName,concern:state.overlay.concerns.length===1?state.overlay.concerns[0]:undefined}) : undefined}
                  onOrganizations={
                    organizationCode
                      ? () =>
                          setOrganizationCountry({
                            code: organizationCode,
                            country: scopedCountryName,
                          })
                      : undefined
                  }
                  onAdd={
                    state.activeInterest && !state.activeInterest.target
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
              <div className={styles.discoveryContent}>
                {state.collectionMode === "list" ? (
                  state.view === "Organizations" ? null : (
                    <CollectionInsights pins={state.interests} rightInset={!narrow&&causesOpen?310:0} key={state.activeInterest?.id ?? state.view} pin={state.activeInterest ?? {id:"following",name:"Pinned",issueIds:state.following,hiddenKinds:[]}} items={state.allRecords} canPin={state.trackingReady} onPin={pinScope}>
                    <InterestContents
                      loading={
                        state.view === "Explore"
                          ? state.dataBusy
                          : !state.trackingReady && !state.error
                      }
                      discovery={state.view === "Explore"}
                      interest={state.activeInterest}
                      following={state.following}
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
                    </CollectionInsights>
                  )
                ) : (
                  <>
                    <WorkspaceMap
                      emptyMessage={
                        state.error
                          ? undefined
                          : state.view === "Organizations"
                            ? "Select an organization or adjust filters to view causes."
                            : state.view === "Following"
                              ? ""
                              : "Select a source or adjust filters to view causes and projects."
                      }
                      loading={
                        state.view !== "Organizations" &&
                        state.dataBusy &&
                        !state.allRecords.length
                      }
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
                    pins={state.interests}
                    canPin={state.trackingReady}
                    onPin={pinScope}
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
                    onCloseOrganizations={() => setOrganizationsOpen(false)}
                    onCloseCauses={() => setCausesOpen(false)}
                    causesOpen={causesOpen}
                  />
                ) : (
                  <MapTools
                    open={causesOpen}
                    onClose={() => setCausesOpen(false)}
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
              {state.selected &&
                state.view !== "Contributions" &&
                (state.view !== "Organizations" ||
                  crisis.items.some(
                    (item) => item.id === state.selected?.id,
                  )) && (
                  <IssueDetails
          pinned={state.following.includes(state.selected.id)}
          canPin={state.trackingReady}
          onTogglePin={() => state.following.includes(state.selected!.id)
            ? state.untrack(state.selected!.id) : state.track(state.selected!.id)}
                    key={state.selected.id}
                    pins={state.interests}
                    onPinScope={pinScope}
                    issue={state.selected}
                    onClose={() => state.setSelectedId(undefined)}
                    onContribute={() => state.setCheckout(state.selected)}
                  />
                )}
            </div>
            {state.chatOpen && (
              <ChatDrawer
                actions={chatActions}
                context={{
                  view: state.view,
                  mode: state.collectionMode,
                  country:
                    state.view === "Organizations"
                      ? organizations.filters.country
                      : state.discoveryFilters.country,
                  causes:
                    state.view === "Organizations"
                      ? crisis.overlay.concerns
                      : state.overlay.concerns,
                  visualization: state.overlay.mode,
                  organizationId:
                    state.view === "Organizations"
                      ? organizations.organization?.id
                      : undefined,
                }}
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
      {(state.checkout?.project || chatCheckout) && (
        <ContributionDialog
          records={state.allRecords}
          initial={chatCheckout ?? { projectId: state.checkout?.project?.id }}
          onClose={() => {
            state.setCheckout(undefined);
            setChatCheckout(undefined);
          }}
        />
      )}
      {goalsOpen && (
        <GoalsModal
          records={state.allRecords}
          onClose={() => setGoalsOpen(false)}
          onContribute={(goal) => {
            setGoalsOpen(false);
            setChatCheckout({ goalId: goal.id });
          }}
        />
      )}
      {contributionsOpen && (
        <ContributionsModal
          onClose={() => setContributionsOpen(false)}
          onExplore={() => {
            setContributionsOpen(false);
            home();
          }}
          onProject={(projectId) => {
            setContributionsOpen(false);
            const item = state.allRecords.find(
              (record) => record.project?.id === projectId,
            );
            home();
            if (item) select(item);
          }}
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
              choice.target,
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
      {comparingPins && <PinnedCompareDialog pins={[...state.interests,...state.allRecords.filter(item=>state.following.includes(item.id)).map(item=>({id:item.id,name:item.location,issueIds:[item.id],hiddenKinds:[]}))]} items={state.allRecords} onClose={()=>setComparingPins(false)}/>}
      {scopeDetails && <ScopeDetails pins={state.interests} key={JSON.stringify(scopeDetails)} scope={scopeDetails} canPin={state.trackingReady} onPin={pinScope} onClose={()=>setScopeDetails(undefined)}/>}
      {creating && (
        <NewInterestDialog
          interests={state.interests}
          items={state.allRecords}
          initialCountry={(state.view==="Organizations"?organizations.countryCode:organizationCode) ?? ""}
          following={state.following}
          onPinItem={(id) => state.track(id)}
          onClose={() => setCreating(false)}
          onCreate={(choice) => {
            state.createInterest(choice.name, undefined, choice.categoryId, undefined, choice.target);
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
