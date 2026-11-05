import { useAccount } from "../../state/AccountContext";
import SidebarDrawerToggle from "./SidebarDrawerToggle";
import SettingsNavigation from "../settings/SettingsNavigation";
import type { SettingsSection } from "../../lib/settings";
import type { InterestAction } from "../../lib/interestActions";
import type { InterestChoice } from "../../lib/interestCategories";
import { useEffect, useRef, useState } from "react";
import {
  House,
  PanelLeftClose,
  Heart,
  Flag,
  Building2,
  Layers,
  CircleUserRound,
  Settings,
  LogOut,
  Search,
  X,
} from "lucide-react";
import InterestList from "../interests/InterestList";
import type { Interest } from "../../state/useTracking";
import IconButton from "../controls/IconButton";
import AppIcon from "../controls/AppIcon";
import ContextMenu from "../controls/ContextMenu";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import type { MapItem as Issue, View } from "../../lib/types";
import styles from "./Sidebar.module.css";
import searchStyles from "./SidebarSearch.module.css";
export default function Sidebar({
  view,
  onView,
  organizationsOpen,
  causesOpen,
  contributionsOpen,
  goalsOpen,
  onToggleGoals,
  onToggleContributions,
  onToggleOrganizations,
  onToggleCauses,
  onSettings,
  onProfile,
  open,
  onClose,
  issues,
  interests,
  trackingReady,
  following,
  activeInterestId,
  onInterest,
  onRequestPin,
  onComparePins,
  onInterestAction,
  onTrack,
  selected,
  onSelect,
  query,
  onQuery,
  settings,
  settingsSection,
  onSettingsSection,
}: {
  view: View;
  organizationsOpen: boolean;
  causesOpen: boolean;
  contributionsOpen: boolean;
  goalsOpen: boolean;
  onToggleGoals: () => void;
  onToggleContributions: () => void;
  onToggleOrganizations: () => void;
  onToggleCauses: () => void;
  onView: (view: View) => void;
  onSettings: () => void;
  onProfile: () => void;
  open: boolean;
  onClose: () => void;
  issues: Issue[];
  interests: Interest[];
  trackingReady: boolean;
  following: string[];
  activeInterestId?: string;
  onInterest: (id: string) => void;
  onRequestPin: () => void;
  onComparePins: () => void;
  onInterestAction: (action: InterestAction) => void;
  onTrack: (id: string, interestId?: string) => void;
  selected?: string;
  onSelect: (issue: Issue) => void;
  query: string;
  onQuery: (query: string) => void;
  settings: boolean;
  settingsSection: SettingsSection;
  onSettingsSection: (value: SettingsSection) => void;
}) {
  const account = useAccount();
  const narrow = useNarrowLayout(),
    sidebar = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!narrow || !open) return;
    const previous = document.activeElement;
    sidebar.current?.querySelector("button")?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [narrow, open]);
  return (
    <>
      {open && (
        <button
          className={styles.backdrop}
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside
        ref={sidebar}
        inert={narrow && !open}
        className={`${styles.sidebar} ${open ? styles.open : ""}`}
        aria-label="Navigation"
        onKeyDown={(event) => {
          if (!narrow || !open) return;
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
          if (event.key === "Tab") {
            const controls = Array.from(
              sidebar.current?.querySelectorAll<HTMLElement>(
                "button:not(:disabled), input:not(:disabled)",
              ) ?? [],
            );
            const first = controls[0],
              last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className={styles.brand}>
          <AppIcon />
          <span>BetterSide</span>
          <div className={styles.close}>
            <IconButton label="Close navigation" onClick={onClose}>
              <PanelLeftClose />
            </IconButton>
          </div>
        </div>
        <div className={styles.panel}>
          <button
            className={`${styles.home} ${styles.homeRow} ${!settings && view === "Explore" && !selected ? styles.selected : ""}`}
            onClick={() => {
              onView("Explore");
              onClose();
            }}
          >
            <House size={24} strokeWidth={1.8} />
            Home
          </button>
          {!settings && (
            <label className={searchStyles.search}>
              <Search size={18} />
              <input
                type="search"
                aria-label={
                  view === "Organizations"
                    ? "Search organizations"
                    : "Search locations, causes and projects"
                }
                placeholder="Search"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
              />
              {query && (
                <button
                  className={searchStyles.clear}
                  aria-label="Clear search"
                  onClick={() => onQuery("")}
                >
                  <X size={14} />
                </button>
              )}
            </label>
          )}
          <nav className={styles.navigation}>
            <div className={styles.entries}>
              {settings ? (
                <SettingsNavigation
                  value={settingsSection}
                  onChange={(value) => {
                    onSettingsSection(value);
                    onClose();
                  }}
                />
              ) : (
                <>
                  <div className={styles.section}>
                    <span>Workspace</span>
                  </div>
                  <SidebarDrawerToggle
                    label="Goals"
                    Icon={Flag}
                    side="left"
                    controls="goals-dialog"
                    open={goalsOpen}
                    onToggle={() => {
                      onToggleGoals();
                      onClose();
                    }}
                  />
                  <SidebarDrawerToggle
                    label="Contributions"
                    Icon={Heart}
                    side="left"
                    controls="contributions-dialog"
                    open={contributionsOpen}
                    onToggle={() => {
                      onToggleContributions();
                      onClose();
                    }}
                  />
                  <SidebarDrawerToggle
                    label="Organizations"
                    Icon={Building2}
                    side="left"
                    open={organizationsOpen}
                    onToggle={() => {
                      onToggleOrganizations();
                      onClose();
                    }}
                  />
                  <SidebarDrawerToggle
                    label="Causes"
                    Icon={Layers}
                    side="right"
                    open={causesOpen}
                    onToggle={() => {
                      onToggleCauses();
                      onClose();
                    }}
                  />
                  <InterestList
                    onAction={onInterestAction}
                    onTrack={onTrack}
                    disabled={!trackingReady}
                    interests={interests}
                    following={following}
                    issues={issues}
                    selected={selected}
                    activeId={activeInterestId}
                    onSelect={(issue) => {
                      onSelect(issue);
                      onClose();
                    }}
                    onOpen={(id) => {
                      onInterest(id);
                      onClose();
                    }}
                    onComparePins={onComparePins}
                    onRequestPin={onRequestPin}
                  />
                </>
              )}
            </div>
          </nav>
          <footer className={styles.footer}>
            <button
              className={styles.avatar}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={Boolean(menu)}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setMenu(menu ? null : { x: rect.left, y: rect.top - 136 });
              }}
            >
              <CircleUserRound size={24} strokeWidth={1.8} />
            </button>
            {account.error && <span role="alert">{account.error}</span>}
          </footer>
        </div>
      </aside>
      {menu && (
        <ContextMenu
          {...menu}
          label="Account"
          className={styles.accountMenu}
          entries={[
            { label: "Profile", icon: CircleUserRound, action: onProfile },
            { label: "Settings", icon: Settings, action: onSettings },
            {
              label: "Sign out",
              icon: LogOut,
              disabled: account.busy,
              action: () => {
                void account.signOut();
              },
            },
          ]}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}
