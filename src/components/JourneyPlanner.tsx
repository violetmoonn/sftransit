import React, { useState, useEffect } from "react";
import { neighborhoods } from "../data/neighborhoods";
import AddressAutocomplete from "./AddressAutocomplete";
import { freeRoutes, parseLL } from "../lib/freeMaps";
import { ArrowRightLeft, Navigation, Footprints, TramFront, Car, ExternalLink, Loader2 } from "lucide-react";

interface JourneyPlannerProps {
  onSelectNeighborhood: (id: string | null) => void;
}

// Adult fares as of September 2026 (Clipper or contactless card).
// Muni $2.85 (free transfers for 120 min) · BART from $2.55 (distance-based)
// Cable car $9.00 · Caltrain from $4.00 (zone-based) · SF Bay Ferry from $5.10
// Kept up to date by src/official.ts.
export const FARES = { muni: 2.85, bartMin: 2.55, cableCar: 9.0, caltrainMin: 4.0, ferryMin: 5.1, transferCredit: 2.85 };

type ModeId = "walk" | "transit" | "car";

interface TransitLeg {
  name: string;
  agency: string;
  vehicle: string;
  from: string;
  to: string;
  stops: number;
}

interface ModeResult {
  minutes: number;
  miles: number;
  fare?: number;
  lines?: TransitLeg[];
}

type Results = Partial<Record<ModeId, ModeResult | null>>;

interface Spot {
  id: string; // neighborhood id
  label: string; // what the box shows
  where: string; // "ll:<lat>,<lng>" (picked address) or "addr:<text>" (landmark / neighborhood)
}

const spotFor = (id: string): Spot => {
  const n = neighborhoods.find((x) => x.id === id);
  return { id, label: n?.name || "", where: n ? `addr:${n.name}, San Francisco, CA` : "" };
};

const MODES: { id: ModeId; title: string; icon: React.ElementType; gmaps: string }[] = [
  { id: "walk", title: "Walk", icon: Footprints, gmaps: "walking" },
  { id: "transit", title: "Public Transit", icon: TramFront, gmaps: "transit" },
  { id: "car", title: "Car", icon: Car, gmaps: "driving" },
];

// Rough fallback when Google directions aren't available: distance between neighborhood centres.
function estimate(a: string, b: string): Results {
  const A = neighborhoods.find((n) => n.id === a);
  const B = neighborhoods.find((n) => n.id === b);
  if (!A || !B) return {};
  const grid = Math.hypot(A.labelX - B.labelX, A.labelY - B.labelY);
  const miles = Math.max(0.5, Math.round(grid * 0.009 * 10) / 10); // ~7 mi across the 1000-unit map, plus street detours
  return {
    walk: { minutes: Math.round((miles / 3) * 60), miles },
    transit: { minutes: Math.round(8 + (miles / 9) * 60), miles, fare: FARES.muni },
    car: { minutes: Math.round(4 + (miles / 14) * 60), miles },
  };
}

const fmtTime = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`);

function mapsLink(from: Spot, to: Spot, mode: string) {
  const text = (s: Spot) => {
    const ll = parseLL(s.where);
    if (ll) return `${ll[0]},${ll[1]}`;
    return s.where.startsWith("addr:") ? s.where.slice(5) : `${s.label}, San Francisco, CA`;
  };
  const u = new URLSearchParams({ api: "1", origin: text(from), destination: text(to), travelmode: mode });
  return `https://www.google.com/maps/dir/?${u.toString()}`;
}

export default function JourneyPlanner({ onSelectNeighborhood }: JourneyPlannerProps) {
  const [from, setFrom] = useState<Spot>(spotFor("richmond"));
  const [to, setTo] = useState<Spot>(spotFor("downtown"));
  const [mode, setMode] = useState<ModeId>("transit");
  const [results, setResults] = useState<Results>({});
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);

  const ready = !!(from.id && to.id && from.where && to.where);

  useEffect(() => {
    if (!ready) {
      setResults({});
      return;
    }
    const fallback = estimate(from.id, to.id);
    setResults(fallback);
    setLive(false);
    const ctrl = new AbortController();
    setLoading(true);
    // Free street routing (OpenStreetMap) — no API key needed.
    freeRoutes(from.where, to.where, FARES.muni, ctrl.signal)
      .then((d) => {
        if (!d) return;
        const merged: Results = {
          walk: d.walk || fallback.walk,
          transit: d.transit || fallback.transit,
          car: d.car || fallback.car,
        };
        setResults(merged);
        setLive(!!(d.walk || d.car));
      })
      .catch(() => {})
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [from.where, to.where, from.id, to.id, ready]);

  const pick = (setter: (s: Spot) => void) => (id: string, label: string, where: string) => {
    // Stay on this tab so the route options are visible.
    setter({ id, label, where });
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const active = results[mode];
  const activeMode = MODES.find((m) => m.id === mode)!;

  const costLabel = (m: ModeId, r?: ModeResult | null) => {
    if (m === "walk") return "Free";
    if (m === "transit") return r?.fare !== undefined ? `$${r.fare.toFixed(2)}` : `$${FARES.muni.toFixed(2)}`;
    return "Gas + parking";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[350px] overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Navigation className="w-4 h-4 text-emerald-500" />
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Trip Planner</h2>
      </div>

      {/* From / To */}
      <div className="p-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="relative pl-6 space-y-3 flex-1">
            <div className="absolute left-2.5 top-3 bottom-3 w-px border-l border-dashed border-slate-200 pointer-events-none" />
            <React.Fragment key={"from-" + from.where}>
              <AddressAutocomplete
                label="Start"
                placeholder="Type an address or place..."
                value={from.id}
                initialLabel={from.label}
                onSelect={pick(setFrom)}
                indicatorColor="bg-blue-600"
                timelineLabel="A"
              />
            </React.Fragment>
            <React.Fragment key={"to-" + to.where}>
              <AddressAutocomplete
                label="Destination"
                placeholder="Type an address or place..."
                value={to.id}
                initialLabel={to.label}
                onSelect={pick(setTo)}
                indicatorColor="bg-red-600"
                timelineLabel="B"
              />
            </React.Fragment>
          </div>
          <button
            onClick={swap}
            disabled={!from.id && !to.id}
            className="mt-4 p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-40"
            title="Swap start and destination"
            aria-label="Swap start and destination"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600 rotate-90" />
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!ready ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-xs font-bold tracking-wider">Enter a start and destination</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(({ id, title, icon: Icon }) => {
                const r = results[id];
                const on = mode === id;
                return (
                  <button
                    key={id}
                    onClick={() => setMode(id)}
                    aria-pressed={on}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      on ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${on ? "text-white" : "text-slate-500"}`} />
                    <div className="text-xs font-bold">{title}</div>
                    <div className="text-base font-semibold font-mono leading-tight mt-1">
                      {r ? fmtTime(r.minutes) : "—"}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${on ? "text-slate-300" : "text-slate-500"}`}>
                      {r ? `${r.miles} mi · ${costLabel(id, r)}` : "Not available"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected option */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{activeMode.title}</h3>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {loading
                    ? "Finding route…"
                    : live && mode !== "transit"
                    ? "Street route · © OpenStreetMap"
                    : "Estimate · tap below for exact lines and times"}
                </span>
              </div>

              {mode === "transit" && active?.lines && active.lines.length > 0 ? (
                <ol className="space-y-2">
                  {active.lines.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="shrink-0 bg-red-600 text-white font-bold rounded px-1.5 py-0.5 text-[10px]">
                        {l.name || l.agency || "Transit"}
                      </span>
                      <span>
                        {l.from} → {l.to}
                        <span className="text-slate-400"> · {l.stops} stop{l.stops === 1 ? "" : "s"}{l.agency ? ` · ${l.agency}` : ""}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-600">
                  {active
                    ? `About ${fmtTime(active.minutes)} (${active.miles} mi) from ${from.label} to ${to.label}.`
                    : "No route found for this option."}
                </p>
              )}

              <a
                href={mapsLink(from, to, activeMode.gmaps)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-700"
              >
                Open directions in Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
