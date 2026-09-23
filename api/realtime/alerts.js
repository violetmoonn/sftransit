// GET /api/realtime/alerts → real 511 service alerts, in the shape the Real-Time tab expects.
// (Replaces the old Express route in server.ts, which Vercel never ran.)
import { fetchAllAlerts } from "../_lib/transit.js";

const METRO = new Set(["J", "K", "L", "M", "N", "T", "S", "KT"]);
const CABLE = new Set(["PH", "PM", "C", "CA", "59", "60", "61"]);

function agencyLabel(a) {
  if (a.agency === "BA") return "BART";
  if (a.agency === "CT") return "Caltrain";
  if (a.routes.length && a.routes.every((r) => CABLE.has(String(r).toUpperCase()))) return "Cable Car";
  if (a.routes.length && a.routes.every((r) => METRO.has(String(r).toUpperCase()))) return "Muni Metro";
  return a.routes.length ? "Muni Bus" : "Muni";
}

function typeOf(text) {
  const t = text.toLowerCase();
  if (/delay|disabled|suspend|no service|shutdown|stopped|single.?track/.test(t)) return "Delay";
  if (/elevator|escalator|construction|maintenance|track work|repair/.test(t)) return "Maintenance";
  return "Advisory";
}

export default async function handler(req, res) {
  try {
    const { alerts } = await fetchAllAlerts();
    const out = alerts.map((a) => ({
      agency: agencyLabel(a),
      line: a.routes.length ? a.routes.slice(0, 6).join(", ") : "Systemwide",
      type: typeOf(`${a.header} ${a.description}`),
      text: a.header && a.description && a.description !== a.header ? `${a.header}. ${a.description.slice(0, 280)}` : a.header || a.description,
      time: "Active",
    }));
    for (const name of ["Muni", "BART", "Caltrain"]) {
      if (!out.some((a) => a.agency.startsWith(name))) {
        out.push({ agency: name, line: "All lines", type: "Normal", text: "No active service alerts.", time: "Now" });
      }
    }
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    res.status(200).json({ alerts: out, source: "511 SF Bay" });
  } catch (e) {
    res.status(500).json({ alerts: [], error: "Service alerts are temporarily unavailable." });
  }
}
