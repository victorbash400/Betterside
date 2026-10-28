import { useEffect, useState } from "react";
import {
  defaultAppearance,
  parseAppearance,
  appearanceVariables,
  type Appearance,
} from "../lib/appearance";
import { useSystemDark } from "./AppearanceContext";
function restore(raw: string): Appearance {
  const parsed: unknown = JSON.parse(raw);
  // Migrate the earlier mode/font-only preferences without losing the selection.
  if (
    parsed &&
    typeof parsed === "object" &&
    "mode" in parsed &&
    "font" in parsed &&
    !("version" in parsed)
  ) {
    const { mode, font } = parsed;
    if (
      !["Light", "Dark", "System"].includes(String(mode)) ||
      !["Geist", "Inter", "System"].includes(String(font))
    )
      throw new Error("Invalid appearance.");
    return {
      ...defaultAppearance,
      mode: String(mode).toLowerCase() as Appearance["mode"],
      light: {
        ...defaultAppearance.light,
        font: font as Appearance["light"]["font"],
      },
      dark: {
        ...defaultAppearance.dark,
        font: font as Appearance["dark"]["font"],
      },
    };
  }
  return parseAppearance(raw);
}
export function useAppearance() {
  const [value, setValue] = useState<Appearance>(defaultAppearance);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const systemDark = useSystemDark();
  const dark = value.mode === "system" ? systemDark : value.mode === "dark";
  useEffect(() => {
    try {
      const stored = localStorage.getItem("betterside-appearance");
      setValue(stored ? restore(stored) : defaultAppearance);
      setLoaded(true);
      setError("");
    } catch {
      setError("Could not restore appearance. Retry.");
    }
  }, [attempt]);
  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    root.dataset.theme = dark ? "dark" : "light";
    root.style.colorScheme = dark ? "dark" : "light";
    for (const [key, color] of Object.entries(
      appearanceVariables(dark ? value.dark : value.light),
    ))
      root.style.setProperty(key, color);
    try {
      localStorage.setItem("betterside-appearance", JSON.stringify(value));
    } catch {
      setError("Could not save appearance. Retry.");
    }
  }, [value, dark, loaded]);
  return {
    value,
    error,
    retry: () => setAttempt((value) => value + 1),
    update: (next: Appearance) => {
      setLoaded(true);
      setValue(next);
      setError("");
    },
  };
}
