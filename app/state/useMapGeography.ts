import { useEffect, useState } from "react";
import type { MapGeography } from "../lib/mapGeography";
import { loadMapGeography } from "./mapGeographyCache";
export function useMapGeography() {
  const [areas, setAreas] = useState<MapGeography>({});
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setError("");
      try {
        const areas = await loadMapGeography();
        if (active) setAreas(areas);
      } catch {
        if (active) setError("Map boundaries unavailable. Retry.");
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [attempt]);
  return { areas, error, retry: () => setAttempt((value) => value + 1) };
}
