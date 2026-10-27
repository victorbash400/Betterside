import { Check, ChevronRight, Folder } from "lucide-react";
import type { InterestCategory } from "../../lib/interestCategories";
import styles from "./InterestCategoryRow.module.css";
export default function InterestCategoryRow({
  category,
  path,
  saved,
  onChoose,
  onBrowse,
}: {
  category: InterestCategory;
  path?: string;
  saved: boolean;
  onChoose: () => void;
  onBrowse?: () => void;
}) {
  return (
    <div className={styles.row}>
      <button
        className={styles.choose}
        onClick={onChoose}
        disabled={saved}
        aria-label={`Add ${category.name}`}
      >
        <Folder size={20} />
        <span>
          {category.name}
          {path && <small>{path}</small>}
        </span>
        {saved && <Check size={16} />}
      </button>
      {onBrowse && (
        <button
          className={styles.browse}
          aria-label={`Browse ${category.name}`}
          onClick={onBrowse}
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
