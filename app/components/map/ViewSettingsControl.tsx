import { useId, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import IconButton from "../controls/IconButton";
import ToolbarPopover from "./ToolbarPopover";
import styles from "./ViewSettingsControl.module.css";

export default function ViewSettingsControl({
  sections,
}: {
  sections: { id: string; label: string; content: ReactNode }[];
}) {
  const [open, setOpen] = useState<{ x: number; y: number }>();
  const [selected, setSelected] = useState("filters");
  const id = useId();
  const active =
    sections.find((section) => section.id === selected) ?? sections[0];
  return (
    <>
      <IconButton
        label="View settings"
        title="View settings"
        aria-haspopup="dialog"
        aria-expanded={Boolean(open)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setOpen(open ? undefined : { x: rect.left, y: rect.bottom + 8 });
        }}
      >
        <SlidersHorizontal />
      </IconButton>
      {open && (
        <ToolbarPopover
          {...open}
          label="View settings"
          onClose={() => setOpen(undefined)}
        >
          <div className={styles.navigation}>
            <div
              className={styles.tabs}
              role="tablist"
              aria-label="View settings sections"
            >
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  id={`${id}-${section.id}`}
                  role="tab"
                  aria-selected={active.id === section.id}
                  aria-controls={`${id}-content`}
                  tabIndex={active.id === section.id ? 0 : -1}
                  onClick={() => setSelected(section.id)}
                  onKeyDown={(event) => {
                    let target: number;
                    if (event.key === "ArrowRight")
                      target = (index + 1) % sections.length;
                    else if (event.key === "ArrowLeft")
                      target = (index + sections.length - 1) % sections.length;
                    else if (event.key === "Home") target = 0;
                    else if (event.key === "End") target = sections.length - 1;
                    else return;
                    event.preventDefault();
                    setSelected(sections[target].id);
                    document
                      .getElementById(`${id}-${sections[target].id}`)
                      ?.focus();
                  }}
                >
                  {section.label}
                </button>
              ))}
            </div>
            <IconButton
              label="Close view settings"
              onClick={() => setOpen(undefined)}
            >
              <X size={14} />
            </IconButton>
          </div>
          <div
            id={`${id}-content`}
            role="tabpanel"
            aria-labelledby={`${id}-${active.id}`}
            className={styles.content}
          >
            {active.content}
          </div>
        </ToolbarPopover>
      )}
    </>
  );
}
