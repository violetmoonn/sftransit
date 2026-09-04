import React, { useState, useMemo } from "react";
import MapContainer from "./components/MapContainer";
import NeighborhoodExplorer from "./components/NeighborhoodExplorer";
import JourneyPlanner from "./components/JourneyPlanner";
import LiveTransitBoard from "./components/LiveTransitBoard";
import { neighborhoods } from "./data/neighborhoods";
import { transitLines } from "./data/transit";
import { motion } from "motion/react";
import {
  Train,
  Compass,
  Map,
  Navigation,
  MessageSquare,
  Eye,
  Info,
  Bus,
  Shield,
  HelpCircle,
  Radio,
  Clock,
  ArrowRight
} from "lucide-react";

export default function App() {
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string | null>(null);
  const [selectedTransitLineId, setSelectedTransitLineId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"explorer" | "planner" | "realtime">("explorer");

  const [commuteStart, setCommuteStart] = useState<string>("richmond");
  const [commuteEnd, setCommuteEnd] = useState<string>("downtown");

  const [activeTransitTypes, setActiveTransitTypes] = useState<{ [key: string]: boolean }>({
    bart: true,
    "muni-metro": true,
    caltrain: true,
    "cable-car": true,
    phoenix: true,
  });

  // Calculate commute times between commuteStart and commuteEnd for each system
  const commuteTimes = useMemo(() => {
    const startNeigh = neighborhoods.find((n) => n.id === commuteStart);
    const endNeigh = neighborhoods.find((n) => n.id === commuteEnd);
    if (!startNeigh || !endNeigh) return { bart: { minutes: null, status: "Select zones" }, muni: { minutes: null, status: "Select zones" }, caltrain: { minutes: null, status: "Select zones" }, cable: { minutes: null, status: "Select zones" }, phoenix: { minutes: null, status: "Select zones" } };
    
    if (commuteStart === commuteEnd) {
      return {
        bart: { minutes: 0, status: "Same area" },
        muni: { minutes: 0, status: "Same area" },
        caltrain: { minutes: 0, status: "Same area" },
        cable: { minutes: 0, status: "Same area" },
        phoenix: { minutes: 0, status: "Same area" },
      };
    }

    const dx = startNeigh.labelX - endNeigh.labelX;
    const dy = startNeigh.labelY - endNeigh.labelY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const baseMinutes = Math.max(10, Math.round(12 + dist * 0.05));

    // 1. BART (direct list: downtown, mission, twinpeaks, excelsior, soma)
    const bartDirect = ["downtown", "mission", "twinpeaks", "excelsior", "soma"];
    const isBartDirect = bartDirect.includes(commuteStart) && bartDirect.includes(commuteEnd);
    const bartTime = isBartDirect 
      ? Math.max(4, Math.round(baseMinutes * 0.45))
      : Math.max(15, Math.round(baseMinutes * 0.75)) + 10;
    const bartStatus = isBartDirect ? "Direct subway" : "Bus link + BART";

    // 2. Muni Metro
    const muniDirect = ["sunset", "richmond", "mission", "castro", "soma", "potrero", "downtown", "westernaddition", "excelsior"];
    const isMuniDirect = muniDirect.includes(commuteStart) && muniDirect.includes(commuteEnd);
    const muniTime = isMuniDirect
      ? Math.max(8, Math.round(baseMinutes * 0.85))
      : Math.max(12, Math.round(baseMinutes * 1.1)) + 5;
    const muniStatus = isMuniDirect ? "Direct rail/bus" : "Muni transfer";

    // 3. Caltrain (direct: soma, potrero, excelsior, downtown, bayview)
    const caltrainDirect = ["soma", "potrero", "excelsior", "downtown", "bayview"];
    const isCaltrainDirect = caltrainDirect.includes(commuteStart) && caltrainDirect.includes(commuteEnd);
    const caltrainTime = isCaltrainDirect
      ? Math.max(10, Math.round(baseMinutes * 0.6))
      : Math.max(25, Math.round(baseMinutes * 1.25)) + 12;
    const caltrainStatus = isCaltrainDirect ? "Caltrain direct" : "Requires transfer";

    // 4. Cable Car (direct: northbeach, downtown, marina, westernaddition)
    const cableDirect = ["northbeach", "downtown", "marina", "westernaddition"];
    const isCableDirect = cableDirect.includes(commuteStart) && cableDirect.includes(commuteEnd);
    const cableTime = isCableDirect ? Math.max(12, Math.round(baseMinutes * 1.35)) : null;
    const cableStatus = isCableDirect ? "Historic Cable line" : "No local service";

    // 5. Phoenix Transportation (direct: downtown, soma, mission, potrero, bayview, richmond)
    const phoenixDirect = ["downtown", "soma", "mission", "potrero", "bayview", "richmond"];
    const isPhoenixDirect = phoenixDirect.includes(commuteStart) && phoenixDirect.includes(commuteEnd);
    const phoenixTime = isPhoenixDirect
      ? Math.max(7, Math.round(baseMinutes * 0.5))
      : Math.max(16, Math.round(baseMinutes * 0.8)) + 6;
    const phoenixStatus = isPhoenixDirect ? "Phoenix Express Direct" : "Regional Shuttle Link";

    return {
      bart: { minutes: bartTime, status: bartStatus },
      muni: { minutes: muniTime, status: muniStatus },
      caltrain: { minutes: caltrainTime, status: caltrainStatus },
      cable: cableTime ? { minutes: cableTime, status: cableStatus } : { minutes: null, status: cableStatus },
      phoenix: { minutes: phoenixTime, status: phoenixStatus },
    };
  }, [commuteStart, commuteEnd]);

  const [showStations, setShowStations] = useState<boolean>(true);

  const toggleTransitType = (type: string) => {
    setActiveTransitTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleSelectNeighborhood = (id: string | null) => {
    setSelectedNeighborhoodId(id);
    if (id && activeTab !== "explorer") {
      setActiveTab("explorer");
    }
  };

  const handleSelectTransitLine = (id: string | null) => {
    setSelectedTransitLineId(id);
    const line = transitLines.find((l) => l.id === id);
    if (line) {
      // Auto enable the transit type layer if they click a line
      setActiveTransitTypes((prev) => ({
        ...prev,
        [line.type]: true,
      }));
    }
  };

  const selectedLineObj = transitLines.find((l) => l.id === selectedTransitLineId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-slate-200 shrink-0 shadow-sm bg-slate-50 flex items-center justify-center rounded-xl">
              <Train className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight leading-none text-black">
                SFtransit
              </h1>
            </div>
          </div>

          {/* Quick guide indicators */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0072ce]" />
              <span>BART</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#ff0000]" />
              <span>Muni</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0f9d58]" />
              <span>Cable Car</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#000000]" />
              <span>Caltrain</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#f57c00]" />
              <span>Phoenix Express</span>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD LAYOUT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* LEFT COLUMN: INTERACTIVE MAP & MAP CONTROLS (8 COLS) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 min-h-0">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full gap-4">
            {/* Map title block */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <h2 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                  Interactive Map
                </h2>
                <h3 className="text-sm md:text-md font-bold text-slate-800 tracking-tight leading-none">
                  {selectedNeighborhoodId
                    ? `Zoomed Zone: ${neighborhoods.find((n) => n.id === selectedNeighborhoodId)?.name}`
                    : "San Francisco"}
                </h3>
              </div>

              {/* Reset view helper */}
              {selectedNeighborhoodId && (
                <button
                  onClick={() => handleSelectNeighborhood(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-950 transition-colors px-2.5 py-1 border border-slate-200 hover:border-slate-350 rounded bg-white cursor-pointer"
                >
                  Reset Zoom
                </button>
              )}
            </div>

            {/* The SVG Map Engine */}
            <div className="flex-1 min-h-0 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <MapContainer
                selectedNeighborhoodId={selectedNeighborhoodId}
                selectedTransitLineId={selectedTransitLineId}
                activeTransitTypes={activeTransitTypes}
                showStations={showStations}
                onSelectNeighborhood={handleSelectNeighborhood}
                onSelectTransitLine={handleSelectTransitLine}
              />
            </div>

            {/* MAP CONFIGURATION PANEL */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs tracking-widest">
                <span>Transportation</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleTransitType("bart")}
                  className={`px-3 py-1.5 text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer rounded-md ${
                    activeTransitTypes["bart"]
                      ? "bg-blue-50 border-blue-200 text-blue-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#0072ce] shrink-0" />
                  <span>BART</span>
                  <span className="text-[9px] text-slate-400 ml-0.5 font-medium">
                    ({activeTransitTypes["bart"] ? "Active" : "Inactive"})
                  </span>
                </button>

                <button
                  onClick={() => toggleTransitType("muni-metro")}
                  className={`px-3 py-1.5 text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer rounded-md ${
                    activeTransitTypes["muni-metro"]
                      ? "bg-red-50 border-red-200 text-red-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#ff0000] shrink-0" />
                  <span>Muni Metro</span>
                  <span className="text-[9px] text-slate-400 ml-0.5 font-medium">
                    ({activeTransitTypes["muni-metro"] ? "Active" : "Inactive"})
                  </span>
                </button>

                <button
                  onClick={() => toggleTransitType("cable-car")}
                  className={`px-3 py-1.5 text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer rounded-md ${
                    activeTransitTypes["cable-car"]
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#0f9d58] shrink-0" />
                  <span>Cable Cars</span>
                  <span className="text-[9px] text-slate-400 ml-0.5 font-medium">
                    ({activeTransitTypes["cable-car"] ? "Active" : "Inactive"})
                  </span>
                </button>

                <button
                  onClick={() => toggleTransitType("caltrain")}
                  className={`px-3 py-1.5 text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer rounded-md ${
                    activeTransitTypes["caltrain"]
                      ? "bg-slate-50 border-slate-300 text-slate-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#000000] shrink-0" />
                  <span>Caltrain</span>
                  <span className="text-[9px] text-slate-400 ml-0.5 font-medium">
                    ({activeTransitTypes["caltrain"] ? "Active" : "Inactive"})
                  </span>
                </button>

                <button
                  onClick={() => toggleTransitType("phoenix")}
                  className={`px-3 py-1.5 text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer rounded-md ${
                    activeTransitTypes["phoenix"]
                      ? "bg-orange-50 border-orange-200 text-orange-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#f57c00] shrink-0" />
                  <span>Phoenix Express</span>
                  <span className="text-[9px] text-slate-400 ml-0.5 font-medium">
                    ({activeTransitTypes["phoenix"] ? "Active" : "Inactive"})
                  </span>
                </button>

                <div className="w-[1px] h-6 bg-slate-300 mx-1 hidden sm:block" />

                <button
                  onClick={() => setShowStations(!showStations)}
                  className={`px-3 py-1.5 text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer rounded-md ${
                    showStations
                      ? "bg-slate-100 border-slate-300 text-slate-800"
                      : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showStations ? "Stations Active" : "Hide Stations"}</span>
                </button>
              </div>

              {/* Transit Line Detail Overlay if clicked */}
              {selectedLineObj && (
                <div className="mt-3 bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 animate-fade-in">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: selectedLineObj.color }}
                      />
                      <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                        {selectedLineObj.name} Detail
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed max-w-xl font-normal">
                      {selectedLineObj.description}
                    </p>
                  </div>
                  <div className="shrink-0 flex md:flex-col text-left md:text-right gap-3 md:gap-1.5 border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Frequency</span>
                      <span className="text-[11px] font-semibold text-slate-700">{selectedLineObj.frequency}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Operations</span>
                      <span className="text-[11px] font-semibold text-slate-700">{selectedLineObj.hours}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TRANSIT SYSTEM KEY & FARE GUIDE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-fade-in">
            {/* Title Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Train className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-800 tracking-tight">Transit & Fare Guide</h2>
              </div>
            </div>

            <div className="p-5 space-y-4">

            {/* Dynamic Commute Time Estimator */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-slate-700 tracking-wider uppercase">Commute Estimator</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Select path to calculate speeds</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                <select
                  value={commuteStart}
                  onChange={(e) => setCommuteStart(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-xs cursor-pointer focus:outline-none max-w-[150px] sm:max-w-none"
                >
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={commuteEnd}
                  onChange={(e) => setCommuteEnd(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-xs cursor-pointer focus:outline-none max-w-[150px] sm:max-w-none"
                >
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* BART KEY */}
              <button
                onClick={() => toggleTransitType("bart")}
                className={`p-4 border rounded-xl text-left transition-all cursor-pointer w-full flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  activeTransitTypes["bart"]
                    ? "bg-blue-50/40 border-blue-200 shadow-sm"
                    : "bg-white border-slate-200 opacity-60"
                }`}
              >
                {/* Left Section: Name & Status */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0072ce] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">BART</h4>
                    <span className={`inline-block mt-1 text-[8px] font-bold uppercase px-1.5 py-0.5 border rounded ${
                      activeTransitTypes["bart"]
                        ? "bg-blue-100/50 text-blue-800 border-blue-200"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}>
                      {activeTransitTypes["bart"] ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Middle Section: Specs (Read left to right) */}
                <div className="grid grid-cols-3 gap-6 flex-1 max-w-md">
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Type</span>
                    <span className="text-xs font-semibold text-slate-700">Regional Rail</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Fare</span>
                    <span className="text-xs font-semibold text-slate-700">Distance-based</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Wait</span>
                    <span className="text-xs font-semibold text-slate-700">10-20m</span>
                  </div>
                </div>

                {/* Right Section: Commute */}
                <div className="text-right min-w-[120px] pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-slate-100">
                  <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-1 md:text-right text-left">Est Commute</span>
                  <div className="flex md:justify-end items-center gap-1.5 justify-start">
                    <span className="text-xs font-bold font-mono text-blue-900 bg-blue-100/50 px-2 py-0.5 rounded border border-blue-200/50">
                      {commuteTimes.bart.minutes !== null ? `${commuteTimes.bart.minutes}m` : "N/A"}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-blue-600 block mt-1 tracking-tight md:text-right text-left">
                    {commuteTimes.bart.status}
                  </span>
                </div>
              </button>

              {/* MUNI METRO KEY */}
              <button
                onClick={() => toggleTransitType("muni-metro")}
                className={`p-4 border rounded-xl text-left transition-all cursor-pointer w-full flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  activeTransitTypes["muni-metro"]
                    ? "bg-red-50/40 border-red-200 shadow-sm"
                    : "bg-white border-slate-200 opacity-60"
                }`}
              >
                {/* Left Section: Name & Status */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">Muni Metro</h4>
                    <span className={`inline-block mt-1 text-[8px] font-bold uppercase px-1.5 py-0.5 border rounded ${
                      activeTransitTypes["muni-metro"]
                        ? "bg-red-100/50 text-red-800 border-red-200"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}>
                      {activeTransitTypes["muni-metro"] ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Middle Section: Specs */}
                <div className="grid grid-cols-3 gap-6 flex-1 max-w-md">
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Type</span>
                    <span className="text-xs font-semibold text-slate-700">Subway / Rail</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Fare</span>
                    <span className="text-xs font-semibold text-slate-700">Flat $2.50</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Wait</span>
                    <span className="text-xs font-semibold text-slate-700">8-15m</span>
                  </div>
                </div>

                {/* Right Section: Commute */}
                <div className="text-right min-w-[120px] pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-slate-100">
                  <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-1 md:text-right text-left">Est Commute</span>
                  <div className="flex md:justify-end items-center gap-1.5 justify-start">
                    <span className="text-xs font-bold font-mono text-red-900 bg-red-100/50 px-2 py-0.5 rounded border border-red-200/50">
                      {commuteTimes.muni.minutes !== null ? `${commuteTimes.muni.minutes}m` : "N/A"}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-red-600 block mt-1 tracking-tight md:text-right text-left">
                    {commuteTimes.muni.status}
                  </span>
                </div>
              </button>

              {/* CALTRAIN KEY */}
              <button
                onClick={() => toggleTransitType("caltrain")}
                className={`p-4 border rounded-xl text-left transition-all cursor-pointer w-full flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  activeTransitTypes["caltrain"]
                    ? "bg-slate-50/40 border-slate-300 shadow-sm"
                    : "bg-white border-slate-200 opacity-60"
                }`}
              >
                {/* Left Section: Name & Status */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#000000] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">Caltrain</h4>
                    <span className={`inline-block mt-1 text-[8px] font-bold uppercase px-1.5 py-0.5 border rounded ${
                      activeTransitTypes["caltrain"]
                        ? "bg-slate-100 text-slate-800 border-slate-200"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}>
                      {activeTransitTypes["caltrain"] ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Middle Section: Specs */}
                <div className="grid grid-cols-3 gap-6 flex-1 max-w-md">
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Type</span>
                    <span className="text-xs font-semibold text-slate-700">Commuter Rail</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Fare</span>
                    <span className="text-xs font-semibold text-slate-700">Zones ($3.75+)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Wait</span>
                    <span className="text-xs font-semibold text-slate-700">15-30m</span>
                  </div>
                </div>

                {/* Right Section: Commute */}
                <div className="text-right min-w-[120px] pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-slate-100">
                  <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-1 md:text-right text-left">Est Commute</span>
                  <div className="flex md:justify-end items-center gap-1.5 justify-start">
                    <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                      {commuteTimes.caltrain.minutes !== null ? `${commuteTimes.caltrain.minutes}m` : "N/A"}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 block mt-1 tracking-tight md:text-right text-left">
                    {commuteTimes.caltrain.status}
                  </span>
                </div>
              </button>

              {/* CABLE CAR KEY */}
              <button
                onClick={() => toggleTransitType("cable-car")}
                className={`p-4 border rounded-xl text-left transition-all cursor-pointer w-full flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  activeTransitTypes["cable-car"]
                    ? "bg-emerald-50/40 border-emerald-200 shadow-sm"
                    : "bg-white border-slate-200 opacity-60"
                }`}
              >
                {/* Left Section: Name & Status */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0f9d58] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">Cable Car</h4>
                    <span className={`inline-block mt-1 text-[8px] font-bold uppercase px-1.5 py-0.5 border rounded ${
                      activeTransitTypes["cable-car"]
                        ? "bg-emerald-100/50 text-emerald-800 border-emerald-200"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}>
                      {activeTransitTypes["cable-car"] ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Middle Section: Specs */}
                <div className="grid grid-cols-3 gap-6 flex-1 max-w-md">
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Type</span>
                    <span className="text-xs font-semibold text-slate-700">Historic Cable</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Fare</span>
                    <span className="text-xs font-semibold text-slate-700">Flat $8.00</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Wait</span>
                    <span className="text-xs font-semibold text-slate-700">10-15m</span>
                  </div>
                </div>

                {/* Right Section: Commute */}
                <div className="text-right min-w-[120px] pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-slate-100">
                  <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-1 md:text-right text-left">Est Commute</span>
                  <div className="flex md:justify-end items-center gap-1.5 justify-start">
                    <span className="text-xs font-bold font-mono text-emerald-900 bg-emerald-100/50 px-2 py-0.5 rounded border border-emerald-200/50">
                      {commuteTimes.cable.minutes !== null ? `${commuteTimes.cable.minutes}m` : "No svc"}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 block mt-1 tracking-tight md:text-right text-left">
                    {commuteTimes.cable.status}
                  </span>
                </div>
              </button>

              {/* PHOENIX EXPRESS KEY */}
              <button
                onClick={() => toggleTransitType("phoenix")}
                className={`p-4 border rounded-xl text-left transition-all cursor-pointer w-full flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  activeTransitTypes["phoenix"]
                    ? "bg-orange-50/40 border-orange-200 shadow-sm"
                    : "bg-white border-slate-200 opacity-60"
                }`}
              >
                {/* Left Section: Name & Status */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f57c00] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">Phoenix Express</h4>
                    <span className={`inline-block mt-1 text-[8px] font-bold uppercase px-1.5 py-0.5 border rounded ${
                      activeTransitTypes["phoenix"]
                        ? "bg-orange-100/50 text-orange-800 border-orange-200"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}>
                      {activeTransitTypes["phoenix"] ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Middle Section: Specs */}
                <div className="grid grid-cols-3 gap-6 flex-1 max-w-md">
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Type</span>
                    <span className="text-xs font-semibold text-slate-700">Express Shuttle</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Fare</span>
                    <span className="text-xs font-semibold text-slate-700">Flat $4.00</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-0.5">Wait</span>
                    <span className="text-xs font-semibold text-slate-700">12-18m</span>
                  </div>
                </div>

                {/* Right Section: Commute */}
                <div className="text-right min-w-[120px] pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-slate-100">
                  <span className="text-slate-400 font-bold text-[8px] block uppercase tracking-wider mb-1 md:text-right text-left">Est Commute</span>
                  <div className="flex md:justify-end items-center gap-1.5 justify-start">
                    <span className="text-xs font-bold font-mono text-orange-900 bg-orange-100/50 px-2 py-0.5 rounded border border-orange-200/50">
                      {commuteTimes.phoenix?.minutes !== null ? `${commuteTimes.phoenix.minutes}m` : "N/A"}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-orange-600 block mt-1 tracking-tight md:text-right text-left">
                    {commuteTimes.phoenix?.status}
                  </span>
                </div>
              </button>
            </div>
          </div>
          </div>
        </section>

        {/* RIGHT COLUMN: MULTI-TAB GUIDE PANEL (4 COLS) */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 min-h-0">
          {/* TAB SYSTEM BUTTONS */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap sm:flex-nowrap gap-1">
            <button
              onClick={() => setActiveTab("explorer")}
              className={`flex-1 py-2 px-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "explorer"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => setActiveTab("planner")}
              className={`flex-1 py-2 px-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "planner"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Journey</span>
            </button>

            <button
              onClick={() => setActiveTab("realtime")}
              className={`flex-1 py-2 px-1.5 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "realtime"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-red-500" />
              <span>Real-Time</span>
            </button>
          </div>

          {/* TAB WINDOW PANEL */}
          <div className="flex-1 min-h-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === "explorer" && (
                <NeighborhoodExplorer
                  selectedNeighborhoodId={selectedNeighborhoodId}
                  onSelectNeighborhood={handleSelectNeighborhood}
                />
              )}
              {activeTab === "planner" && (
                <JourneyPlanner onSelectNeighborhood={handleSelectNeighborhood} />
              )}
              {activeTab === "realtime" && (
                <LiveTransitBoard />
              )}
            </motion.div>
          </div>
        </section>
      </main>

      {/* FOOTER INFORMATIONAL BLOCK */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-6 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono tracking-wide text-slate-400">
              Synced with Muni, BART & Caltrain schedules
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              By using this site, you agree to the transit networks' Terms & Conditions. Data is informational only.
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold tracking-wider">
            <a
              href="https://www.sfmta.com/"
              target="_blank"
              referrerPolicy="no-referrer"
              className="text-white hover:text-slate-300 transition-colors"
            >
              Muni
            </a>
            <span className="text-slate-700 font-bold">|</span>
            <a
              href="https://www.bart.gov/"
              target="_blank"
              referrerPolicy="no-referrer"
              className="text-white hover:text-slate-300 transition-colors"
            >
              BART
            </a>
            <span className="text-slate-700 font-bold">|</span>
            <a
              href="https://www.caltrain.com/"
              target="_blank"
              referrerPolicy="no-referrer"
              className="text-white hover:text-slate-300 transition-colors"
            >
              Caltrain
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple internal icon component for settings
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
