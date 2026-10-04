import React, { useEffect, useState } from "react";
import { MapPin, Star, Plus, Trash2, Navigation, ExternalLink, X, Pencil } from "lucide-react";

type Kind = "often" | "visit";

interface Place {
  id: string;
  name: string;
  address: string;
  kind: Kind;
  note?: string;
  createdAt: number;
}

const STORE_KEY = "sftransit.places.v1";

function loadPlaces(): Place[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function savePlaces(list: Place[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {
    /* private mode or storage full: places just won't persist */
  }
}

const withCity = (a: string) =>
  /san francisco|,\s*ca\b|california|oakland|berkeley|daly city/i.test(a) ? a : `${a}, San Francisco, CA`;
const mapsSearch = (a: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(withCity(a))}`;
const mapsTransit = (a: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(withCity(a))}&travelmode=transit`;

function PlacePhoto({ address, name }: { address: string; name: string }) {
  // Street View photo from our server; if there's no photo (or no key yet), show the Google map instead.
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [address]);
  if (failed) {
    return (
      <div className="w-full h-36 bg-slate-100 flex flex-col items-center justify-center gap-1.5 text-slate-500">
        <MapPin className="w-6 h-6 text-rose-500" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-slate-600">View on Google Maps</span>
      </div>
    );
  }
  return (
    <img
      src={`/api/place-photo?q=${encodeURIComponent(address)}`}
      alt={`Street view of ${name}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-full h-36 object-cover bg-slate-100"
    />
  );
}

const emptyForm = { name: "", address: "", kind: "often" as Kind, note: "" };

export default function SavedPlaces() {
  const [places, setPlaces] = useState<Place[]>(() => loadPlaces());
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => savePlaces(places), [places]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (p: Place) => {
    setEditingId(p.id);
    setForm({ name: p.name, address: p.address, kind: p.kind, note: p.note || "" });
    setError("");
    setFormOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim().slice(0, 60);
    const address = form.address.trim().slice(0, 160);
    if (!address) return setError("Add an address or place name.");
    const entry = { name: name || address, address, kind: form.kind, note: form.note.trim().slice(0, 140) };
    if (editingId) {
      setPlaces((list) => list.map((p) => (p.id === editingId ? { ...p, ...entry } : p)));
    } else {
      setPlaces((list) => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now(), ...entry }, ...list]);
    }
    if (filter !== "all" && filter !== entry.kind) setFilter("all");
    setFormOpen(false);
  };

  const remove = (id: string) => setPlaces((list) => list.filter((p) => p.id !== id));

  const shown = places.filter((p) => filter === "all" || p.kind === filter);
  const count = (k: Kind) => places.filter((p) => p.kind === k).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[350px] overflow-hidden">
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-500" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">My Places</h2>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-[0.06em] hover:bg-slate-700 cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Pin a place
        </button>
      </div>

      <div className="flex border-b border-slate-200" role="group" aria-label="Filter places">
        {([
          ["all", `All · ${places.length}`],
          ["often", `Visit often · ${count("often")}`],
          ["visit", `Want to go · ${count("visit")}`],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            aria-pressed={filter === k}
            className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.06em] border-r border-slate-200 last:border-r-0 cursor-pointer ${
              filter === k ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {formOpen && (
          <form onSubmit={submit} className="border border-slate-300 p-3 space-y-2.5 bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                {editingId ? "Edit place" : "Pin a new place"}
              </span>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Close" className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block space-y-1">
              <span className="text-[9px] font-bold text-slate-500 tracking-wider block uppercase">Address or place</span>
              <input
                autoFocus
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. Ferry Building, or 1 Dr Carlton B Goodlett Pl"
                className="w-full border border-slate-300 bg-white px-2.5 py-2 text-sm focus:outline-none focus:border-slate-900"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[9px] font-bold text-slate-500 tracking-wider block uppercase">Name (optional)</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Work, Mom's place, Gym"
                className="w-full border border-slate-300 bg-white px-2.5 py-2 text-sm focus:outline-none focus:border-slate-900"
              />
            </label>
            <div className="flex gap-2">
              {([["often", "Visit often"], ["visit", "Want to go"]] as const).map(([k, label]) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setForm({ ...form, kind: k })}
                  aria-pressed={form.kind === k}
                  className={`flex-1 py-2 border font-mono text-[10px] font-bold uppercase tracking-[0.06em] cursor-pointer ${
                    form.kind === k ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="block space-y-1">
              <span className="text-[9px] font-bold text-slate-500 tracking-wider block uppercase">Note (optional)</span>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="e.g. take the 38R, back entrance"
                className="w-full border border-slate-300 bg-white px-2.5 py-2 text-sm focus:outline-none focus:border-slate-900"
              />
            </label>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button type="submit" className="w-full py-2.5 bg-slate-900 text-white font-mono text-[11px] font-bold uppercase tracking-[0.06em] hover:bg-slate-700 cursor-pointer">
              {editingId ? "Save changes" : "Pin it"}
            </button>
          </form>
        )}

        {!shown.length && !formOpen && (
          <div className="text-center py-10 px-4 space-y-2">
            <MapPin className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              {places.length ? "Nothing in this list yet." : "Pin the places you go."}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Save home, work, the gym, or spots you want to try. Each place gets a photo from Google Maps and one-tap transit directions.
            </p>
            <button onClick={openNew} className="mt-2 inline-flex items-center gap-1 px-3 py-2 border border-slate-900 font-mono text-[10px] font-bold uppercase tracking-[0.06em] hover:bg-slate-50 cursor-pointer">
              <Plus className="w-3 h-3" /> Pin your first place
            </button>
          </div>
        )}

        {shown.map((p) => (
          <article key={p.id} className="border border-slate-200 overflow-hidden">
            <a href={mapsSearch(p.address)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.name} in Google Maps`}>
              <PlacePhoto address={p.address} name={p.name} />
            </a>
            <div className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {p.kind === "often" ? <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                    <h3 className="text-sm font-bold text-slate-900 truncate">{p.name}</h3>
                  </div>
                  {p.name !== p.address && <p className="text-xs text-slate-500 truncate">{p.address}</p>}
                  {p.note && <p className="text-xs text-slate-700 mt-1">{p.note}</p>}
                </div>
                <span className="shrink-0 text-[8px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 px-1.5 py-0.5">
                  {p.kind === "often" ? "Often" : "Want to go"}
                </span>
              </div>
              <div className="flex gap-1.5">
                <a
                  href={mapsTransit(p.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-[0.06em] hover:bg-slate-700"
                >
                  <Navigation className="w-3 h-3" /> Transit directions
                </a>
                <a href={mapsSearch(p.address)} target="_blank" rel="noopener noreferrer" aria-label="Open in Google Maps" className="px-2.5 flex items-center border border-slate-300 text-slate-600 hover:bg-slate-50">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} className="px-2.5 border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`} className="px-2.5 border border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}

        {places.length > 0 && (
          <p className="text-[10px] text-slate-400 text-center pt-1">Saved on this device only. Photos and maps © Google.</p>
        )}
      </div>
    </div>
  );
}
