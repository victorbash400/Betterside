import { useEffect, useState } from "react";
import {
  settingsConfigurationSchema,
  type SettingsConfiguration,
} from "../lib/settings";
export function useSettingsConfiguration() {
  const [data, setData] = useState<SettingsConfiguration>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setError("");
      try {
        const response = await fetch("/api/settings", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const data = settingsConfigurationSchema.parse(await response.json());
        if (!controller.signal.aborted) setData(data);
      } catch {
        if (!controller.signal.aborted)
          setError("Settings unavailable. Retry.");
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);
  return { data, error, retry: () => setAttempt((value) => value + 1) };
}
