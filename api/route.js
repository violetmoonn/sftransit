// Travel times for the Journey Planner: walk, public transit and car.
//   GET /api/route?from=<place>&to=<place>
//   <place> is "place:<Google place id>" or "addr:<address text>"
// Returns { walk, transit, car } — each { minutes, miles } (transit also { fare, lines }), or null.
// Setup: uses GOOGLE_MAPS_KEY. In Google Cloud, enable "Routes API" for that key.
// Without a key it returns { disabled: true } and the site shows its own estimates.

const MODES = { walk: "WALK", transit: "TRANSIT", car: "DRIVE" };
const MASK = [
  "routes.duration",
  "routes.distanceMeters",
  "routes.travelAdvisory.transitFare",
  "routes.legs.steps.travelMode",
  "routes.legs.steps.transitDetails.transitLine.nameShort",
  "routes.legs.steps.transitDetails.transitLine.name",
  "routes.legs.steps.transitDetails.transitLine.agencies.name",
  "routes.legs.steps.transitDetails.transitLine.vehicle.type",
  "routes.legs.steps.transitDetails.stopCount",
  "routes.legs.steps.transitDetails.stopDetails.departureStop.name",
  "routes.legs.steps.transitDetails.stopDetails.arrivalStop.name",
].join(",");

function waypoint(v) {
  const s = String(v || "").trim().slice(0, 300);
  if (s.startsWith("place:") && /^[\w-]+$/.test(s.slice(6))) return { placeId: s.slice(6) };
  if (s.startsWith("addr:") && s.length > 5) {
    let a = s.slice(5);
    if (!/san francisco|,\s*ca\b|california/i.test(a)) a += ", San Francisco, CA";
    return { address: a };
  }
  return null;
}

async function one(key, origin, destination, mode) {
  const body = { origin, destination, travelMode: MODES[mode], units: "IMPERIAL" };
  if (mode === "car") body.routingPreference = "TRAFFIC_AWARE";
  const r = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": MASK },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  const route = r.ok && data.routes && data.routes[0];
  if (!route || !route.duration) {
    if (!r.ok) console.error("route", mode, data && data.error && data.error.message);
    return null;
  }
  const out = {
    minutes: Math.max(1, Math.round(parseInt(route.duration, 10) / 60)),
    miles: Math.round(((route.distanceMeters || 0) / 1609.34) * 10) / 10,
  };
  if (mode === "transit") {
    const f = route.travelAdvisory && route.travelAdvisory.transitFare;
    if (f && f.units !== undefined) out.fare = Number(f.units || 0) + (f.nanos || 0) / 1e9;
    out.lines = [];
    for (const leg of route.legs || []) {
      for (const st of leg.steps || []) {
        const t = st.transitDetails;
        if (!t || !t.transitLine) continue;
        const line = t.transitLine;
        out.lines.push({
          name: line.nameShort || line.name || "",
          agency: (line.agencies && line.agencies[0] && line.agencies[0].name) || "",
          vehicle: (line.vehicle && line.vehicle.type) || "",
          from: (t.stopDetails && t.stopDetails.departureStop && t.stopDetails.departureStop.name) || "",
          to: (t.stopDetails && t.stopDetails.arrivalStop && t.stopDetails.arrivalStop.name) || "",
          stops: t.stopCount || 0,
        });
      }
    }
  }
  return out;
}

export default async function handler(req, res) {
  const key = process.env.GOOGLE_MAPS_KEY;
  const origin = waypoint(req.query && req.query.from);
  const destination = waypoint(req.query && req.query.to);
  if (!key) return res.status(200).json({ disabled: true });
  if (!origin || !destination) return res.status(400).json({ error: "from and to are required" });
  try {
    const [walk, transit, car] = await Promise.all(
      ["walk", "transit", "car"].map((m) => one(key, origin, destination, m).catch(() => null))
    );
    // Transit times change by the minute; cache briefly.
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
    return res.status(200).json({ walk, transit, car });
  } catch (e) {
    console.error("route", e);
    return res.status(200).json({ disabled: true });
  }
}
