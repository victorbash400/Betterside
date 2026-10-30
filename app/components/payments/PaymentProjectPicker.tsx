import { Check, ChevronRight } from "lucide-react";
import type { Issue } from "../../lib/types";
import styles from "./PaymentProjectPicker.module.css";
export default function PaymentProjectPicker({
  projects,
  selectedId,
  open,
  disabled,
  onToggle,
  onSelect,
}: {
  projects: Issue["project"][];
  selectedId: string;
  open: boolean;
  disabled: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}) {
  const selected = projects.find((project) => project.id === selectedId);
  return (
    <div className={styles.picker}>
      <button
        className={styles.trigger}
        type="button"
        aria-expanded={open}
        aria-controls="payment-project-options"
        disabled={disabled}
        onClick={onToggle}
      >
        <span>Project</span>
        <strong>{selected?.name ?? "Choose project"}</strong>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          id="payment-project-options"
          className={styles.options}
          role="group"
          aria-label="Demonstration projects"
        >
          {projects.map((project) => (
            <button
              type="button"
              key={project.id}
              disabled={disabled}
              aria-pressed={selectedId === project.id}
              onClick={() => onSelect(project.id)}
            >
              <span>{project.name}</span>
              {selectedId === project.id && (
                <Check size={15} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
