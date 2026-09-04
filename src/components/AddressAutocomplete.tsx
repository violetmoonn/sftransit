import React, { useState, useRef, useEffect } from "react";
import { MapPin, X, Navigation } from "lucide-react";
import { neighborhoods } from "../data/neighborhoods";
import { sfLandmarks, Landmark } from "../data/landmarks";

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: string; // This is the neighborhoodId
  onSelect: (neighborhoodId: string, displayName: string) => void;
  excludeIds?: string[];
  indicatorColor: string;
  timelineLabel: string;
}

export default function AddressAutocomplete({
  label,
  placeholder,
  value,
  onSelect,
  excludeIds = [],
  indicatorColor,
  timelineLabel,
}: AddressAutocompleteProps) {
  // We want to display the actual name/address in the input field.
  // Let's resolve the current display text. If it is a neighborhood ID, we show the neighborhood name.
  const resolvedNeighborhood = neighborhoods.find((n) => n.id === value);
  const initialDisplayText = resolvedNeighborhood ? resolvedNeighborhood.name : "";

  const [inputValue, setInputValue] = useState(initialDisplayText);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if value changes from outside (e.g. route reverse or preset click)
  useEffect(() => {
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

    // Combine and limit results
    return [...matchedLandmarks, ...matchedNeighborhoods].slice(0, 6);
  }, [inputValue, excludeIds]);

  const handleFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleSelectSuggestion = (neighborhoodId: string, displayName: string) => {
    setInputValue(displayName);
    setIsOpen(false);
    onSelect(neighborhoodId, displayName);
  };

  const handleClear = () => {
    setInputValue("");
    onSelect("", "");
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
          />

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
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
            <div className="bg-slate-50 px-3 py-1 border-b border-slate-150 flex items-center justify-between">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                {!inputValue ? "⚡ Popular Destinations" : "🔍 Matching Results"}
              </span>
              <span className="text-[7.5px] text-slate-400">Autofills district zone</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(s.neighborhoodId, s.name)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50/80 active:bg-slate-100 transition-colors flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {s.name}
                      </span>
                      <span className="text-[8px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5">
                        <Navigation className="w-2 h-2 text-slate-400" />
                        {s.neighborhoodName}
                      </span>
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-medium line-clamp-1">
                      {s.subtitle}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
