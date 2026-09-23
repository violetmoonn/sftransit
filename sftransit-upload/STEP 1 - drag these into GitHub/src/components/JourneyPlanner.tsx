import React, { useState, useMemo } from "react";
import { neighborhoods } from "../data/neighborhoods";
import { JourneyStep, TransitType } from "../types";
import AddressAutocomplete from "./AddressAutocomplete";
import { 
  MapPin, 
  ArrowRightLeft, 
  Navigation, 
  Clock, 
  AlertCircle, 
  Zap, 
  DollarSign, 
  Award,
  Compass,
  Check,
  ChevronRight,
  Info,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface FareComponent {
  agency: string;
  amount: number;
  description: string;
}

interface FareBreakdown {
  baseFare: number;
  components: FareComponent[];
  transferDiscounts: FareComponent[];
  totalCost: number;
}

interface RouteOption {
  id: "fast" | "value" | "scenic";
  title: string;
  badge: string;
  badgeColor: string;
  totalTime: number; // in minutes
  price: number; // in USD
  pros: string[];
  cons: string[];
  description: string;
  steps: JourneyStep[];
  isRecommended: boolean;
  recommendationReason?: string;
  fareBreakdown: FareBreakdown;
}

interface JourneyPlannerProps {
  onSelectNeighborhood: (id: string | null) => void;
}

export function calculateAggregateFare(steps: JourneyStep[]): FareBreakdown {
  const components: FareComponent[] = [];
  const transferDiscounts: FareComponent[] = [];
  
  let muniBoardings = 0;
  let bartBoardings = 0;
  let cableCarBoardings = 0;
  let caltrainBoardings = 0;
  let ferryBoardings = 0;

  steps.forEach((step) => {
    if (step.type === "muni-metro") {
      muniBoardings++;
      components.push({
        agency: "Muni Metro/Bus",
        amount: 2.50,
        description: step.line ? `Muni line ${step.line}` : "Local ride"
      });
    } else if (step.type === "bart") {
      bartBoardings++;
      components.push({
        agency: "BART Subway",
        amount: 3.45,
        description: step.line ? `BART ${step.line}` : "Subway ride"
      });
    } else if (step.type === "cable-car") {
      cableCarBoardings++;
      components.push({
        agency: "SF Cable Car",
        amount: 8.00,
        description: step.line ? `${step.line} ride` : "Historic cable car"
      });
    } else if (step.type === "caltrain") {
      caltrainBoardings++;
      components.push({
        agency: "Caltrain Rail",
        amount: 3.75,
        description: "Zone 1 commute"
      });
    } else if (step.type === "ferry") {
      ferryBoardings++;
      components.push({
        agency: "SF Bay Ferry",
        amount: 4.50,
        description: "Water transit connection"
      });
    } else if (step.type === "phoenix") {
      components.push({
        agency: "Phoenix Transportation",
        amount: 4.00,
        description: step.line ? `${step.line}` : "Phoenix Express Shuttle"
      });
    }
  });

  // Apply Transit Transfer Rules
  // Rule 1: Muni-to-Muni 2-Hour free transfer window
  if (muniBoardings > 1) {
    const savings = (muniBoardings - 1) * 2.50;
    transferDiscounts.push({
      agency: "Muni Clipper Transfer",
      amount: -savings,
      description: `Free connection within 2h window (${muniBoardings - 1} transfer${muniBoardings - 1 > 1 ? "s" : ""})`
    });
  }

  // Rule 2: BART-to-Muni / Muni-to-BART Clipper transfer discount ($0.50 off)
  if (bartBoardings > 0 && muniBoardings > 0) {
    transferDiscounts.push({
      agency: "BART ↔ Muni Clipper Discount",
      amount: -0.50,
      description: "Inter-agency connection credit"
    });
  }

  const baseFare = components.reduce((sum, c) => sum + c.amount, 0);
  const discountTotal = transferDiscounts.reduce((sum, d) => sum + d.amount, 0);
  const totalCost = Math.max(0, baseFare + discountTotal);

  return {
    baseFare,
    components,
    transferDiscounts,
    totalCost
  };
}

// Specific Leg Steps Generator to maintain hyper-realistic fidelity
function getLegSteps(start: string, end: string, startObj: any, endObj: any, baseMinutes: number): {
  fastSteps: JourneyStep[];
  valueSteps: JourneyStep[];
  scenicSteps: JourneyStep[];
} {
  let fastSteps: JourneyStep[] = [];
  let valueSteps: JourneyStep[] = [];
  let scenicSteps: JourneyStep[] = [];

  // Specific Override: Richmond to Downtown
  if (start === "richmond" && end === "downtown") {
    fastSteps = [
      { instruction: "Walk to Geary Blvd & 19th Ave.", type: "walk", duration: "3 mins" },
      { instruction: "Board Muni 38R Geary Rapid Eastbound (underground priority lanes).", type: "muni-metro", line: "38R Geary Rapid", duration: "16 mins" },
      { instruction: "Exit at Montgomery St Station and walk to destination.", type: "walk", duration: "3 mins" }
    ];
    valueSteps = [
      { instruction: "Walk to California St & 19th Ave.", type: "walk", duration: "4 mins" },
      { instruction: "Board Muni Bus 1 California Eastbound.", type: "muni-metro", line: "Muni 1 Local", duration: "25 mins" },
      { instruction: "Exit at Financial District (Sansom St) and walk 2 blocks.", type: "walk", duration: "3 mins" }
    ];
    scenicSteps = [
      { instruction: "Walk to Fulton St & 10th Ave.", type: "walk", duration: "5 mins" },
      { instruction: "Board Muni 5 Fulton Eastbound along Golden Gate Park.", type: "muni-metro", line: "Muni 5 Local", duration: "18 mins" },
      { instruction: "Transfer at Market & Powell. Board Powell-Hyde Cable Car over Nob Hill.", type: "cable-car", line: "Powell-Hyde Cable Car", duration: "15 mins" },
      { instruction: "Disembark at Downtown/Market St terminus.", type: "walk", duration: "2 mins" }
    ];
  }
  // Specific Override: Sunset to Downtown
  else if (start === "sunset" && end === "downtown") {
    fastSteps = [
      { instruction: "Walk to Judah St & 19th Ave metro stop.", type: "walk", duration: "3 mins" },
      { instruction: "Board Muni Metro N-Judah Subway Eastbound.", type: "muni-metro", line: "N-Judah Light Rail", duration: "20 mins" },
      { instruction: "Ride directly through Sunset Tunnel. Exit at Montgomery Subway Station.", type: "muni-metro", line: "N-Judah", duration: "2 mins" }
    ];
    valueSteps = [
      { instruction: "Walk to Lincoln Way & 19th Ave.", type: "walk", duration: "4 mins" },
      { instruction: "Board Muni Bus 7 Haight Eastbound towards Downtown.", type: "muni-metro", line: "Muni 7 Local", duration: "32 mins" },
      { instruction: "Exit directly on Market St & 3rd St.", type: "walk", duration: "2 mins" }
    ];
    scenicSteps = [
      { instruction: "Walk into Golden Gate Park to de Young Museum.", type: "walk", duration: "8 mins" },
      { instruction: "Board Muni Bus 44 O'Shaughnessy Northbound to Richmond.", type: "muni-metro", line: "Muni 44", duration: "8 mins" },
      { instruction: "Board scenic Muni Bus 1 California over Pacific Heights with Bay view.", type: "muni-metro", line: "Muni 1 Local", duration: "28 mins" },
      { instruction: "Exit at Financial District.", type: "walk", duration: "4 mins" }
    ];
  }
  // Specific Override: Mission to Downtown
  else if (start === "mission" && end === "downtown") {
    fastSteps = [
      { instruction: "Walk 3 blocks to 16th St Mission BART Station.", type: "walk", duration: "4 mins" },
      { instruction: "Board any Northbound BART Train (Antioch or Richmond).", type: "bart", line: "BART Subway", duration: "6 mins" },
      { instruction: "Exit at Montgomery St Station and take the exit stairs.", type: "walk", duration: "2 mins" }
    ];
    valueSteps = [
      { instruction: "Walk to Mission St & 16th St.", type: "walk", duration: "2 mins" },
      { instruction: "Board Muni Bus 14R Mission Rapid Northbound.", type: "muni-metro", line: "14R Mission Rapid", duration: "14 mins" },
      { instruction: "Exit at Market St & 1st St.", type: "walk", duration: "2 mins" }
    ];
    scenicSteps = [
      { instruction: "Walk to the Dolores Park southwest corner.", type: "walk", duration: "6 mins" },
      { instruction: "Board Muni Metro J-Church light rail on street-level.", type: "muni-metro", line: "J-Church", duration: "16 mins" },
      { instruction: "Transfer at Market. Board historic vintage F-Market streetcar on surface.", type: "muni-metro", line: "F-Market Streetcar", duration: "12 mins" }
    ];
  }
  // Specific Override: Richmond to Sunset
  else if ((start === "richmond" && end === "sunset") || (start === "sunset" && end === "richmond")) {
    fastSteps = [
      { instruction: "Walk to 19th Ave & Geary Blvd.", type: "walk", duration: "4 mins" },
      { instruction: "Board Muni Bus 28 19th Ave Southbound.", type: "muni-metro", line: "Muni 28", duration: "8 mins" },
      { instruction: "Exit immediately on the South side of Golden Gate Park (Lincoln Way).", type: "walk", duration: "2 mins" }
    ];
    valueSteps = [
      { instruction: "Walk to 10th Ave & Fulton St.", type: "walk", duration: "5 mins" },
      { instruction: "Board Muni Bus 44 O'Shaughnessy Southbound through the park museum hub.", type: "muni-metro", line: "Muni 44", duration: "10 mins" },
      { instruction: "Exit at 9th Ave & Irving St.", type: "walk", duration: "3 mins" }
    ];
    scenicSteps = [
      { instruction: "Walk past the de Young Museum and Japanese Tea Garden inside Golden Gate Park.", type: "walk", duration: "12 mins" },
      { instruction: "Stroll along Stow Lake past the waterfall and stone bridge.", type: "walk", duration: "15 mins" },
      { instruction: "Arrive at Lincoln Way border of Sunset district.", type: "walk", duration: "5 mins" }
    ];
  }
  // Generic Dynamic Generator for all other arbitrary combinations (Full Coverage!)
  else {
    // Fast Choice: Rapid subway / Train / BRT
    fastSteps = [
      { instruction: `Walk to the nearest rapid station in ${startObj.name}.`, type: "walk", duration: "5 mins" },
      { instruction: `Board a high-frequency Express Bus or regional BART train.`, type: "bart", line: "Subway / BRT Line", duration: `${Math.round(baseMinutes * 0.55)} mins` },
      { instruction: `Exit at the hub station nearest to ${endObj.name} and walk to your destination.`, type: "walk", duration: "3 mins" }
    ];

    // Best Value: Local flat fare bus
    valueSteps = [
      { instruction: `Walk to the nearest local Muni bus shelter.`, type: "walk", duration: "4 mins" },
      { instruction: `Board a flat-rate Muni Bus line directly towards your destination.`, type: "muni-metro", line: "Local Muni Bus", duration: `${Math.round(baseMinutes * 0.8)} mins` },
      { instruction: `Exit and walk 2 blocks to your destination in ${endObj.name}.`, type: "walk", duration: "3 mins" }
    ];

    // Scenic Option: Historic Streetcar / Scenic route
    scenicSteps = [
      { instruction: `Take a leisurely stroll through scenic parts of ${startObj.name}.`, type: "walk", duration: "8 mins" },
      { instruction: `Board an iconic, historic streetcar, Cable Car, or park-aligned bus line.`, type: "cable-car", line: "Scenic / Historic Route", duration: `${Math.round(baseMinutes * 1.1)} mins` },
      { instruction: `Walk the final block, appreciating local landmarks.`, type: "walk", duration: "4 mins" }
    ];
  }

  return { fastSteps, valueSteps, scenicSteps };
}

export default function JourneyPlanner({ onSelectNeighborhood }: JourneyPlannerProps) {
  const [start, setStart] = useState<string>("richmond");
  const [end, setEnd] = useState<string>("downtown");
  const [viaStops, setViaStops] = useState<string[]>([]);
  const [activeOptionId, setActiveOptionId] = useState<"fast" | "value" | "scenic">("fast");

  // Generate three robust, high-fidelity comparative options for any start/end/intermediate sequence
  const routeOptions = useMemo<RouteOption[] | null>(() => {
    const rawStops = [start, ...viaStops, end].filter(Boolean);
    // Filter out consecutive duplicates to prevent redundant route legs
    const filteredStops: string[] = [];
    for (const s of rawStops) {
      if (filteredStops.length === 0 || filteredStops[filteredStops.length - 1] !== s) {
        filteredStops.push(s);
      }
    }

    if (filteredStops.length < 2) return null;

    const stopObjects = filteredStops.map((id) => neighborhoods.find((n) => n.id === id)).filter((n): n is NonNullable<typeof n> => !!n);
    if (stopObjects.length < 2) return null;

    let totalFastTime = 0;
    let totalValueTime = 0;
    let totalScenicTime = 0;

    const combinedFastSteps: JourneyStep[] = [];
    const combinedValueSteps: JourneyStep[] = [];
    const combinedScenicSteps: JourneyStep[] = [];

    // Loop through each leg of the multi-stop journey
    for (let i = 0; i < stopObjects.length - 1; i++) {
      const legStartObj = stopObjects[i];
      const legEndObj = stopObjects[i + 1];
      const legStart = legStartObj.id;
      const legEnd = legEndObj.id;

      const dx = legStartObj.labelX - legEndObj.labelX;
      const dy = legStartObj.labelY - legEndObj.labelY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Calculate a realistic base travel duration (in minutes) proportional to canvas distance
      const baseMinutes = Math.max(10, Math.round(12 + dist * 0.05));

      const { fastSteps, valueSteps, scenicSteps } = getLegSteps(legStart, legEnd, legStartObj, legEndObj, baseMinutes);

      const fastTime = Math.max(8, Math.round(baseMinutes * 0.7));
      const valueTime = Math.round(baseMinutes * 1.05);
      const scenicTime = Math.round(baseMinutes * 1.45);

      totalFastTime += fastTime;
      totalValueTime += valueTime;
      totalScenicTime += scenicTime;

      // For subsequent legs, add transfer transition step before adding steps
      if (i > 0) {
        combinedFastSteps.push({
          instruction: `📍 Layover: Arrived at intermediate stop (${legStartObj.name}). Prepare to depart for next leg towards ${legEndObj.name}.`,
          type: "walk",
          duration: "3 mins"
        });
        totalFastTime += 3;

        combinedValueSteps.push({
          instruction: `📍 Layover: Arrived at intermediate stop (${legStartObj.name}). Walk to nearby bus connection for ${legEndObj.name}.`,
          type: "walk",
          duration: "4 mins"
        });
        totalValueTime += 4;

        combinedScenicSteps.push({
          instruction: `📸 Sightseeing Break: Take a brief wander around scenic ${legStartObj.name} before starting next leg to ${legEndObj.name}.`,
          type: "walk",
          duration: "5 mins"
        });
        totalScenicTime += 5;
      }

      combinedFastSteps.push(...fastSteps);
      combinedValueSteps.push(...valueSteps);
      combinedScenicSteps.push(...scenicSteps);
    }

    const fastFare = calculateAggregateFare(combinedFastSteps);
    const valueFare = calculateAggregateFare(combinedValueSteps);
    const scenicFare = calculateAggregateFare(combinedScenicSteps);

    // Build the options structure
    const options: RouteOption[] = [
      {
        id: "fast",
        title: "Rapid Transit Choice",
        badge: "Fastest Route",
        badgeColor: "bg-blue-600 text-white",
        totalTime: totalFastTime,
        price: fastFare.totalCost,
        fareBreakdown: fastFare,
        description: stopObjects.length > 2
          ? `Prioritizes speed for your multi-stop journey across ${stopObjects.length} neighborhoods by utilizing underground heavy rail (BART), rapid BRT lines, or express rail corridors.`
          : "Prioritizes speed by utilizing underground heavy rail (BART), rapid BRT lanes, or light rail. Completely bypasses surface street gridlocks.",
        pros: ["Saves significant total time", "Bypasses traffic bottlenecks", "Reliable scheduling"],
        cons: ["Higher cumulative fares", "Requires brisk walking paces during connections"],
        steps: combinedFastSteps,
        isRecommended: totalFastTime <= totalValueTime - 5,
        recommendationReason: `Highly recommended. Saves ${totalValueTime - totalFastTime} minutes over the local bus alternative for this multi-stop path.`
      },
      {
        id: "value",
        title: "Clipper Flat Rate",
        badge: "Best Value",
        badgeColor: "bg-amber-600 text-white",
        totalTime: totalValueTime,
        price: valueFare.totalCost,
        fareBreakdown: valueFare,
        description: "Standard local Muni routes with flat-rate fares and 2-hour free transfer windows.",
        pros: ["Most cost-effective route combination ($2.50 base)", "Free transfer rules apply between legs"],
        cons: ["Subject to street level delays", "More overall stops"],
        steps: combinedValueSteps,
        isRecommended: totalFastTime > totalValueTime - 5,
        recommendationReason: "Best balance of cost and efficiency. Slower speed is offset by substantial fare savings and seamless Clipper transfers."
      },
      {
        id: "scenic",
        title: "Cable Car & Scenic",
        badge: "Scenic Route",
        badgeColor: "bg-emerald-600 text-white",
        totalTime: totalScenicTime,
        price: scenicFare.totalCost,
        fareBreakdown: scenicFare,
        description: "Classic San Francisco views, historic transit modes, and segments through famous parks.",
        pros: ["Breathtaking photogenic sights", "Includes historic fleet segments"],
        cons: ["Slowest overall pacing", "Higher premium fare if cable cars are boarded ($8/ride)"],
        steps: combinedScenicSteps,
        isRecommended: false,
        recommendationReason: "Unmatched visual journey. Handpicked for an unforgettable sightseeing experience across SF's iconic hills and parks."
      }
    ];

    const hasRec = options.some(o => o.isRecommended);
    if (!hasRec) {
      options[1].isRecommended = true;
    }

    return options;
  }, [start, viaStops, end]);

  const activeOption = useMemo(() => {
    if (!routeOptions) return null;
    return routeOptions.find((o) => o.id === activeOptionId) || routeOptions[0];
  }, [routeOptions, activeOptionId]);

  const handleSwap = () => {
    const temp = start;
    setStart(end);
    setEnd(temp);
    setViaStops([...viaStops].reverse());
  };

  const updateViaStop = (idx: number, value: string) => {
    const newStops = [...viaStops];
    newStops[idx] = value;
    setViaStops(newStops);
    if (value) onSelectNeighborhood(value);
  };

  const removeViaStop = (idx: number) => {
    const newStops = [...viaStops];
    newStops.splice(idx, 1);
    setViaStops(newStops);
  };

  const addViaStop = () => {
    setViaStops([...viaStops, ""]);
  };

  const getStepIconColor = (type: TransitType | "walk") => {
    switch (type) {
      case "bart":
        return "bg-blue-600 text-white";
      case "muni-metro":
        return "bg-red-600 text-white";
      case "caltrain":
        return "bg-black text-white";
      case "cable-car":
        return "bg-emerald-600 text-white";
      case "phoenix":
        return "bg-orange-600 text-white";
      default:
        return "bg-slate-200 text-slate-600";
    }
  };

  const getStepBadgeName = (type: TransitType | "walk") => {
    switch (type) {
      case "bart":
        return "BART";
      case "muni-metro":
        return "Muni";
      case "caltrain":
        return "Caltrain";
      case "cable-car":
        return "Cable Car";
      case "phoenix":
        return "Phoenix Express";
      default:
        return "Walk";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[350px] overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Compare & Contrast Planner</h2>
        </div>
      </div>

      {/* Selector Panels */}
      <div className="p-4 bg-slate-50/50 border-b border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">
            Journey Waypoint Timeline
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSwap}
              disabled={!start && !end}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition-all shadow-xs cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
              title="Reverse Whole Route"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Reverse Route</span>
            </button>
            {viaStops.length > 0 && (
              <button
                onClick={() => setViaStops([])}
                className="px-2.5 py-1.5 border border-rose-200 rounded-lg bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-rose-700 transition-all shadow-xs cursor-pointer"
              >
                Clear In-Between
              </button>
            )}
          </div>
        </div>

        <div className="relative pl-6 space-y-3">
          {/* Timeline Connector Dashed Line */}
          <div className="absolute left-2.5 top-3 bottom-3 w-px border-l border-dashed border-slate-200 pointer-events-none" />

          {/* 1. START POINT (Current Location) */}
          <AddressAutocomplete
            label="Current Location (Start)"
            placeholder="Type address, landmark, or select zone..."
            value={start}
            onSelect={(neighborhoodId) => {
              setStart(neighborhoodId);
              if (neighborhoodId) onSelectNeighborhood(neighborhoodId);
            }}
            excludeIds={[end, ...viaStops]}
            indicatorColor="bg-blue-600"
            timelineLabel="A"
          />

          {/* 2. IN-BETWEEN STOPS (Dynamic) */}
          {viaStops.map((stopId, idx) => (
            <div key={idx} className="relative flex items-center gap-3 animate-fade-in w-full">
              <div className="flex-1 min-w-0">
                <AddressAutocomplete
                  label={`In-Between Stop #${idx + 1}`}
                  placeholder="Type address, landmark, or select zone..."
                  value={stopId}
                  onSelect={(neighborhoodId) => updateViaStop(idx, neighborhoodId)}
                  excludeIds={[start, end, ...viaStops.filter((_, sIdx) => sIdx !== idx)]}
                  indicatorColor="bg-amber-500"
                  timelineLabel={String(idx + 1)}
                />
              </div>

              {/* Reordering and deleting controls */}
              <div className="flex gap-1 shrink-0 pt-4 self-end">
                <button
                  type="button"
                  onClick={() => {
                    if (idx > 0) {
                      const newStops = [...viaStops];
                      const temp = newStops[idx];
                      newStops[idx] = newStops[idx - 1];
                      newStops[idx - 1] = temp;
                      setViaStops(newStops);
                    }
                  }}
                  disabled={idx === 0}
                  className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer shadow-xs"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (idx < viaStops.length - 1) {
                      const newStops = [...viaStops];
                      const temp = newStops[idx];
                      newStops[idx] = newStops[idx + 1];
                      newStops[idx + 1] = temp;
                      setViaStops(newStops);
                    }
                  }}
                  disabled={idx === viaStops.length - 1}
                  className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer shadow-xs"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => removeViaStop(idx)}
                  className="p-1.5 border border-rose-100 rounded-lg bg-rose-50 hover:bg-rose-100 cursor-pointer shadow-xs"
                  title="Remove Stop"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                </button>
              </div>
            </div>
          ))}

          {/* 3. ADD WAYPOINT BUTTON (Sits on the dashed line) */}
          <div className="relative pl-0 py-1">
            <button
              onClick={addViaStop}
              className="px-3 py-1.5 border border-emerald-200 rounded-lg bg-emerald-50 hover:bg-emerald-100/70 text-[10px] font-bold text-emerald-700 transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3 stroke-[3px]" />
              <span>Add In-Between Stop</span>
            </button>
          </div>

          {/* 4. FINAL DESTINATION */}
          <AddressAutocomplete
            label="Final Destination"
            placeholder="Type address, landmark, or select zone..."
            value={end}
            onSelect={(neighborhoodId) => {
              setEnd(neighborhoodId);
              if (neighborhoodId) onSelectNeighborhood(neighborhoodId);
            }}
            excludeIds={[start, ...viaStops]}
            indicatorColor="bg-red-600"
            timelineLabel="🏁"
          />
        </div>
      </div>

      {/* Results Deck */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!routeOptions ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Compass className="w-10 h-10 mx-auto stroke-1 text-slate-300 animate-spin-slow" />
            <p className="text-xs font-bold tracking-wider text-slate-400">Select start & destination</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Compare price, speed, scenery, and details instantly across Muni, BART, and Cable Car networks.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* COMPARISON TICKETS DECK */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {routeOptions.map((option) => {
                const isActive = activeOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setActiveOptionId(option.id)}
                    className={`text-left p-4 rounded-xl border flex flex-col justify-between transition-all cursor-pointer shadow-xs relative ${
                      isActive 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {/* Recommendation Badge overlay */}
                    {option.isRecommended && (
                      <span className="absolute -top-2.5 -right-1.5 bg-blue-600 text-[8px] font-bold text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5 shrink-0" />
                        <span>Recommended</span>
                      </span>
                    )}

                    <div className="space-y-1">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-wider ${
                        isActive ? "bg-white/10 text-white border-white/20" : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {option.badge}
                      </span>
                      <h4 className="text-xs font-bold tracking-tight pt-1 leading-tight">
                        {option.title}
                      </h4>
                    </div>

                    <div className="flex items-end justify-between border-t border-dashed border-slate-400/40 mt-3 pt-2">
                      <div>
                        <span className="text-[8px] font-bold block leading-none text-slate-400 uppercase tracking-wider">
                          Duration
                        </span>
                        <span className="text-sm font-semibold leading-none font-mono">
                          {option.totalTime} mins
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-bold block leading-none text-slate-400 uppercase tracking-wider">
                          Est. Fare
                        </span>
                        <span className="text-sm font-semibold leading-none font-mono text-emerald-500">
                          ${option.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* DECISION GUIDANCE ADVISORY BANNER */}
            {activeOption?.isRecommended && activeOption.recommendationReason && (
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl flex items-start gap-2.5">
                <Award className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-blue-800 tracking-wider flex items-center gap-1 uppercase">
                    Decision Guide: Smart Recommendation
                  </h4>
                  <p className="text-[11px] text-blue-950 leading-relaxed font-semibold">
                    {activeOption.recommendationReason}
                  </p>
                </div>
              </div>
            )}

            {!activeOption?.isRecommended && (
              <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl flex items-start gap-2.5">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-amber-800 tracking-wider uppercase">
                    Decision Guide: Alternative Choice
                  </h4>
                  <p className="text-[11px] text-amber-950 leading-relaxed font-semibold">
                    {activeOption?.id === "scenic" 
                      ? "This route emphasizes tourism and sightseeing. Keep in mind it will take longer and cost more if boarding historic Cable Cars ($8.00/ride), but features world-class bay views."
                      : "An efficient route choice. Check the comparative tabs above to see how this compares in price and time against the fastest option."}
                  </p>
                </div>
              </div>
            )}

            {/* EXPANDED OPTION SUMMARY DETAILS */}
            <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-xs font-bold tracking-wider text-slate-800 flex items-center gap-1.5 uppercase">
                    <span>Itinerary Details: {activeOption?.title}</span>
                  </h3>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg font-semibold">
                      ⏱ {activeOption?.totalTime} mins
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-semibold">
                      ${activeOption?.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                  {activeOption?.description}
                </p>
              </div>

              {/* FARE & TRANSFER COST BREAKDOWN */}
              {activeOption?.fareBreakdown && (
                <div className="bg-slate-50/80 border border-slate-150 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 tracking-wider uppercase flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Clipper® Fare & Transfer Breakdown
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-150">
                      Total Cost: ${activeOption.fareBreakdown.totalCost.toFixed(2)}
                    </span>
                  </div>

                  {activeOption.fareBreakdown.components.length > 0 ? (
                    <div className="space-y-2">
                      {/* Base Fares List */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase">Boarding Fares</span>
                        {activeOption.fareBreakdown.components.map((comp, cIdx) => (
                          <div key={cIdx} className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                            <span>{comp.agency} <span className="text-slate-400 text-[10px]">({comp.description})</span></span>
                            <span className="font-mono text-slate-800 font-semibold">${comp.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Transfer Discounts List */}
                      {activeOption.fareBreakdown.transferDiscounts.length > 0 && (
                        <div className="border-t border-dashed border-slate-200 pt-2 space-y-1">
                          <span className="text-[9px] font-bold text-emerald-600 tracking-wider block uppercase">Transfer Discounts</span>
                          {activeOption.fareBreakdown.transferDiscounts.map((disc, dIdx) => (
                            <div key={dIdx} className="flex justify-between items-center text-[11px] font-bold text-emerald-600">
                              <span className="flex items-center gap-1">
                                <span className="bg-emerald-100 text-[8px] px-1 rounded text-emerald-700 font-extrabold uppercase text-[7px]">Discount</span>
                                {disc.agency} <span className="text-emerald-500/80 font-normal text-[10px]">({disc.description})</span>
                              </span>
                              <span className="font-mono">-${Math.abs(disc.amount).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Total Cost Summary Line */}
                      <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs font-bold text-slate-800">
                        <span>Total Aggregate Fare</span>
                        <span className="font-mono text-sm text-emerald-600">${activeOption.fareBreakdown.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500">Free journey. No transit systems boarded.</p>
                  )}
                </div>
              )}

              {/* STEP-BY-STEP PATH */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase">
                  Direction Guidance Steps
                </span>

                <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-4">
                  {activeOption?.steps.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Indicator Dot */}
                      <span
                        className={`absolute -left-[22px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border border-white shadow-xs ${getStepIconColor(
                          step.type
                        )}`}
                      >
                        {idx + 1}
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] font-bold px-1.5 py-0.5 border border-slate-200 rounded bg-slate-50 text-slate-500 tracking-wider">
                            {getStepBadgeName(step.type)}
                          </span>
                          {step.line && (
                            <span className="text-[9px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 rounded">
                              {step.line}
                            </span>
                          )}
                          {step.duration && (
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              ~ {step.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {step.instruction}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Local advisory tip */}
            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h5 className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Clipper Card Advice</h5>
                <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                  BART, Muni Metro, Caltrain, and Cable Cars all accept Clipper Card (and digital wallet clones). Free transfer discounts apply when connecting between BART and Muni within a 1-hour window!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
