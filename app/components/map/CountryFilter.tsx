import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Globe2 } from "lucide-react";
import styles from "./CountryFilter.module.css";
export default function CountryFilter({
  countries,
  value,
  onChange,
}: {
  countries: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const trigger = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  useEffect(() => {
    if (!open) return;
    const r = trigger.current!.getBoundingClientRect();
    setPosition({
      left: Math.min(r.left, window.innerWidth - 276),
      top: r.bottom + 6,
    });
    menu.current?.querySelector("input")?.focus();
    const close = (event: PointerEvent) => {
      if (
        !menu.current?.contains(event.target as Node) &&
        !trigger.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const resize = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", resize);
    };
  }, [open]);
  function select(country: string) {
    onChange(country);
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <>
      <button
        ref={trigger}
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setQuery("");
          setOpen(!open);
        }}
      >
        <Globe2 size={18} />
        <span>{value || "All countries"}</span>
        <ChevronDown size={13} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            className={styles.menu}
            style={position}
            role="dialog"
            aria-label="Filter by country"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
                trigger.current?.focus();
              }
              if (["ArrowDown", "ArrowUp"].includes(event.key)) {
                event.preventDefault();
                const controls = Array.from(
                  menu.current!.querySelectorAll<HTMLElement>("input, button"),
                );
                const index = controls.indexOf(
                  document.activeElement as HTMLElement,
                );
                controls[
                  (index +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    controls.length) %
                    controls.length
                ]?.focus();
              }
            }}
          >
            <label className={styles.search}>
              <Search size={14} />
              <input
                aria-label="Search countries"
                placeholder="Search countries"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className={styles.options}>
              {["", ...countries]
                .filter(
                  (country) =>
                    !country ||
                    country.toLowerCase().includes(query.toLowerCase()),
                )
                .map((country) => (
                  <button
                    key={country}
                    aria-pressed={value === country}
                    onClick={() => select(country)}
                  >
                    <span>{country || "All countries"}</span>
                  </button>
                ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
