import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Appearance } from "../lib/appearance";
const subscribe = (listener: () => void) => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};
export function useSystemDark() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
}
const Context = createContext<{
  value: Appearance;
  update: (value: Appearance) => void;
} | null>(null);
export function AppearanceSettingsProvider({
  value,
  update,
  children,
}: {
  value: Appearance;
  update: (value: Appearance) => void;
  children: ReactNode;
}) {
  return <Context value={{ value, update }}>{children}</Context>;
}
export function useAppearance() {
  const context = useContext(Context);
  const systemDark = useSystemDark();
  if (!context) throw new Error("Appearance provider missing.");
  return {
    ...context,
    dark:
      context.value.mode === "system"
        ? systemDark
        : context.value.mode === "dark",
  };
}
