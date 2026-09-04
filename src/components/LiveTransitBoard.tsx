import React, { useState, useEffect } from "react";
import { 
  RefreshCw, 
  Clock, 
  Info, 
  Zap, 
  MapPin, 
  Bus,
  Train,
  Anchor,
  AlertCircle,
  CheckCircle2,
  Bell
} from "lucide-react";

interface TransitAlert {
  agency: string;
  line: string;
  type: "Delay" | "Advisory" | "Maintenance" | "Normal";
  text: string;
  time: string;
}

export default function LiveTransitBoard() {
  const [activeTab, setActiveTab] = useState<"board" | "alerts">("board");
  const [selectedAgency, setSelectedAgency] = useState<"bart" | "muni" | "caltrain" | "cableCar" | "phoenix">("bart");
  const [selectedBartStation, setSelectedBartStation] = useState<string>("EMBR");
  
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(true);
  
  const [transitData, setTransitData] = useState<any>(null);
  const [alerts, setAlerts] = useState<TransitAlert[]>([]);
  const [countdown, setCountdown] = useState<number>(30);

  // BART Station Mapping
  const bartStations = [
    { abbr: "EMBR", name: "Embarcadero" },
    { abbr: "MONT", name: "Montgomery St" },
    { abbr: "POWL", name: "Powell St" },
    { abbr: "CIVC", name: "Civic Center" },
    { abbr: "16TH", name: "16th St Mission" },
    { abbr: "24TH", name: "24th St Mission" },
    { abbr: "GLEN", name: "Glen Park" },
    { abbr: "BALB", name: "Balboa Park" }
  ];

  // Fetch Transit departures
  const fetchTransitData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/realtime/transit-data");
      if (res.ok) {
        const data = await res.json();
        setTransitData(data);
      }
    } catch (err) {
      console.error("Error fetching live transit data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch live internet-scraped alerts
  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch("/api/realtime/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error("Error fetching live alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchTransitData();
    fetchAlerts();
  }, []);

  // Set up auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchTransitData();
          return 30; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    fetchTransitData();
    fetchAlerts();
    setCountdown(30);
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "Delay":
        return {
          bg: "bg-rose-50/60 border-rose-100 text-rose-950",
          icon: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />,
          badge: "bg-rose-100 text-rose-800 border border-rose-200"
        };
      case "Advisory":
        return {
          bg: "bg-blue-50/60 border-blue-100 text-blue-950",
          icon: <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
          badge: "bg-blue-100 text-blue-800 border border-blue-200"
        };
      case "Maintenance":
        return {
          bg: "bg-amber-50/60 border-amber-100 text-amber-950",
          icon: <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
          badge: "bg-amber-100 text-amber-800 border border-amber-200"
        };
      default:
        return {
          bg: "bg-emerald-50/60 border-emerald-100 text-emerald-950",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
          badge: "bg-emerald-100 text-emerald-800 border border-emerald-200"
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[420px] overflow-hidden">
      {/* Real-time Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            Real-Time SF Departures
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>SYNC: {countdown}s</span>
          </span>

          <button
            onClick={handleManualRefresh}
            disabled={loadingData || loadingAlerts}
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all rounded-lg shadow-xs cursor-pointer flex items-center justify-center disabled:opacity-40"
            title="Refresh Schedules & Live Alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData || loadingAlerts ? "animate-spin text-slate-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Sub tabs: Station Board / Alerts Feed */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => setActiveTab("board")}
          className={`flex-1 py-2.5 text-xs font-semibold tracking-tight text-center transition-all border-r border-slate-100 ${
            activeTab === "board"
              ? "bg-white text-slate-800 font-bold"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
          }`}
        >
          Departures Board
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex-1 py-2.5 text-xs font-semibold tracking-tight text-center transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "alerts"
              ? "bg-white text-slate-800 font-bold"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
          }`}
        >
          Live Advisories
          <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-md font-bold font-mono">
            {alerts.length || 4}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "board" ? (
          <div className="space-y-4">
            {/* Agency Selector Grid */}
            <div className="grid grid-cols-5 gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <button
                onClick={() => setSelectedAgency("bart")}
                className={`py-1.5 text-[10px] font-bold text-center transition-all cursor-pointer rounded-lg ${
                  selectedAgency === "bart"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                BART
              </button>
              <button
                onClick={() => setSelectedAgency("muni")}
                className={`py-1.5 text-[10px] font-bold text-center transition-all cursor-pointer rounded-lg ${
                  selectedAgency === "muni"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Muni
              </button>
              <button
                onClick={() => setSelectedAgency("caltrain")}
                className={`py-1.5 text-[10px] font-bold text-center transition-all cursor-pointer rounded-lg ${
                  selectedAgency === "caltrain"
                    ? "bg-black text-white shadow-xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Caltrain
              </button>
              <button
                onClick={() => setSelectedAgency("cableCar")}
                className={`py-1.5 text-[10px] font-bold text-center transition-all cursor-pointer rounded-lg ${
                  selectedAgency === "cableCar"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Cable Car
              </button>
              <button
                onClick={() => setSelectedAgency("phoenix")}
                className={`py-1.5 text-[10px] font-bold text-center transition-all cursor-pointer rounded-lg ${
                  selectedAgency === "phoenix"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Phoenix
              </button>
            </div>

            {/* BART Specific Station Selector */}
            {selectedAgency === "bart" && (
              <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <label className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase">
                  Select Station Monitor
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {bartStations.map((station) => (
                    <button
                      key={station.abbr}
                      onClick={() => setSelectedBartStation(station.abbr)}
                      className={`px-1 py-1 text-[9px] font-bold rounded-lg border transition-all text-center cursor-pointer ${
                        selectedBartStation === station.abbr
                          ? "bg-slate-800 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-100 shadow-xs"
                      }`}
                    >
                      {station.name.replace(" St", "")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Departures List Rendering */}
            <hr className="border-slate-100" />

            {loadingData && !transitData ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <RefreshCw className="w-8 h-8 mx-auto stroke-1 text-slate-400 animate-spin" />
                <p className="text-[11px] font-bold tracking-wider text-slate-600">Querying live API feeds...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* 1. BART DEPARTURES */}
                {selectedAgency === "bart" && (() => {
                  const stationDepartures = transitData?.bart?.[selectedBartStation] || [];
                  if (stationDepartures.length === 0) {
                    return (
                      <div className="text-center py-10 text-slate-400 text-xs font-medium tracking-wide bg-slate-50 border border-slate-100 rounded-xl">
                        No active departures scheduled.
                      </div>
                    );
                  }
                  return stationDepartures.map((dep: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="border border-slate-100 bg-white p-3 rounded-xl shadow-xs hover:bg-slate-50 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: dep.color }}
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800 leading-none mb-1">
                            {dep.destination}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold tracking-wider">
                            <span>Plat {dep.platform || "1"}</span>
                            <span>•</span>
                            <span>{dep.direction}bound</span>
                            {dep.length && (
                              <>
                                <span>•</span>
                                <span>{dep.length}-Car</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-1 text-[10px] font-semibold border rounded-lg font-mono shadow-xs ${
                          dep.minutes === 0 || dep.minutes === "Leaving"
                            ? "bg-rose-50 border-rose-100 text-rose-600"
                            : dep.minutes === 1
                            ? "bg-amber-50 border-amber-100 text-amber-600"
                            : "bg-slate-50 border-slate-100 text-slate-700"
                        }`}>
                          {dep.minutes === 0 || dep.minutes === "Leaving" 
                            ? "Leaving" 
                            : `${dep.minutes} min`}
                        </span>
                      </div>
                    </div>
                  ));
                })()}

                {/* 2. MUNI METRO DEPARTURES */}
                {selectedAgency === "muni" && (() => {
                  const muniLines = transitData?.muni || {};
                  const keys = Object.keys(muniLines);
                  if (keys.length === 0) {
                    return (
                      <div className="text-center py-10 text-slate-400 text-xs font-medium tracking-wide bg-slate-50 border border-slate-100 rounded-xl">
                        No active departures scheduled.
                      </div>
                    );
                  }
                  return keys.map((lineKey) => (
                    <div key={lineKey} className="space-y-1.5">
                      <div className="text-[9px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mt-3 mb-1 uppercase">
                        <Bus className="w-3.5 h-3.5 text-red-500" />
                        <span>Line {lineKey} Metro</span>
                      </div>
                      
                      {muniLines[lineKey].map((dep: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="border border-slate-100 bg-white p-3 rounded-xl shadow-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-800 leading-none mb-1">
                              {dep.destination}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold tracking-wider">
                              <span>{dep.platform}</span>
                              <span>•</span>
                              <span>{dep.direction}bound</span>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <span className={`px-2 py-1 text-[10px] font-semibold border rounded-lg shadow-xs ${
                              dep.minutes <= 1 
                                ? "bg-rose-50 border-rose-100 text-rose-600" 
                                : "bg-slate-50 border-slate-100 text-slate-700"
                            }`}>
                              {dep.minutes === 0 ? "Arrived" : dep.minutes === 1 ? "Leaving" : `${dep.minutes} min`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
                })()}

                {/* 3. CALTRAIN DEPARTURES */}
                {selectedAgency === "caltrain" && (() => {
                  const caltrainDeps = transitData?.caltrain || [];
                  if (caltrainDeps.length === 0) {
                    return (
                      <div className="text-center py-10 text-slate-400 text-xs font-medium tracking-wide bg-slate-50 border border-slate-100 rounded-xl">
                        No commuter trains scheduled currently.
                      </div>
                    );
                  }
                  return caltrainDeps.map((dep: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="border border-slate-100 bg-white p-3 rounded-xl shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Train className="w-4 h-4 text-black shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800 leading-none mb-1">
                            {dep.destination}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold tracking-wider">
                            <span>Train {dep.trainNo}</span>
                            <span>•</span>
                            <span className="text-green-600 font-bold">{dep.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="px-2 py-1 text-[10px] font-semibold border rounded-lg shadow-xs bg-slate-50 border-slate-100 text-slate-700">
                          {dep.minutes} min
                        </span>
                      </div>
                    </div>
                  ));
                })()}

                {/* 4. CABLE CARS */}
                {selectedAgency === "cableCar" && (() => {
                  const cableCars = transitData?.cableCar || [];
                  if (cableCars.length === 0) {
                    return (
                      <div className="text-center py-10 text-slate-400 text-xs font-medium tracking-wide bg-slate-50 border border-slate-100 rounded-xl">
                        No cable car schedules active.
                      </div>
                    );
                  }
                  return cableCars.map((dep: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="border border-slate-100 bg-white p-3 rounded-xl shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Anchor className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800 leading-none mb-1">
                            {dep.destination}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold tracking-wider">
                            <span>Line {dep.line}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">{dep.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="px-2 py-1 text-[10px] font-semibold border rounded-lg shadow-xs bg-slate-50 border-slate-100 text-slate-700">
                          {dep.minutes} min
                        </span>
                      </div>
                    </div>
                  ));
                })()}

                {/* 5. PHOENIX TRANSPORTATION */}
                {selectedAgency === "phoenix" && (() => {
                  const phoenixDeps = transitData?.phoenix || [];
                  if (phoenixDeps.length === 0) {
                    return (
                      <div className="text-center py-10 text-slate-400 text-xs font-medium tracking-wide bg-slate-50 border border-slate-100 rounded-xl">
                        No Phoenix Transportation shuttles active.
                      </div>
                    );
                  }
                  return phoenixDeps.map((dep: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="border border-slate-100 bg-white p-3 rounded-xl shadow-xs flex items-center justify-between hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bus className="w-4 h-4 text-orange-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800 leading-none mb-1">
                            {dep.destination}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold tracking-wider">
                            <span>{dep.line}</span>
                            <span>•</span>
                            <span className="text-orange-600 font-bold">{dep.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="px-2.5 py-1 text-[10px] font-semibold border rounded-lg shadow-xs bg-orange-50 border-orange-100 text-orange-700 font-mono">
                          {dep.minutes} min
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        ) : (
          /* Live advisories Tab */
          <div className="space-y-4">
            <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-[9px] font-bold text-blue-950 tracking-wider flex items-center gap-1 uppercase">
                  Intelligence Feed Source
                </h4>
                <p className="text-[10px] text-blue-950 leading-relaxed font-medium">
                  The advisories board scans and consolidates delay announcements, tweets, and maintenance updates across major Bay Area transit agency systems.
                </p>
              </div>
            </div>

            {loadingAlerts && alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <RefreshCw className="w-8 h-8 mx-auto stroke-1 text-slate-400 animate-spin" />
                <p className="text-xs font-bold tracking-wider">Scanning live service alerts...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, idx) => {
                  const styling = getAlertStyle(alert.type);
                  return (
                    <div 
                      key={idx} 
                      className={`border p-3.5 rounded-xl shadow-xs ${styling.bg}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {styling.icon}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold bg-slate-800 text-white rounded px-1.5 py-0.5">
                                {alert.agency}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-150">
                                {alert.line}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8px] font-bold rounded px-1.5 py-0.5 tracking-wider ${styling.badge}`}>
                                {alert.type}
                              </span>
                              <span className="text-[9px] text-slate-500 font-bold font-mono">
                                {alert.time}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-800 leading-relaxed font-semibold pt-1">
                            {alert.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer advice */}
      <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 text-[9px] text-slate-400 font-medium flex items-center justify-center gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Schedules sourced in real-time from official transit network XML endpoints.</span>
      </div>
    </div>
  );
}
