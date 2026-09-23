import React, { useMemo } from "react";
import { neighborhoods } from "../data/neighborhoods";
import { transitLines, stations } from "../data/transit";
import { Neighborhood, TransitLine, Station } from "../types";
import { Compass, ZoomIn, ZoomOut, MapPin, Landmark } from "lucide-react";

interface MapContainerProps {
  selectedNeighborhoodId: string | null;
  selectedTransitLineId: string | null;
  activeTransitTypes: { [key: string]: boolean };
  showStations: boolean;
  onSelectNeighborhood: (id: string | null) => void;
  onSelectTransitLine: (id: string | null) => void;
}

const osmColors: Record<string, { fill: string; stroke: string }> = {
  presidio: { fill: "#cbe6a3", stroke: "#a4cc7a" },
  ggpark: { fill: "#cbe6a3", stroke: "#a4cc7a" },
  twinpeaks: { fill: "#d5ebd1", stroke: "#b8d9b2" },
  richmond: { fill: "#f1eee8", stroke: "#dcd9d0" },
  sunset: { fill: "#f1eee8", stroke: "#dcd9d0" },
  marina: { fill: "#f1eee8", stroke: "#dcd9d0" },
  northbeach: { fill: "#fdf8f2", stroke: "#e6e1d6" },
  downtown: { fill: "#f2eae1", stroke: "#e3d3c4" },
  soma: { fill: "#eeebe5", stroke: "#dedbd4" },
  westernaddition: { fill: "#f1eee8", stroke: "#dcd9d0" },
  haight: { fill: "#f1eee8", stroke: "#dcd9d0" },
  mission: { fill: "#f5ece3", stroke: "#dfd2c4" },
  castro: { fill: "#f1eee8", stroke: "#dcd9d0" },
  potrero: { fill: "#eeebe5", stroke: "#dedbd4" },
  bayview: { fill: "#eeebe5", stroke: "#dedbd4" },
  excelsior: { fill: "#f1eee8", stroke: "#dcd9d0" },
};

export default function MapContainer({
  selectedNeighborhoodId,
  selectedTransitLineId,
  activeTransitTypes,
  showStations,
  onSelectNeighborhood,
  onSelectTransitLine,
}: MapContainerProps) {
  // Calculate dynamic viewBox for smooth zooming
  const viewBox = useMemo(() => {
    if (!selectedNeighborhoodId) {
      return "0 0 1000 1000";
    }

    const neighborhood = neighborhoods.find((n) => n.id === selectedNeighborhoodId);
    if (!neighborhood) return "0 0 1000 1000";

    // Zoom in on the neighborhood's centroid
    const zoomSize = 400; // Size of the zoom viewport
    let x = neighborhood.labelX - zoomSize / 2;
    let y = neighborhood.labelY - zoomSize / 2;

    // Clamp coordinates to keep inside the 1000x1000 canvas
    x = Math.max(0, Math.min(x, 1000 - zoomSize));
    y = Math.max(0, Math.min(y, 1000 - zoomSize));

    return `${x} ${y} ${zoomSize} ${zoomSize}`;
  }, [selectedNeighborhoodId]);

  // Determine transit line visibility
  const visibleTransitLines = useMemo(() => {
    return transitLines.filter((line) => activeTransitTypes[line.type]);
  }, [activeTransitTypes]);

  // Determine station visibility
  const visibleStations = useMemo(() => {
    if (!showStations) return [];
    return stations.filter((station) => {
      if (station.type === "hub") return true;
      return activeTransitTypes[station.type];
    });
  }, [showStations, activeTransitTypes]);

  return (
    <div className="relative w-full aspect-square bg-[#aad3df] rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
      {/* Map Control overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => onSelectNeighborhood(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 border ${
            selectedNeighborhoodId
              ? "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 cursor-pointer"
              : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
          }`}
          disabled={!selectedNeighborhoodId}
          title="Zoom Out to Full Map"
        >
          <ZoomOut className="w-3.5 h-3.5" />
          <span>Full Map</span>
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1 pointer-events-none text-right">
        <div className="bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-slate-500 animate-spin-slow" />
          <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">San Francisco</span>
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="relative flex-1 w-full h-full min-h-0">
        <svg
          viewBox={viewBox}
          className="w-full h-full select-none transition-all duration-700 ease-out cursor-default"
          id="sf-svg-map"
        >
          {/* DEFINITIONS FOR SHADOWS & DECORATIONS */}
          <defs>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
            </filter>
            <pattern id="ocean-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0,20 Q 10,15 20,20 Q 30,25 40,20" fill="none" stroke="#9dc6d2" strokeWidth="1" />
            </pattern>
          </defs>

          {/* WATER BODIES BACKGROUND */}
          <rect width="1000" height="1000" fill="#aad3df" />
          <rect width="1000" height="1000" fill="url(#ocean-grid)" opacity="0.45" />

          {/* PHYSICAL GEOGRAPHY OUTLINES (East Bay & Marin County blocks for visual framing) */}
          {/* Marin County (North) */}
          <path d="M 0,0 L 450,0 C 420,40 380,50 300,50 C 250,50 200,30 180,20 Z" fill="#d5e9cf" stroke="#add5ad" strokeWidth="1" opacity="0.9" />
          <text x="180" y="30" fill="#5c7050" fontSize="11" fontWeight="bold" opacity="0.75" className="tracking-wide font-sans">MARIN COUNTY (RECREATION AREA)</text>

          {/* East Bay (East) */}
          <path d="M 960,0 L 1000,0 L 1000,1000 L 960,1000 C 970,700 950,500 970,300 C 960,200 950,100 960,0 Z" fill="#ebdcb9" stroke="#dfced1" strokeWidth="1" opacity="0.75" />
          <text x="980" y="500" transform="rotate(90 980 500)" fill="#706554" fontSize="11" fontWeight="bold" opacity="0.7" className="tracking-wide font-sans">EAST BAY (OAKLAND)</text>

          {/* Pacific Ocean & Bay Labels */}
          {!selectedNeighborhoodId && (
            <>
              <text x="60" y="450" fill="#4c7694" fontStyle="italic" fontSize="15" fontWeight="bold" letterSpacing="4" transform="rotate(-90 60 450)" className="opacity-70 font-sans">PACIFIC OCEAN</text>
              <text x="890" y="450" fill="#4c7694" fontStyle="italic" fontSize="15" fontWeight="bold" letterSpacing="4" transform="rotate(90 890 450)" className="opacity-70 font-sans">SAN FRANCISCO BAY</text>
            </>
          )}

          {/* LAND BASE LAYER SHADOW */}
          <path
            d="M 100,180 L 450,60 L 950,60 L 950,900 L 450,920 L 100,730 Z"
            fill="#f2efe9"
            filter="url(#shadow)"
          />

          {/* NEIGHBORHOODS POLYGONS LAYER */}
          <g id="neighborhoods-group">
            {neighborhoods.map((n) => {
              const isSelected = selectedNeighborhoodId === n.id;
              const isAnySelected = selectedNeighborhoodId !== null;
              const colors = osmColors[n.id] || { fill: n.fillColor, stroke: n.borderColor };

              return (
                <path
                  key={n.id}
                  id={`poly-${n.id}`}
                  d={n.svgPath}
                  fill={colors.fill}
                  stroke={isSelected ? "#1e293b" : colors.stroke}
                  strokeWidth={isSelected ? "3.5" : "1.25"}
                  className="transition-all duration-300 ease-in-out cursor-pointer hover:filter hover:brightness-95"
                  opacity={isAnySelected && !isSelected ? 0.35 : 1}
                  onClick={() => onSelectNeighborhood(isSelected ? null : n.id)}
                />
              );
            })}
          </g>

          {/* OSM-STYLE STREETS GRID */}
          <g id="osm-streets-grid" opacity="0.55" pointerEvents="none">
            {/* US-101 / Van Ness Avenue */}
            <path d="M 650,80 L 650,550 L 670,590 L 720,680 L 780,780" fill="none" stroke="#e0dcd3" strokeWidth="4" strokeLinecap="round" />
            <path d="M 650,80 L 650,550 L 670,590 L 720,680 L 780,780" fill="none" stroke="#fef5b9" strokeWidth="2" strokeLinecap="round" />

            {/* I-80 / Central Freeway / Bay Bridge connector */}
            <path d="M 720,610 L 790,580 L 850,500 L 920,200" fill="none" stroke="#d0c7b8" strokeWidth="5" strokeLinecap="round" />
            <path d="M 720,610 L 790,580 L 850,500 L 920,200" fill="none" stroke="#f2924b" strokeWidth="3" strokeLinecap="round" />

            {/* Geary Boulevard (Richmond to Downtown) */}
            <path d="M 100,260 L 850,260" fill="none" stroke="#e0dcd3" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 100,260 L 850,260" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

            {/* 19th Avenue (Presidio through Richmond & Sunset) */}
            <path d="M 300,60 L 300,850" fill="none" stroke="#e0dcd3" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 300,60 L 300,850" fill="none" stroke="#fef5b9" strokeWidth="2" strokeLinecap="round" />

            {/* Market Street (Downtown to Castro) */}
            <path d="M 520,590 L 640,490 L 880,200" fill="none" stroke="#e0dcd3" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 520,590 L 640,490 L 880,200" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />

            {/* Portola Drive / Woodside / Market Southwest extension */}
            <path d="M 320,800 L 380,780 L 450,710 L 520,590" fill="none" stroke="#e0dcd3" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 320,800 L 380,780 L 450,710 L 520,590" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />

            {/* Mission Street */}
            <path d="M 500,900 L 580,780 L 670,600 L 880,210" fill="none" stroke="#e0dcd3" strokeWidth="3" strokeLinecap="round" />
            <path d="M 500,900 L 580,780 L 670,600 L 880,210" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

            {/* Lombard Street */}
            <path d="M 300,110 L 800,110" fill="none" stroke="#e0dcd3" strokeWidth="3" strokeLinecap="round" />
            <path d="M 300,110 L 800,110" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

            {/* Sunset Boulevard */}
            <path d="M 160,420 L 160,780" fill="none" stroke="#e0dcd3" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 160,420 L 160,780" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />

            {/* El Camino Real / I-280 corridor south */}
            <path d="M 450,920 L 550,900 L 680,820 L 780,780" fill="none" stroke="#d0c7b8" strokeWidth="5" strokeLinecap="round" />
            <path d="M 450,920 L 550,900 L 680,820 L 780,780" fill="none" stroke="#f2924b" strokeWidth="3" strokeLinecap="round" />

            {/* Oak / Fell Streets (Panhandle corridor to Haight/Golden Gate Park) */}
            <path d="M 400,420 L 650,420" fill="none" stroke="#e0dcd3" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 400,420 L 650,420" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />

            {/* Broadway & Broadway Tunnel */}
            <path d="M 650,140 L 880,140" fill="none" stroke="#e0dcd3" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 650,140 L 880,140" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />

            {/* Third Street (SOMA to Bayview) */}
            <path d="M 860,260 L 830,400 L 840,650 L 920,850" fill="none" stroke="#e0dcd3" strokeWidth="3" strokeLinecap="round" />
            <path d="M 860,260 L 830,400 L 840,650 L 920,850" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* LANDMARKS & BRIDGES OVERLAYS */}
          {/* Golden Gate Bridge */}
          <g id="goldengate-bridge" opacity={selectedNeighborhoodId ? 0.2 : 0.9}>
            <line x1="280" y1="58" x2="280" y2="0" stroke="#b0afac" strokeWidth="6" strokeLinecap="round" />
            <line x1="280" y1="58" x2="280" y2="0" stroke="#f2924b" strokeWidth="3" strokeLinecap="round" />
            <path d="M 276,45 L 284,45 M 276,15 L 284,15" stroke="#d73a27" strokeWidth="2.5" />
            <circle cx="280" cy="45" r="2" fill="#d73a27" />
            <circle cx="280" cy="15" r="2" fill="#d73a27" />
            <text x="295" y="30" fill="#c43324" fontSize="9" fontWeight="bold" className="tracking-wide font-sans">GOLDEN GATE BRIDGE (US 101)</text>
          </g>

          {/* Bay Bridge */}
          <g id="bay-bridge" opacity={selectedNeighborhoodId ? 0.2 : 0.9}>
            <path d="M 915,202 L 985,178" stroke="#909090" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            <path d="M 915,202 L 985,178" stroke="#f2924b" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <text x="910" y="222" fill="#505050" fontSize="9" fontWeight="bold" className="tracking-wide font-sans">BAY BRIDGE (I-80)</text>
          </g>

          {/* TRANSIT LINES OVERLAY LAYER */}
          <g id="transit-lines-group">
            {visibleTransitLines.map((line) => {
              const isSelected = selectedTransitLineId === line.id;
              const isAnyLineSelected = selectedTransitLineId !== null;

              return (
                <g key={line.id}>
                  {/* Outer glow or shadow for selected line */}
                  {isSelected && (
                    <path
                      d={line.svgPath}
                      fill="none"
                      stroke={line.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.4"
                      className="animate-pulse"
                    />
                  )}
                  {/* Main Line path */}
                  <path
                    d={line.svgPath}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={isSelected ? "5" : "3.5"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="cursor-pointer transition-all duration-200 hover:stroke-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTransitLine(isSelected ? null : line.id);
                    }}
                    opacity={isAnyLineSelected && !isSelected ? 0.25 : 1}
                  />
                </g>
              );
            })}
          </g>

          {/* TRANSIT STATIONS/HUBS OVERLAY LAYER */}
          <g id="stations-group">
            {visibleStations.map((station) => {
              const isHub = station.type === "hub";
              // Check if any visible line serves this station
              const isServed = station.lines.some((lineName) => {
                const searchType = lineName.toLowerCase().includes("bart")
                  ? "bart"
                  : lineName.toLowerCase().includes("cable")
                  ? "cable-car"
                  : lineName.toLowerCase().includes("caltrain")
                  ? "caltrain"
                  : lineName.toLowerCase().includes("phoenix")
                  ? "phoenix"
                  : "muni-metro";
                return activeTransitTypes[searchType];
              });

              if (!isServed && !isHub) return null;

              return (
                <g
                  key={station.id}
                  className="cursor-pointer transition-transform duration-200 hover:scale-125"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Alert or set selected line based on station
                    const matchingLine = transitLines.find(line => 
                      line.stations.some(s => s.toLowerCase().includes(station.name.toLowerCase().substring(0, 5)))
                    );
                    if (matchingLine) {
                      onSelectTransitLine(matchingLine.id);
                    }
                  }}
                >
                  {/* Outer ring */}
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r={isHub ? "7.5" : "5.5"}
                    fill="#ffffff"
                    stroke={isHub ? "#0053a0" : "#708090"}
                    strokeWidth={isHub ? "2.5" : "1.5"}
                    filter="url(#shadow)"
                  />
                  {/* Inner center dot */}
                  {isHub && (
                    <circle cx={station.x} cy={station.y} r="2.5" fill="#0053a0" />
                  )}

                  {/* Station Label (Only render if zoomed in or is a major hub) */}
                  {(selectedNeighborhoodId || isHub) && (
                    <text
                      x={station.x}
                      y={station.y - 12}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize="9"
                      fontWeight="bold"
                      className="bg-white/90 px-1 py-0.5 rounded font-sans"
                    >
                      {station.name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* NEIGHBORHOOD LABELS LAYER */}
          <g id="neighborhood-labels-group" pointerEvents="none">
            {neighborhoods.map((n) => {
              const isSelected = selectedNeighborhoodId === n.id;
              const isAnySelected = selectedNeighborhoodId !== null;

              // Hide labels of non-selected neighborhoods if we are zoomed in
              if (isAnySelected && !isSelected) return null;

              return (
                <g key={`lbl-${n.id}`}>
                  {/* Stylized card label background when zoomed */}
                  {isSelected && (
                    <rect
                      x={n.labelX - 90}
                      y={n.labelY - 14}
                      width="180"
                      height="24"
                      rx="4"
                      fill="#0f172a"
                      opacity="0.9"
                    />
                  )}
                  <text
                    x={n.labelX}
                    y={n.labelY + 2}
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : "#2d3748"}
                    fontSize={isSelected ? "11" : "10"}
                    fontWeight="800"
                    letterSpacing="0.5"
                    className="font-sans uppercase tracking-wider"
                  >
                    {n.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Footer hint indicator */}
      <div className="bg-white/95 border-t border-slate-100 px-4 py-2 text-center text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5 shadow-inner">
        <MapPin className="w-3 h-3 text-slate-400 animate-bounce" />
        <span>Click on any neighborhood polygon or transit line on the map to explore details</span>
      </div>
    </div>
  );
}
