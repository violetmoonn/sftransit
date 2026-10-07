// Google Maps place search for the Journey Planner's start / destination boxes.
//   GET /api/places?q=<typed text>&s=<session>   -> { results: [{ placeId, name, address }] }
//   GET /api/places?placeId=<id>&s=<session>     -> { name, address, lat, lng, neighborhoodId }
// Setup: uses the same GOOGLE_MAPS_KEY as /api/place-photo. In Google Cloud, enable
// "Places API (New)" for that key. The key stays on the server; visitors never see it.
// If the key is missing, this returns empty results and the site falls back to its built-in list.

// San Francisco only (the planner covers SF neighborhoods).
const SF_BOX = {
  low: { latitude: 37.703, longitude: -122.53 },
  high: { latitude: 37.835, longitude: -122.355 },
};

// Rough centre of each planner neighborhood, used to pick the closest one for an address.
const CENTRES = {
  presidio: [37.7989, -122.4662],
  richmond: [37.7795, -122.4830],
  marina: [37.8015, -122.4370],
  northbeach: [37.8015, -122.4100],
  downtown: [37.7900, -122.4030],
  soma: [37.7770, -122.4040],
  westernaddition: [37.7820, -122.4320],
  sunset: [37.7520, -122.4900],
  haight: [37.7700, -122.4469],
  mission: [37.7599, -122.4148],
  castro: [37.7609, -122.4350],
  potrero: [37.7585, -122.3950],
  twinpeaks: [37.7400, -122.4600],
  bayview: [37.7300, -122.3880],
  excelsior: [37.7240, -122.4270],
};

function nearestNeighborhood(lat, lng) {
  // Golden Gate Park is a long thin strip, so use its outline instead of a centre point.
  if (lat > 37.7652 && lat < 37.7738 && lng > -122.511 && lng < -122.4535) return "ggpark";
  let best = "downtown";
  let bestD = Infinity;
  const k = Math.cos((lat * Math.PI) / 180);
  for (const [id, [a, b]] of Object.entries(CENTRES)) {
    const d = (lat - a) ** 2 + ((lng - b) * k) ** 2;
    if (d < bestD) { bestD = d; best = id; }
  }
  return best;
}

const clean = (v, n) => String(v || "").trim().slice(0, n);

export default async function handler(req, res) {
  const key = process.env.GOOGLE_MAPS_KEY;
  const q = clean(req.query && req.query.q, 120);
  const placeId = clean(req.query && req.query.placeId, 300);
  const session = clean(req.query && req.query.s, 64).replace(/[^\w-]/g, "");
  res.setHeader("Cache-Control", "no-store");
  if (!key) return res.status(200).json({ results: [], disabled: true });

  try {
    if (placeId) {
      if (!/^[\w-]+$/.test(placeId)) return res.status(400).json({ error: "bad placeId" });
      const url = `https://places.googleapis.com/v1/places/${placeId}` + (session ? `?sessionToken=${session}` : "");
      const r = await fetch(url, {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "displayName,formattedAddress,location" },
      });
      const p = await r.json();
      if (!r.ok || !p.location) return res.status(404).json({ error: "not found" });
      const { latitude: lat, longitude: lng } = p.location;
      return res.status(200).json({
        name: (p.displayName && p.displayName.text) || p.formattedAddress,
        address: p.formattedAddress || "",
        lat,
        lng,
        neighborhoodId: nearestNeighborhood(lat, lng),
      });
    }

    if (q.length < 2) return res.status(200).json({ results: [] });
    const body = {
      input: q,
      locationRestriction: { rectangle: SF_BOX },
      includedRegionCodes: ["us"],
      languageCode: "en",
    };
    if (session) body.sessionToken = session;
    const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("places autocomplete", data && data.error);
      return res.status(200).json({ results: [] });
    }
    const results = (data.suggestions || [])
      .map((s) => s.placePrediction)
      .filter(Boolean)
      .slice(0, 5)
      .map((p) => ({
        placeId: p.placeId,
        name: (p.structuredFormat && p.structuredFormat.mainText && p.structuredFormat.mainText.text) || (p.text && p.text.text) || "",
        address: (p.structuredFormat && p.structuredFormat.secondaryText && p.structuredFormat.secondaryText.text) || "",
      }));
    return res.status(200).json({ results });
  } catch (e) {
    console.error("places", e);
    return res.status(200).json({ results: [] });
  }
}
