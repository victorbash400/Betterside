import { useState } from "react";
import { Plus, X } from "lucide-react";
import IconButton from "../controls/IconButton";
import type { InterestChoice } from "../../lib/interestCategories";
import styles from "./SpecificInterestForm.module.css";
export default function SpecificInterestForm({
  categoryId,
  onCreate,
}: {
  categoryId: string;
  onCreate: (choice: InterestChoice) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  if (!editing)
    return (
      <button className={styles.trigger} onClick={() => setEditing(true)}>
        <Plus size={15} />
        Specific interest
      </button>
    );
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) onCreate({ name: name.trim(), categoryId });
      }}
    >
      <input
        autoFocus
        aria-label="Specific interest name"
        placeholder="Name"
        maxLength={120}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button className={styles.submit} disabled={!name.trim()}>
        Add
      </button>
      <IconButton
        label="Cancel specific interest"
        onClick={() => setEditing(false)}
      >
        <X size={15} />
      </IconButton>
    </form>
  );
}
