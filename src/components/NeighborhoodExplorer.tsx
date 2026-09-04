import React from "react";
import { neighborhoods } from "../data/neighborhoods";
import { Neighborhood } from "../types";
import { Sparkles, MapPin, Bus, ShieldAlert, Key, Compass, X, Map } from "lucide-react";

interface NeighborhoodExplorerProps {
  selectedNeighborhoodId: string | null;
  onSelectNeighborhood: (id: string | null) => void;
}

export default function NeighborhoodExplorer({
  selectedNeighborhoodId,
  onSelectNeighborhood,
}: NeighborhoodExplorerProps) {
  const selectedNeighborhood = neighborhoods.find((n) => n.id === selectedNeighborhoodId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full min-h-[350px]">
      {/* Title Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Neighborhood Guide</h2>
        </div>
        {selectedNeighborhood && (
          <button
            onClick={() => onSelectNeighborhood(null)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Explorer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {!selectedNeighborhood ? (
          // Default State: Select a Neighborhood
          <div className="h-full flex flex-col justify-center items-center text-center py-8 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
              <Compass className="w-6 h-6 text-slate-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Explore San Francisco</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Click any neighborhood on the map or select from the list below to zoom in and discover local vibes, transit lines, and secrets.
            </p>

            {/* Quick selectors list */}
            <div className="mt-5 w-full grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50">
              {neighborhoods.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onSelectNeighborhood(n.id)}
                  className="px-2.5 py-1.5 text-left text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-100 transition-all duration-150 flex items-center gap-1.5 shadow-xs cursor-pointer truncate"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: n.borderColor }}
                  />
                  <span className="truncate">{n.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Detail State: Neighborhood Selected
          <div className="space-y-4 animate-fade-in">
            {/* Quick tag / color banner */}
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: selectedNeighborhood.fillColor, borderColor: selectedNeighborhood.borderColor }}
              />
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight leading-none">
                {selectedNeighborhood.name}
              </h3>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {selectedNeighborhood.description}
            </p>

            <hr className="border-slate-100" />

            {/* Vibe rating */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Vibe & Personality
              </h4>
              <p className="text-xs text-slate-700 font-medium italic bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                &ldquo;{selectedNeighborhood.vibe}&rdquo;
              </p>
            </div>

            {/* Local Highlights */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" />
                Local Highlights
              </h4>
              <ul className="grid grid-cols-1 gap-1">
                {selectedNeighborhood.highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="text-xs text-slate-700 bg-white border border-slate-100 py-1.5 px-2.5 rounded-lg flex items-center gap-2 shadow-xs"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Transit connections */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Bus className="w-3 h-3 text-blue-500" />
                Key Transit Connections
              </h4>
              <div className="flex flex-col gap-1">
                {selectedNeighborhood.transitConnections.map((conn, index) => (
                  <div
                    key={index}
                    className="text-xs text-slate-600 bg-slate-50 border border-slate-100 py-1.5 px-2.5 rounded-lg leading-relaxed flex items-start gap-1.5"
                  >
                    <span className="text-slate-400 font-bold mt-0.5">•</span>
                    <span>{conn}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secrets/Local Tips */}
            <div className="space-y-1.5 bg-indigo-50/50 border border-indigo-100/60 p-3 rounded-xl">
              <h4 className="text-[10px] font-bold text-indigo-500 tracking-wider flex items-center gap-1">
                <Key className="w-3 h-3 text-indigo-500" />
                Insider Tip / Secret
              </h4>
              <p className="text-xs text-indigo-950 font-normal leading-relaxed">
                {selectedNeighborhood.secrets}
              </p>
            </div>

            {/* Safety Tips */}
            <div className="space-y-1.5 bg-amber-50/70 border border-amber-100 p-3 rounded-xl">
              <h4 className="text-[10px] font-bold text-amber-600 tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                Visitor Safety Advice
              </h4>
              <p className="text-xs text-amber-950 font-normal leading-relaxed">
                {selectedNeighborhood.safetyTips}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
