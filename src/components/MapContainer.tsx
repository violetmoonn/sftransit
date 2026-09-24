import React, { useMemo } from "react";
import { neighborhoods } from "../data/neighborhoods";
import { transitLines, stations } from "../data/transit";
import { ZoomOut } from "lucide-react";

interface MapContainerProps {
  selectedNeighborhoodId: string | null;
  selectedTransitLineId: string | null;
  activeTransitTypes: { [key: string]: boolean };
  showStations: boolean;
  onSelectNeighborhood: (id: string | null) => void;
  onSelectTransitLine: (id: string | null) => void;
}

/* ------------------------------------------------------------------
   Civic map palette — restrained, high-contrast, print-map style.
   Neutral land, muted water, one ink colour for type and structure.
   ------------------------------------------------------------------ */
const INK = "#0f172a"; // slate-900 — matches site footer
const INK_MUTED = "#475569"; // slate-600
const RULE = "#94a3b8"; // slate-400
const WATER = "#dde5ec";
const WATER_GRID = "#cdd7e1";
const LAND = "#f5f5f2";
const LAND_EDGE = "#c8ccd2";
const PARK = "#e1e8d9";
const PARK_EDGE = "#c3cfb7";
const DISTRICT_EDGE = "#ffffff";
const ROAD = "#dcdcd6";
const HIGHWAY = "#c2c4c8";

const PARK_IDS = new Set(["presidio", "ggpark", "twinpeaks"]);

// Grid reference (A–J across, 1–10 down) like a printed street atlas
const GRID_COLS = "ABCDEFGHIJ".split("");
const GRID_STEP = 100;

const TYPE_LABELS: Record<string, string> = {
  bart: "BART",
  "muni-metro": "Muni Metro",
  "cable-car": "Cable Car",
  caltrain: "Caltrain",
  phoenix: "Phoenix Express",
};

// Shared label halo so text stays legible over lines and fills
const halo = {
  paintOrder: "stroke" as const,
  stroke: "#ffffff",
  strokeWidth: 3,
  strokeLinejoin: "round" as const,
};

export default function MapContainer({
  selectedNeighborhoodId,
  selectedTransitLineId,
  activeTransitTypes,
  showStations,
  onSelectNeighborhood,
  onSelectTransitLine,
}: MapContainerProps) {
  const viewBox = useMemo(() => {
    if (!selectedNeighborhoodId) return "0 0 1000 1000";
    const n = neighborhoods.find((nb) => nb.id === selectedNeighborhoodId);
    if (!n) return "0 0 1000 1000";
    const size = 400;
    const x = Math.max(0, Math.min(n.labelX - size / 2, 1000 - size));
    const y = Math.max(0, Math.min(n.labelY - size / 2, 1000 - size));
    return `${x} ${y} ${size} ${size}`;
  }, [selectedNeighborhoodId]);

  const zoomed = selectedNeighborhoodId !== null;

  const visibleTransitLines = useMemo(
    () => transitLines.filter((line) => activeTransitTypes[line.type]),
    [activeTransitTypes]
  );

  const visibleStations = useMemo(() => {
    if (!showStations) return [];
    return stations.filter((s) => s.type === "hub" || activeTransitTypes[s.type]);
  }, [showStations, activeTransitTypes]);

  // Legend: one swatch per active mode, colour taken from the data
  const legend = useMemo(() => {
    const seen = new Map<string, string>();
    for (const line of transitLines) {
      if (activeTransitTypes[line.type] && !seen.has(line.type)) {
        seen.set(line.type, line.color);
      }
    }
    return Array.from(seen, ([type, color]) => ({
      type,
      color,
      label: TYPE_LABELS[type] ?? type,
    }));
  }, [activeTransitTypes]);

  const lineTypeFor = (lineName: string) => {
    const l = lineName.toLowerCase();
    if (l.includes("bart")) return "bart";
    if (l.includes("cable")) return "cable-car";
    if (l.includes("caltrain")) return "caltrain";
    if (l.includes("phoenix")) return "phoenix";
    return "muni-metro";
  };

  return (
    <div className="relative w-full aspect-square bg-white overflow-hidden border border-slate-300 flex flex-col">
      {/* Title bar */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-2 shrink-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] truncate">
            San Francisco · Rail &amp; Transit System Map
          </span>
        </div>
        <button
          onClick={() => onSelectNeighborhood(null)}
          disabled={!zoomed}
          title="Return to full map"
          className={`flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border transition-colors ${
            zoomed
              ? "border-slate-500 text-white hover:bg-slate-700 cursor-pointer"
              : "border-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          <ZoomOut className="w-3 h-3" />
          Full map
        </button>
      </div>

      {/* Map */}
      <div className="relative flex-1 w-full min-h-0">
        <svg
          viewBox={viewBox}
          className="w-full h-full select-none"
          id="sf-svg-map"
          role="img"
          aria-label="Schematic map of San Francisco neighborhoods and rail lines"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <defs>
            <pattern id="survey-grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke={WATER_GRID} strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Water with fine survey grid */}
          <rect width="1000" height="1000" fill={WATER} />
          <rect width="1000" height="1000" fill="url(#survey-grid)" />

          {/* Surrounding counties */}
          <path d="M 0,0 L 450,0 C 420,40 380,50 300,50 C 250,50 200,30 180,20 Z" fill="#ecece8" stroke={LAND_EDGE} strokeWidth="1" />
          <path d="M 960,0 L 1000,0 L 1000,1000 L 960,1000 C 970,700 950,500 970,300 C 960,200 950,100 960,0 Z" fill="#ecece8" stroke={LAND_EDGE} strokeWidth="1" />
          {!zoomed && (
            <g fill={INK_MUTED} fontSize="9" fontWeight="600" letterSpacing="1.5">
              <text x="200" y="28">MARIN COUNTY</text>
              <text x="982" y="500" transform="rotate(90 982 500)">ALAMEDA COUNTY</text>
            </g>
          )}

          {!zoomed && (
            <g fill="#7b8ea3" fontSize="13" fontWeight="600" letterSpacing="6">
              <text x="60" y="450" transform="rotate(-90 60 450)" textAnchor="middle">PACIFIC OCEAN</text>
              <text x="905" y="560" transform="rotate(90 905 560)" textAnchor="middle">SAN FRANCISCO BAY</text>
            </g>
          )}

          {/* Land mass */}
          <path d="M 100,180 L 450,60 L 950,60 L 950,900 L 450,920 L 100,730 Z" fill={LAND} stroke={LAND_EDGE} strokeWidth="1.5" />

          {/* Districts */}
          <g id="neighborhoods-group">
            {neighborhoods.map((n) => {
              const isSelected = selectedNeighborhoodId === n.id;
              const isPark = PARK_IDS.has(n.id);
              return (
                <path
                  key={n.id}
                  id={`poly-${n.id}`}
                  d={n.svgPath}
                  fill={isSelected ? "#e2e8f0" : isPark ? PARK : LAND}
                  stroke={isSelected ? INK : isPark ? PARK_EDGE : DISTRICT_EDGE}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  opacity={zoomed && !isSelected ? 0.5 : 1}
                  className="cursor-pointer transition-[fill,opacity] duration-200 hover:fill-slate-200"
                  onClick={() => onSelectNeighborhood(isSelected ? null : n.id)}
                />
              );
            })}
          </g>

          {/* Street network — two weights only: arterial and highway */}
          <g id="streets" pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke={HIGHWAY} strokeWidth="3.5">
              <path d="M 650,80 L 650,550 L 670,590 L 720,680 L 780,780" />
              <path d="M 720,610 L 790,580 L 850,500 L 920,200" />
              <path d="M 450,920 L 550,900 L 680,820 L 780,780" />
            </g>
            <g stroke={ROAD} strokeWidth="2">
              <path d="M 100,260 L 850,260" />
              <path d="M 300,60 L 300,850" />
              <path d="M 520,590 L 640,490 L 880,200" />
              <path d="M 320,800 L 380,780 L 450,710 L 520,590" />
              <path d="M 500,900 L 580,780 L 670,600 L 880,210" />
              <path d="M 300,110 L 800,110" />
              <path d="M 160,420 L 160,780" />
              <path d="M 400,420 L 650,420" />
              <path d="M 650,140 L 880,140" />
              <path d="M 860,260 L 830,400 L 840,650 L 920,850" />
            </g>
          </g>

          {/* Bridges */}
          <g opacity={zoomed ? 0.3 : 1} fill={INK_MUTED} fontSize="8" fontWeight="600" letterSpacing="1">
            <line x1="280" y1="58" x2="280" y2="0" stroke={HIGHWAY} strokeWidth="4" />
            <text x="290" y="34">GOLDEN GATE BR · US 101</text>
            <path d="M 915,202 L 985,178" stroke={HIGHWAY} strokeWidth="4" fill="none" />
            <text x="905" y="224">BAY BR · I-80</text>
          </g>

          {/* Transit lines — white casing under each line, transit-diagram style */}
          <g id="transit-lines-group" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {visibleTransitLines.map((line) => {
              const isSelected = selectedTransitLineId === line.id;
              const dimmed = selectedTransitLineId !== null && !isSelected;
              const w = isSelected ? 6 : 4;
              return (
                <g
                  key={line.id}
                  opacity={dimmed ? 0.2 : 1}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTransitLine(isSelected ? null : line.id);
                  }}
                >
                  <title>{line.name}</title>
                  {/* wide invisible hit area */}
                  <path d={line.svgPath} stroke="transparent" strokeWidth="14" />
                  <path d={line.svgPath} stroke="#ffffff" strokeWidth={w + 3} />
                  <path d={line.svgPath} stroke={line.color} strokeWidth={w} />
                </g>
              );
            })}
          </g>

          {/* Stations */}
          <g id="stations-group">
            {visibleStations.map((station) => {
              const isHub = station.type === "hub";
              const served = station.lines.some((ln) => activeTransitTypes[lineTypeFor(ln)]);
              if (!served && !isHub) return null;

              return (
                <g
                  key={station.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const match = transitLines.find((line) =>
                      line.stations.some((s) =>
                        s.toLowerCase().includes(station.name.toLowerCase().substring(0, 5))
                      )
                    );
                    if (match) onSelectTransitLine(match.id);
                  }}
                >
                  <title>{`${station.name} — ${station.lines.join(", ")}`}</title>
                  {isHub ? (
                    // Interchange: bold ring
                    <circle cx={station.x} cy={station.y} r="6.5" fill="#ffffff" stroke={INK} strokeWidth="2.5" />
                  ) : (
                    <circle cx={station.x} cy={station.y} r="4" fill="#ffffff" stroke={INK} strokeWidth="1.5" />
                  )}
                  {(zoomed || isHub) && (
                    <text
                      x={station.x + 10}
                      y={station.y + 3}
                      fill={INK}
                      fontSize="8.5"
                      fontWeight={isHub ? 700 : 500}
                      style={halo}
                    >
                      {station.name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* District labels */}
          <g id="neighborhood-labels-group" pointerEvents="none">
            {neighborhoods.map((n) => {
              const isSelected = selectedNeighborhoodId === n.id;
              if (zoomed && !isSelected) return null;
              return (
                <text
                  key={`lbl-${n.id}`}
                  x={n.labelX}
                  y={n.labelY + 3}
                  textAnchor="middle"
                  fill={isSelected ? INK : INK_MUTED}
                  fontSize={isSelected ? 12 : 9}
                  fontWeight="700"
                  letterSpacing="1.2"
                  style={{ ...halo, textTransform: "uppercase" }}
                >
                  {n.name}
                </text>
              );
            })}
          </g>

          {/* Grid reference border (full view only) */}
          {!zoomed && (
            <g pointerEvents="none" fill={INK_MUTED} fontSize="8" fontFamily="var(--font-mono)" fontWeight="600">
              {GRID_COLS.map((c, i) => (
                <text key={c} x={i * GRID_STEP + GRID_STEP / 2} y="992" textAnchor="middle">{c}</text>
              ))}
              {GRID_COLS.map((_, i) => (
                <text key={i} x="8" y={i * GRID_STEP + GRID_STEP / 2 + 3} textAnchor="middle">{i + 1}</text>
              ))}
              {Array.from({ length: 9 }, (_, i) => (i + 1) * GRID_STEP).map((p) => (
                <g key={p} stroke={RULE} strokeWidth="0.75">
                  <line x1={p} y1="982" x2={p} y2="1000" />
                  <line x1="0" y1={p} x2="16" y2={p} />
                </g>
              ))}
            </g>
          )}

          {/* North arrow (static) */}
          {!zoomed && (
            <g transform="translate(930 935)" pointerEvents="none">
              <circle r="16" fill="#ffffff" stroke={INK} strokeWidth="1" />
              <path d="M 0,-11 L 5,5 L 0,2 L -5,5 Z" fill={INK} />
              <text y="-20" textAnchor="middle" fontSize="9" fontWeight="700" fill={INK}>N</text>
            </g>
          )}
        </svg>

        {/* Legend */}
        {legend.length > 0 && (
          <div className="absolute left-3 bottom-3 bg-white/95 border border-slate-300 px-2.5 py-2 pointer-events-none">
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500 mb-1.5">
              Legend
            </div>
            <ul className="space-y-1">
              {legend.map((item) => (
                <li key={item.type} className="flex items-center gap-2 text-[10px] font-semibold text-slate-800">
                  <span className="inline-block w-5 h-[4px]" style={{ background: item.color }} />
                  {item.label}
                </li>
              ))}
              {showStations && (
                <>
                  <li className="flex items-center gap-2 text-[10px] font-semibold text-slate-800">
                    <span className="inline-flex w-5 justify-center">
                      <span className="w-2 h-2 rounded-full border-[1.5px] border-slate-900 bg-white" />
                    </span>
                    Station
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-semibold text-slate-800">
                    <span className="inline-flex w-5 justify-center">
                      <span className="w-3 h-3 rounded-full border-[2.5px] border-slate-900 bg-white" />
                    </span>
                    Interchange
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Footer strip */}
      <div className="shrink-0 border-t border-slate-300 bg-slate-50 px-3 py-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
        <span>Schematic · not to scale · select a district or line for details</span>
        <span>Independent service · not affiliated with SFMTA, BART or Caltrain</span>
      </div>
    </div>
  );
}
