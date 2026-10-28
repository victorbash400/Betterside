import { useId, useState } from "react";
import {
  interestCategories,
  type InterestCategory,
  type InterestChoice,
} from "../../lib/interestCategories";
import type { Interest } from "../../lib/tracking";
import InterestCategoryRow from "./InterestCategoryRow";
import SpecificInterestForm from "./SpecificInterestForm";
import styles from "./InterestCategoryBranch.module.css";
export default function InterestCategoryBranch({
  category,
  interests,
  onCreate,
}: {
  category: InterestCategory;
  interests: Interest[];
  onCreate: (choice: InterestChoice) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const children = interestCategories.filter(
    (child) => child.parentId === category.id,
  );
  return (
    <div>
      <InterestCategoryRow
        category={category}
        saved={interests.some(
          (interest) =>
            interest.categoryId === category.id &&
            interest.name === category.name,
        )}
        onChoose={() =>
          onCreate({ name: category.name, categoryId: category.id })
        }
        onBrowse={
          children.length ? () => setExpanded((value) => !value) : undefined
        }
        expanded={expanded}
        controls={children.length ? id : undefined}
      />
      {children.length > 0 && (
        <div
          id={id}
          className={styles.expansion}
          data-expanded={expanded}
          inert={!expanded}
        >
          <div className={styles.clip}>
            <div className={styles.children}>
              {children.map((child) => (
                <InterestCategoryBranch
                  key={child.id}
                  category={child}
                  interests={interests}
                  onCreate={onCreate}
                />
              ))}
              <SpecificInterestForm
                categoryId={category.id}
                onCreate={onCreate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
