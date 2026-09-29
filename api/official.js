// GET /api/official → latest fares checked against the official agency data (via 511 SF Bay).
// Refreshes itself once a day; the daily Vercel cron (Authorization: Bearer CRON_SECRET) forces a refresh.
import { getOfficialInfo } from "./_lib/official.js";

export default async function handler(req, res) {
  try {
    const secret = process.env.CRON_SECRET;
    const force = !!secret && req.headers.authorization === `Bearer ${secret}`;
    const info = await getOfficialInfo({ force });
    res.setHeader("Cache-Control", force ? "no-store" : "s-maxage=3600, stale-while-revalidate=86400");
    if (!info) return res.status(200).json({ fares: {}, checkedAt: null, source: null });
    const { errors, ...pub } = info;
    res.status(200).json(pub);
  } catch (e) {
    console.error("official info:", e);
    res.status(200).json({ fares: {}, checkedAt: null, source: null });
  }
}
