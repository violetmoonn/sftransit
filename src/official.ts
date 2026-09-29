// Keeps fares in step with the official agency data (served by /api/official from 511 SF Bay).
// The last official values are saved on the device so they still show offline.
import { useEffect, useState } from "react";
import { FARES } from "./components/JourneyPlanner";

type Official = { fares: Partial<typeof FARES>; checkedAt: string | null };
const KEY = "sftransit-official-fares";
const BOUNDS: Record<string, [number, number]> = {
  muni: [2, 4.5], cableCar: [6, 20], bartMin: [1.5, 4.5], caltrainMin: [2, 9], ferryMin: [2, 20],
};

function apply(o: Official | null): Official | null {
  if (!o || !o.fares) return null;
  const clean: Partial<typeof FARES> = {};
  for (const [k, v] of Object.entries(o.fares)) {
    const b = BOUNDS[k];
    if (b && typeof v === "number" && v >= b[0] && v <= b[1]) (clean as any)[k] = v;
  }
  Object.assign(FARES, clean);
  return { fares: clean, checkedAt: o.checkedAt };
}

export function money(v: number) {
  return `$${v.toFixed(2)}`;
}

export function useOfficialFares() {
  const [info, setInfo] = useState<Official | null>(() => {
    try { return apply(JSON.parse(localStorage.getItem(KEY) || "null")); } catch { return null; }
  });
  useEffect(() => {
    let alive = true;
    fetch("/api/official")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const got = apply(data);
        if (!alive || !got || !got.checkedAt || !Object.keys(got.fares).length) return;
        try { localStorage.setItem(KEY, JSON.stringify(got)); } catch {}
        setInfo(got);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return { fares: { ...FARES }, checkedAt: info?.checkedAt || null };
}
