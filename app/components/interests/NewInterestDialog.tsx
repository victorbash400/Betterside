import { useRef, useEffect, useState } from "react";
import { Search } from "lucide-react";
import Dialog from "../controls/Dialog";
import InterestCategoryRow from "./InterestCategoryRow";
import InterestCategoryBranch from "./InterestCategoryBranch";
import {
  interestCategories,
  categoryPath,
  type InterestChoice,
} from "../../lib/interestCategories";
import type { Interest } from "../../lib/tracking";
import styles from "./NewInterestDialog.module.css";
export default function NewInterestDialog({
  onCreate,
  onClose,
  interests = [],
}: {
  onCreate: (choice: InterestChoice) => void;
  onClose: () => void;
  interests?: Interest[];
}) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  const search = query.trim().toLocaleLowerCase();
  const categories = interestCategories.filter((category) =>
    categoryPath(category.id).toLocaleLowerCase().includes(search),
  );
  return (
    <Dialog title="Add interest" onClose={onClose} animated>
      <div className={styles.picker}>
        <label className={styles.search}>
          <Search size={16} />
          <input
            ref={input}
            aria-label="Search interests"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div
          className={styles.list}
          role="region"
          aria-label="Interest categories"
          tabIndex={0}
        >
          <div hidden={Boolean(search)}>
            {interestCategories
              .filter((category) => !category.parentId)
              .map((category) => (
                <InterestCategoryBranch
                  key={category.id}
                  category={category}
                  interests={interests}
                  onCreate={onCreate}
                />
              ))}
          </div>
          {search &&
            categories.map((category) => (
              <InterestCategoryRow
                key={category.id}
                category={category}
                path={categoryPath(category.parentId)}
                saved={interests.some(
                  (interest) =>
                    interest.categoryId === category.id &&
                    interest.name === category.name,
                )}
                onChoose={() =>
                  onCreate({ name: category.name, categoryId: category.id })
                }
              />
            ))}
        </div>
      </div>
    </Dialog>
  );
}
