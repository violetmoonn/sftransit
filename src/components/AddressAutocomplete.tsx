import React, { useState, useRef, useEffect } from "react";
import { MapPin, X, Navigation, Loader2 } from "lucide-react";
import { neighborhoods } from "../data/neighborhoods";
import { sfLandmarks, Landmark } from "../data/landmarks";

import { searchPlaces, nearestNeighborhood, FreePlace } from "../lib/freeMaps";

type GooglePlace = FreePlace; // address results (free OpenStreetMap search, no API key)

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: string; // This is the neighborhoodId
  // `where` is what Google should route to: "place:<id>" or "addr:<address>"
  onSelect: (neighborhoodId: string, displayName: string, where: string) => void;
  excludeIds?: string[];
  initialLabel?: string; // text to show for the current value (e.g. a street address)
  indicatorColor: string;
  timelineLabel: string;
}

export default function AddressAutocomplete({
  label,
  placeholder,
  value,
  onSelect,
  excludeIds = [],
  initialLabel,
  indicatorColor,
  timelineLabel,
}: AddressAutocompleteProps) {
  // We want to display the actual name/address in the input field.
  // Let's resolve the current display text. If it is a neighborhood ID, we show the neighborhood name.
  const resolvedNeighborhood = neighborhoods.find((n) => n.id === value);
  const initialDisplayText = initialLabel || (resolvedNeighborhood ? resolvedNeighborhood.name : "");

  const [inputValue, setInputValue] = useState(initialDisplayText);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [googleResults, setGoogleResults] = useState<GooglePlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  // Remembers the exact text the user picked (e.g. a street address) so it isn't
  // replaced by the neighborhood name when the planner updates.
  const lastPicked = useRef<{ id: string; label: string } | null>(
    value && initialLabel ? { id: value, label: initialLabel } : null
  );
  const typed = useRef(false);

  // Sync state if value changes from outside (e.g. route reverse or preset click)
  useEffect(() => {
    if (value && lastPicked.current?.id === value) {
      setInputValue(lastPicked.current.label);
      return;
    }
    if (value) {
      const neighborhood = neighborhoods.find((n) => n.id === value);
      if (neighborhood) {
        // Find if any landmark was selected previously, or default to neighborhood name
        const matchingLandmark = sfLandmarks.find(
          (l) => l.neighborhoodId === value && l.name.toLowerCase() === inputValue.toLowerCase()
        );
        if (matchingLandmark) {
          setInputValue(matchingLandmark.name);
        } else {
          setInputValue(neighborhood.name);
        }
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live address suggestions (free OpenStreetMap search, no key needed)
  useEffect(() => {
    const term = inputValue.trim();
    if (!typed.current || term.length < 2) {
      setGoogleResults([]);
      setSearching(false);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        setGoogleResults(await searchPlaces(term, ctrl.signal));
      } catch {
        if (!ctrl.signal.aborted) setGoogleResults([]);
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [inputValue]);

  // Compute matches based on search term
  const suggestions = React.useMemo(() => {
    const term = inputValue.trim().toLowerCase();

    // 1. If empty, return a set of popular SF landmarks as defaults
    if (!term) {
      const defaultLandmarks = sfLandmarks.filter(
        (l) => !excludeIds.includes(l.neighborhoodId)
      ).slice(0, 5);

      return defaultLandmarks.map((l) => ({
        type: "landmark" as const,
        id: l.name,
        name: l.name,
        subtitle: l.address,
        neighborhoodId: l.neighborhoodId,
        neighborhoodName: neighborhoods.find((n) => n.id === l.neighborhoodId)?.name || "",
      }));
    }

    // 2. Otherwise, filter landmarks and neighborhoods by search term
    const matchedLandmarks = sfLandmarks
      .filter(
        (l) =>
          !excludeIds.includes(l.neighborhoodId) &&
          (l.name.toLowerCase().includes(term) || l.address.toLowerCase().includes(term))
      )
      .map((l) => ({
        type: "landmark" as const,
        id: l.name,
        name: l.name,
        subtitle: l.address,
        neighborhoodId: l.neighborhoodId,
        neighborhoodName: neighborhoods.find((n) => n.id === l.neighborhoodId)?.name || "",
      }));

    const matchedNeighborhoods = neighborhoods
      .filter(
        (n) =>
          !excludeIds.includes(n.id) &&
          (n.name.toLowerCase().includes(term) || n.description.toLowerCase().includes(term))
      )
      .map((n) => ({
        type: "neighborhood" as const,
        id: n.id,
        name: n.name,
        subtitle: "SF District / Neighborhood Zone",
        neighborhoodId: n.id,
        neighborhoodName: n.name,
      }));

    // Combine and limit results (fewer local ones when Google has answers)
    return [...matchedLandmarks, ...matchedNeighborhoods].slice(0, googleResults.length ? 3 : 6);
  }, [inputValue, excludeIds, googleResults.length]);

  type Option =
    | { kind: "google"; key: string; name: string; subtitle: string; place: GooglePlace }
    | { kind: "local"; key: string; name: string; subtitle: string; neighborhoodId: string; neighborhoodName: string };

  const options: Option[] = [
    ...googleResults.map((g) => ({ kind: "google" as const, key: "g:" + g.placeId, name: g.name, subtitle: g.address, place: g })),
    ...suggestions.map((s) => ({
      kind: "local" as const,
      key: "l:" + s.type + ":" + s.id,
      name: s.name,
      subtitle: s.subtitle,
      neighborhoodId: s.neighborhoodId,
      neighborhoodName: s.neighborhoodName,
    })),
  ];

  useEffect(() => setHighlight(-1), [inputValue, googleResults]);

  const handleFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    typed.current = true;
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleSelectSuggestion = (neighborhoodId: string, displayName: string, where: string) => {
    typed.current = false;
    lastPicked.current = { id: neighborhoodId, label: displayName };
    setInputValue(displayName);
    setGoogleResults([]);
    setIsOpen(false);
    onSelect(neighborhoodId, displayName, where);
  };

  const handleSelectGoogle = (g: GooglePlace) => {
    typed.current = false;
    const street = (g.address || "").split(",")[0].trim();
    const label = street && !street.toLowerCase().includes(g.name.toLowerCase()) && !/^san francisco$/i.test(street)
      ? `${g.name}, ${street}`
      : g.name;
    setInputValue(label);
    setGoogleResults([]);
    setIsOpen(false);
    const id = nearestNeighborhood(g.lat, g.lng);
    lastPicked.current = { id, label };
    onSelect(id, label, g.placeId); // placeId is "ll:<lat>,<lng>"
  };

  const choose = (o: Option) =>
    o.kind === "google"
      ? handleSelectGoogle(o.place)
      : handleSelectSuggestion(o.neighborhoodId, o.name, "addr:" + (o.subtitle.includes(",") ? o.subtitle : o.name));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) setIsOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && isOpen && options.length) {
      e.preventDefault();
      choose(options[Math.max(highlight, 0)]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    lastPicked.current = null;
    setGoogleResults([]);
    setInputValue("");
    onSelect("", "", "");
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative flex items-start gap-3 w-full">
      {/* Visual Timeline Marker on the Left */}
      <div
        className={`absolute -left-[21px] top-1.5 w-4.5 h-4.5 rounded-full border border-white shadow-xs flex items-center justify-center text-[9px] font-black text-white shrink-0 z-10 select-none ${indicatorColor}`}
      >
        {timelineLabel}
      </div>

      <div className="flex-1 space-y-0.5">
        <label className="text-[8.5px] font-bold text-slate-400 tracking-wider block uppercase">
          {label}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <input
            type="text"
            className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-350 shadow-xs transition-all"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
          />

          {searching && (
            <div className="absolute inset-y-0 right-7 flex items-center pointer-events-none">
              <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
            </div>
          )}
          {inputValue && (
            <button
              onClick={handleClear}
              type="button"
              className="absolute inset-y-0 right-2 flex items-center px-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Box for suggestions */}
        {isOpen && options.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto">
            <div className="bg-slate-50 px-3 py-1 border-b border-slate-150 flex items-center justify-between">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                {!inputValue ? "⚡ Popular Destinations" : googleResults.length ? "📍 Addresses & Places" : "🔍 Matching Results"}
              </span>
              <span className="text-[7.5px] text-slate-400">Autofills district zone</span>
            </div>
            <ul role="listbox" className="divide-y divide-slate-100">
              {options.map((o, i) => (
                <li key={o.key} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => choose(o)}
                    className={`w-full text-left px-3.5 py-2 transition-colors flex flex-col gap-0.5 ${i === highlight ? "bg-slate-100" : "hover:bg-slate-50/80"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1 flex items-center gap-1.5">
                        {o.kind === "google" && <MapPin className="w-3 h-3 text-red-500 shrink-0" />}
                        {o.name}
                      </span>
                      {o.kind === "local" && (
                        <span className="text-[8px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5">
                          <Navigation className="w-2 h-2 text-slate-400" />
                          {o.neighborhoodName}
                        </span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-medium line-clamp-1">{o.subtitle}</span>
                  </button>
                </li>
              ))}
            </ul>
            {googleResults.length > 0 && (
              <div className="px-3 py-1 border-t border-slate-100 text-right text-[8px] text-slate-400">Map data © OpenStreetMap</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
