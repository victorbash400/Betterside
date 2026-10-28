import { ChevronRight, Folder, Plus } from "lucide-react";
import type { InterestCategory } from "../../lib/interestCategories";
import styles from "./InterestCategoryRow.module.css";
export default function InterestCategoryRow({
  category,
  path,
  saved,
  onChoose,
  onBrowse,
  expanded,
  controls,
}: {
  category: InterestCategory;
  path?: string;
  saved: boolean;
  onChoose: () => void;
  onBrowse?: () => void;
  expanded?: boolean;
  controls?: string;
}) {
  return (
    <div className={styles.row}>
      <button
        className={styles.choose}
        onClick={onBrowse ?? onChoose}
        disabled={!onBrowse && saved}
        aria-label={onBrowse ? category.name : `Add ${category.name}`}
        aria-expanded={onBrowse ? expanded : undefined}
        aria-controls={controls}
      >
        {onBrowse ? (
          <ChevronRight
            size={16}
            className={styles.chevron}
            data-expanded={expanded}
          />
        ) : (
          <Folder size={16} />
        )}
        <span>
          {category.name}
          {path && <small>{path}</small>}
        </span>
        {!onBrowse && saved && <small>Added</small>}
      </button>
      {onBrowse && (
        <button
          className={styles.add}
          aria-label={saved ? `${category.name} added` : `Add ${category.name}`}
          disabled={saved}
          onClick={onChoose}
        >
          {saved ? "Added" : <Plus size={15} />}
        </button>
      )}
    </div>
  );
}
