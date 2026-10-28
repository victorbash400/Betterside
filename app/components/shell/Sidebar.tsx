import SettingsNavigation from "../settings/SettingsNavigation";
import type { SettingsSection } from "../../lib/settings";
import SidebarIssueFilter from "./SidebarIssueFilter";
import type { InterestAction } from "../../lib/interestActions";
import type { InterestChoice } from "../../lib/interestCategories";
import { useEffect, useRef, useState } from "react";
import {
  House,
  PanelLeftClose,
  Heart,
  Building2,
  CircleUserRound,
  Settings,
  Search,
  X,
} from "lucide-react";
import InterestList from "../interests/InterestList";
import type { Interest } from "../../state/useTracking";
import IconButton from "../controls/IconButton";
import AppIcon from "../controls/AppIcon";
import ContextMenu from "../controls/ContextMenu";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import type { MapItem as Issue, IssueKind, View } from "../../lib/types";
import styles from "./Sidebar.module.css";
import searchStyles from "./SidebarSearch.module.css";
export default function Sidebar({
  view,
  onView,
  onSettings,
  open,
  onClose,
  issues,
  interests,
  trackingReady,
  following,
  activeInterestId,
  onInterest,
  onCreateInterest,
  onInterestAction,
  onTrack,
  selected,
  onSelect,
  query,
  issueKinds,
  onIssueKinds,
  onQuery,
  settings,
  settingsSection,
  onSettingsSection,
}: {
  view: View;
  onView: (view: View) => void;
  onSettings: () => void;
  open: boolean;
  onClose: () => void;
  issues: Issue[];
  interests: Interest[];
  trackingReady: boolean;
  following: string[];
  activeInterestId?: string;
  onInterest: (id: string) => void;
  onCreateInterest: (choice: InterestChoice) => void;
  onInterestAction: (action: InterestAction) => void;
  onTrack: (id: string, interestId?: string) => void;
  selected?: string;
  onSelect: (issue: Issue) => void;
  query: string;
  issueKinds: IssueKind[];
  onIssueKinds: (kinds: IssueKind[]) => void;
  onQuery: (query: string) => void;
  settings: boolean;
  settingsSection: SettingsSection;
  onSettingsSection: (value: SettingsSection) => void;
}) {
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
          {!settings &&
            view !== "Contributions" &&
            view !== "Organizations" && (
              <SidebarIssueFilter value={issueKinds} onChange={onIssueKinds} />
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
                  <button
                    className={`${styles.home} ${view === "Contributions" ? styles.selected : ""}`}
                    onClick={() => {
                      onView("Contributions");
                      onClose();
                    }}
                  >
                    <Heart size={24} strokeWidth={1.8} />
                    Contributions
                  </button>
                  <button
                    className={`${styles.home} ${view === "Organizations" ? styles.selected : ""}`}
                    onClick={() => {
                      onView("Organizations");
                      onClose();
                    }}
                  >
                    <Building2 size={24} strokeWidth={1.8} />
                    Organizations
                  </button>
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
                    onCreate={onCreateInterest}
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
                setMenu(menu ? null : { x: rect.left, y: rect.top - 58 });
              }}
            >
              <CircleUserRound size={24} strokeWidth={1.8} />
            </button>
          </footer>
        </div>
      </aside>
      {menu && (
        <ContextMenu
          {...menu}
          label="Account"
          entries={[{ label: "Settings", icon: Settings, action: onSettings }]}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}
