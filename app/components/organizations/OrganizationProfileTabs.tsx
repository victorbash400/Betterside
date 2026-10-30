import styles from "./OrganizationProfileTabs.module.css";

export default function OrganizationProfileTabs({
  value,
  areas,
  onChange,
}: {
  value: string;
  areas: number;
  onChange: (value: string) => void;
}) {
  const tabs = ["Overview", ...(areas ? ["Areas"] : []), "Sources"];
  return (
    <div className={styles.tabs} role="group" aria-label="Organization views">
      {tabs.map((tab) => (
        <button
          key={tab}
          aria-pressed={tab === value}
          onClick={() => onChange(tab)}
        >
          {tab}
          {tab === "Areas" && <span>{areas}</span>}
        </button>
      ))}
    </div>
  );
}
