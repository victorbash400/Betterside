import { ChevronRight } from "lucide-react";
import type { Interest } from "../../lib/tracking";
import type { View } from "../../lib/types";
import styles from "./WorkspaceBreadcrumbs.module.css";
export default function WorkspaceBreadcrumbs({
  view,
  path,
  onHome,
  onFollowing,
  onInterest,
}: {
  view: View;
  path: Interest[];
  onHome: () => void;
  onFollowing: () => void;
  onInterest: (id: string) => void;
}) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <button onClick={onHome}>Home</button>
      <ChevronRight size={12} />
      {view === "Following" ? (
        <>
          <button onClick={onFollowing}>Following</button>
          {path.map((interest) => (
            <span key={interest.id}>
              <ChevronRight size={12} />
              <button onClick={() => onInterest(interest.id)}>
                {interest.name}
              </button>
            </span>
          ))}
        </>
      ) : (
        <span>{view === "Explore" ? "Map" : view}</span>
      )}
    </nav>
  );
}
