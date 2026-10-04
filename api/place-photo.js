// GET /api/place-photo?q=<address or place name>
// Returns a Google Street View photo of the place, or 404 if there is no photo / no key.
// Setup: Vercel → Environment Variables → GOOGLE_MAPS_KEY (Google Cloud key with "Street View Static API" enabled).
// The key stays on the server; visitors never see it.

export default async function handler(req, res) {
  const key = process.env.GOOGLE_MAPS_KEY;
  let q = String((req.query && req.query.q) || "").trim().slice(0, 200);
  if (!key || !q) return res.status(404).end();
  if (!/san francisco|,\s*ca\b|california|oakland|berkeley|daly city|bay area/i.test(q)) q += ", San Francisco, CA";
  const loc = encodeURIComponent(q);
  try {
    // Metadata calls are free: check there is outdoor imagery before paying for a photo.
    const meta = await (await fetch(`https://maps.googleapis.com/maps/api/streetview/metadata?location=${loc}&source=outdoor&key=${key}`)).json();
    if (meta.status !== "OK") return res.status(404).end();
    const img = await fetch(`https://maps.googleapis.com/maps/api/streetview?size=640x360&fov=80&location=${loc}&source=outdoor&key=${key}`);
    if (!img.ok) return res.status(404).end();
    res.setHeader("Content-Type", img.headers.get("content-type") || "image/jpeg");
    // Cache hard so each place is only fetched from Google about once a month.
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400");
    return res.status(200).send(Buffer.from(await img.arrayBuffer()));
  } catch (e) {
    console.error("place-photo", e);
    return res.status(404).end();
  }
}
