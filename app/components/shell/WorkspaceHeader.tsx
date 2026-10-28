import type { ReactNode } from "react";
import {
  PanelLeft,
  ArrowLeft,
  MessageCircle,
  Map,
  List,
  FolderPlus,
  RefreshCw,
} from "lucide-react";
import IconButton from "../controls/IconButton";
import WorkspaceBreadcrumbs from "./WorkspaceBreadcrumbs";
import type { View } from "../../lib/types";
import type { Interest } from "../../lib/tracking";
import styles from "./WorkspaceHeader.module.css";
export default function WorkspaceHeader({
  view,
  path,
  onMenu,
  onChat,
  chatOpen,
  onHome,
  onBack,
  onFollowing,
  onInterest,
  mode,
  onMode,
  onCreate,
  onRefresh,
  busy,
  children,
}: {
  view: View;
  path: Interest[];
  onMenu: () => void;
  onChat: () => void;
  chatOpen: boolean;
  onHome: () => void;
  onBack: () => void;
  onFollowing: () => void;
  onInterest: (id: string) => void;
  mode: "map" | "list";
  onMode: (mode: "map" | "list") => void;
  onCreate: () => void;
  onRefresh: () => void;
  busy: boolean;
  children?: ReactNode;
}) {
  return (
    <header className={styles.toolbar}>
      <div className={styles.navigation}>
        <div className={styles.mobile}>
          <IconButton label="Open navigation" onClick={onMenu}>
            <PanelLeft />
          </IconButton>
        </div>
        <IconButton
          className={styles.back}
          label={path.length ? "Parent folder" : "Home"}
          onClick={onBack}
        >
          <ArrowLeft />
        </IconButton>
        <WorkspaceBreadcrumbs
          view={view}
          path={path}
          onHome={onHome}
          onFollowing={onFollowing}
          onInterest={onInterest}
        />
      </div>
      {children}
      <div className={styles.actions}>
        <div className={styles.group} role="group" aria-label="Chat">
          <IconButton
            label="Chat"
            title="Chat"
            selected={chatOpen}
            onClick={onChat}
          >
            <MessageCircle />
          </IconButton>
        </div>
        {view !== "Contributions" && (
          <div className={styles.group} role="group" aria-label="View">
            <IconButton
              label="Map view"
              title="Map view"
              selected={mode === "map"}
              onClick={() => onMode("map")}
            >
              <Map />
            </IconButton>
            <IconButton
              label="List view"
              title="List view"
              selected={mode === "list"}
              onClick={() => onMode("list")}
            >
              <List />
            </IconButton>
          </div>
        )}
        <div className={styles.group}>
          <IconButton
            label="New interest"
            title="New interest"
            onClick={onCreate}
          >
            <FolderPlus />
          </IconButton>
          <IconButton
            label="Refresh data"
            title="Refresh data"
            onClick={onRefresh}
            disabled={busy}
          >
            <RefreshCw />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
