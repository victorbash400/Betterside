import { useState } from "react";
import { ChevronDown, Globe2, Search } from "lucide-react";
import type { pinCountries } from "../../lib/pins";
import styles from "./PinCountryScope.module.css";
export default function PinCountryScope({
  countries,
  value,
  onChange,
}: {
  countries: ReturnType<typeof pinCountries>;
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  return (
    <div
      className={styles.scope}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        className={styles.trigger}
        aria-label="Country scope"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setQuery("");
        }}
      >
        <Globe2 size={16} />
        <span>
          {countries.find((country) => country.countryCode === value)
            ?.country ?? "All countries"}
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className={styles.menu}>
          <label className={styles.search}>
            <Search size={14} />
            <input
              autoFocus
              aria-label="Find country"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className={styles.options}>
            {[{ countryCode: "", country: "All countries" }, ...countries]
              .filter((country) =>
                country.country
                  .toLocaleLowerCase()
                  .includes(query.trim().toLocaleLowerCase()),
              )
              .map((country) => (
                <button
                  key={country.countryCode}
                  aria-pressed={value === country.countryCode}
                  onClick={() => {
                    onChange(country.countryCode);
                    setOpen(false);
                  }}
                >
                  {country.country}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
