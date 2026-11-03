import { useState } from "react";
import { Check } from "lucide-react";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import Dialog from "../controls/Dialog";
import TrendPanel from "../trends/TrendPanel";
import { comparablePins } from "../../lib/pins";
import type { Interest } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import styles from "./PinnedCompareDialog.module.css";
export default function PinnedCompareDialog({
  pins,
  items,
  onClose,
}: {
  pins: Interest[];
  items: MapItem[];
  onClose: () => void;
}) {
  const options = comparablePins(pins, items);
  const [selected, setSelected] = useState<string[]>([]),
    [comparing, setComparing] = useState(false);
  return (
    <Dialog title="Compare pins" size="analysis" onClose={onClose}>
      {comparing ? (
        <>
          <SettingsInlineButton className={styles.action} onClick={() => setComparing(false)}>
            Change selection
          </SettingsInlineButton>
          <TrendPanel
            scopes={options
              .filter((option) => selected.includes(option.pin.id))
              .map((option) => option.scope)}
          />
        </>
      ) : (
        <>
          <div className={styles.list}><SettingsGroup>
            {options.map(({ pin }) => (
              <button
                key={pin.id}
                role="checkbox"
                aria-checked={selected.includes(pin.id)}
                disabled={!selected.includes(pin.id) && selected.length === 4}
                onClick={() =>
                  setSelected(
                    selected.includes(pin.id)
                      ? selected.filter((id) => id !== pin.id)
                      : [...selected, pin.id],
                  )
                }
              >
                <span className={styles.check}>
                  {selected.includes(pin.id) && <Check size={12} />}
                </span>
                {pin.name}
              </button>
            ))}
          </SettingsGroup></div>
          <SettingsInlineButton
            className={styles.action}
            disabled={selected.length < 2}
            onClick={() => setComparing(true)}
          >
            Compare
          </SettingsInlineButton>
        </>
      )}
    </Dialog>
  );
}
