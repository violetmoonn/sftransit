// GET /api/alerts  → current Bay Area transit alerts (free, public)
import { fetchAllAlerts } from "./_lib/transit.js";
import { cached } from "./_lib/official.js";

export default async function handler(req, res) {
  try {
    // Shared 2-minute cache keeps us inside 511's hourly request limit.
    const data = await cached("pub:alerts:v2", 120, async () => {
      const { alerts, errors, agencies } = await fetchAllAlerts();
      return { updated: new Date().toISOString(), alerts: alerts.map(({ informed, ...a }) => a), agencies, errors };
    });
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
