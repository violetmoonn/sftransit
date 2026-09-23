// GET /api/alerts  → current Muni / BART / Caltrain alerts (free, public)
import { fetchAllAlerts } from "./_lib/transit.js";

export default async function handler(req, res) {
  try {
    const { alerts, errors } = await fetchAllAlerts();
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    res.status(200).json({
      updated: new Date().toISOString(),
      alerts: alerts.map(({ informed, ...a }) => a),
      errors,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
