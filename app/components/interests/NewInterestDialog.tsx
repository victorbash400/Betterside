import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import Dialog from "../controls/Dialog";
import IconButton from "../controls/IconButton";
import InterestCategoryRow from "./InterestCategoryRow";
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
  const [query, setQuery] = useState(""),
    [parentId, setParentId] = useState<string>(),
    [specific, setSpecific] = useState(false),
    [name, setName] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, [specific]);
  const parent = interestCategories.find(
    (category) => category.id === parentId,
  );
  const categories = interestCategories.filter((category) =>
    query.trim()
      ? categoryPath(category.id)
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase())
      : category.parentId === parentId,
  );
  return (
    <Dialog title="Add interest" onClose={onClose}>
      <div className={styles.picker}>
        {(parent || specific) && (
          <div className={styles.navigation}>
            <IconButton
              label="Back to interests"
              onClick={() => {
                if (specific) setSpecific(false);
                else setParentId(undefined);
                setQuery("");
              }}
            >
              <ArrowLeft />
            </IconButton>
            <span>{parent?.name ?? "Interests"}</span>
          </div>
        )}
        {specific ? (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim() && parentId)
                onCreate({ name: name.trim(), categoryId: parentId });
            }}
          >
            <input
              ref={input}
              aria-label="Specific interest name"
              placeholder="Name"
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button disabled={!name.trim()}>Add</button>
          </form>
        ) : (
          <>
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
            <div className={styles.list}>
              {parent && !query && (
                <InterestCategoryRow
                  category={parent}
                  saved={interests.some(
                    (interest) =>
                      interest.categoryId === parent.id &&
                      interest.name === parent.name,
                  )}
                  onChoose={() =>
                    onCreate({ name: parent.name, categoryId: parent.id })
                  }
                />
              )}
              {categories.map((category) => (
                <InterestCategoryRow
                  key={category.id}
                  category={category}
                  path={query ? categoryPath(category.parentId) : undefined}
                  saved={interests.some(
                    (interest) =>
                      interest.categoryId === category.id &&
                      interest.name === category.name,
                  )}
                  onChoose={() =>
                    onCreate({ name: category.name, categoryId: category.id })
                  }
                  onBrowse={
                    interestCategories.some(
                      (child) => child.parentId === category.id,
                    )
                      ? () => {
                          setParentId(category.id);
                          setQuery("");
                        }
                      : undefined
                  }
                />
              ))}
            </div>
            {parent && (
              <button
                className={styles.specific}
                onClick={() => setSpecific(true)}
              >
                <Plus size={16} />
                Specific interest
              </button>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
