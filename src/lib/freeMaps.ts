// Free, no-key map services (OpenStreetMap data):
//  - Address search: Photon (photon.komoot.io)
//  - Walk / car routes: OSRM at routing.openstreetmap.de
// Transit time is an estimate; the "Open in Google Maps" button gives exact lines.

export interface FreePlace {
  placeId: string; // "ll:<lat>,<lng>"
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface ModeResult {
  minutes: number;
  miles: number;
  fare?: number;
  lines?: { name: string; agency: string; vehicle: string; from: string; to: string; stops: number }[];
}

const SF_BBOX = "-122.53,37.703,-122.355,37.835"; // San Francisco only

// Rough centre of each planner neighborhood, used to pick the closest one for an address.
const CENTRES: Record<string, [number, number]> = {
  presidio: [37.7989, -122.4662],
  richmond: [37.7795, -122.483],
  marina: [37.8015, -122.437],
  northbeach: [37.8015, -122.41],
  downtown: [37.79, -122.403],
  soma: [37.777, -122.404],
  westernaddition: [37.782, -122.432],
  sunset: [37.752, -122.49],
  haight: [37.77, -122.4469],
  mission: [37.7599, -122.4148],
  castro: [37.7609, -122.435],
  potrero: [37.7585, -122.395],
  twinpeaks: [37.74, -122.46],
  bayview: [37.73, -122.388],
  excelsior: [37.724, -122.427],
};

export function nearestNeighborhood(lat: number, lng: number): string {
  // Golden Gate Park is a long thin strip, so use its outline instead of a centre point.
  if (lat > 37.7652 && lat < 37.7738 && lng > -122.511 && lng < -122.4535) return "ggpark";
  let best = "downtown";
  let bestD = Infinity;
  const k = Math.cos((lat * Math.PI) / 180);
  for (const [id, [a, b]] of Object.entries(CENTRES)) {
    const d = (lat - a) ** 2 + ((lng - b) * k) ** 2;
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

export const llWhere = (lat: number, lng: number) => `ll:${lat.toFixed(6)},${lng.toFixed(6)}`;

export function parseLL(where: string): [number, number] | null {
  const m = /^ll:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(where);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
}

// ---------- Address search ----------
export async function searchPlaces(q: string, signal?: AbortSignal): Promise<FreePlace[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&bbox=${SF_BBOX}`;
  const r = await fetch(url, { signal });
  if (!r.ok) return [];
  const data = await r.json();
  const seen = new Set<string>();
  const out: FreePlace[] = [];
  for (const f of data.features || []) {
    const p = f.properties || {};
    const [lng, lat] = (f.geometry && f.geometry.coordinates) || [];
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    const streetLine = [p.housenumber, p.street].filter(Boolean).join(" ");
    const name = p.name || streetLine;
    if (!name) continue;
    const address = [p.name && streetLine !== name ? streetLine : "", p.district || p.locality || "", p.city || "San Francisco"]
      .filter(Boolean)
      .join(", ");
    const dedupe = (name + "|" + address).toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push({ placeId: llWhere(lat, lng), name, address, lat, lng });
    if (out.length >= 5) break;
  }
  return out;
}

// Turns "addr:..." or "ll:..." into coordinates.
const geoCache = new Map<string, [number, number] | null>();
export async function toCoords(where: string, signal?: AbortSignal): Promise<[number, number] | null> {
  const ll = parseLL(where);
  if (ll) return ll;
  if (!where.startsWith("addr:")) return null;
  if (geoCache.has(where)) return geoCache.get(where)!;
  const text = where.slice(5).replace(/,\s*San Francisco.*$/i, "");
  const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text + " San Francisco")}&limit=1&bbox=${SF_BBOX}`, { signal });
  const data = r.ok ? await r.json() : null;
  const c = data && data.features && data.features[0] && data.features[0].geometry.coordinates;
  const res: [number, number] | null = c ? [c[1], c[0]] : null;
  geoCache.set(where, res);
  return res;
}

// ---------- Routes ----------
async function osrm(profile: "foot" | "car", a: [number, number], b: [number, number], signal?: AbortSignal) {
  const url = `https://routing.openstreetmap.de/routed-${profile}/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=false`;
  const r = await fetch(url, { signal });
  const d = r.ok ? await r.json() : null;
  const route = d && d.code === "Ok" && d.routes && d.routes[0];
  return route ? { seconds: route.duration as number, meters: route.distance as number } : null;
}

const miles = (m: number) => Math.round((m / 1609.34) * 10) / 10;

export async function freeRoutes(
  fromWhere: string,
  toWhere: string,
  muniFare: number,
  signal?: AbortSignal
): Promise<{ walk: ModeResult | null; transit: ModeResult | null; car: ModeResult | null } | null> {
  const [a, b] = await Promise.all([toCoords(fromWhere, signal), toCoords(toWhere, signal)]);
  if (!a || !b) return null;
  const [foot, car] = await Promise.all([
    osrm("foot", a, b, signal).catch(() => null),
    osrm("car", a, b, signal).catch(() => null),
  ]);
  const carOut = car
    ? // OSRM assumes empty roads; add time for SF traffic, lights and parking.
      { minutes: Math.max(2, Math.round((car.seconds / 60) * 1.3 + 2)), miles: miles(car.meters) }
    : null;
  const walkOut = foot ? { minutes: Math.max(1, Math.round(foot.seconds / 60)), miles: miles(foot.meters) } : null;
  // Transit estimate: walk to/from stops + wait (~10 min) and riding at ~9 mph average.
  const dist = car ? car.meters : foot ? foot.meters : 0;
  const transitOut = dist
    ? { minutes: Math.round(10 + (miles(dist) / 9) * 60), miles: miles(dist), fare: muniFare }
    : null;
  return { walk: walkOut, transit: transitOut, car: carOut };
}
