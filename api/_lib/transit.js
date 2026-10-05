// Fetches and normalizes service alerts from the 511 SF Bay open data API.
// Free API key: https://511.org/open-data/token
import { env } from "./util.js";

// Bay Area agencies we cover. The real 511 code for each is looked up by name from
// 511's operator list (see resolveAgencies); `code` is only a fallback if that call fails.
const WANTED = [
  { code: "SF", name: "Muni", match: /\bmuni\b|san francisco municipal/i },
  { code: "BA", name: "BART", match: /\bbart\b|bay area rapid/i },
  { code: "CT", name: "Caltrain", match: /caltrain/i },
  { code: "AC", name: "AC Transit", match: /\bac transit\b|alameda.contra/i },
  { code: "VC", name: "City Coach", match: /city coach|vacaville/i },
  { code: "CC", name: "County Connection", match: /county connection|central contra costa/i },
  { code: "FS", name: "FAST", match: /\bfast\b|fairfield/i },
  { code: "GG", name: "Golden Gate Transit", match: /golden gate transit|golden gate bridge/i },
  { code: "GF", name: "Golden Gate Ferry", match: /golden gate ferry/i },
  { code: "MA", name: "Marin Transit", match: /marin transit|marin county transit/i },
  { code: "VN", name: "Napa Vine", match: /\bvine\b|napa/i },
  { code: "PE", name: "Petaluma Transit", match: /petaluma/i },
  { code: "SM", name: "SamTrans", match: /samtrans|san mateo county transit/i },
  { code: "SB", name: "SF Bay Ferry", match: /bay ferry|water emergency/i },
  { code: "SR", name: "Santa Rosa CityBus", match: /santa rosa/i },
  { code: "SA", name: "SMART", match: /\bsmart\b|sonoma.marin area rail/i },
  { code: "ST", name: "SolTrans", match: /soltrans|solano county transit/i },
  { code: "SO", name: "Sonoma County Transit", match: /sonoma county transit/i },
  { code: "3D", name: "Tri Delta Transit", match: /tri ?delta/i },
  { code: "UC", name: "Union City Transit", match: /union city/i },
  { code: "SC", name: "VTA", match: /\bvta\b|santa clara valley/i },
  { code: "WC", name: "WestCAT", match: /westcat|western contra costa/i },
  { code: "WH", name: "Wheels", match: /\bwheels\b|livermore.amador|lavta/i },
];

// Code → display name. Starts with the fallback codes; resolveAgencies() fills in 511's real codes.
const AGENCIES = Object.fromEntries(WANTED.map((w) => [w.code, w.name]));

const readJson511 = async (r) => JSON.parse((await r.text()).replace(/^\uFEFF/, ""));

let resolved = null;
// Looks up each wanted agency in 511's operator list by name, once per cold start.
async function resolveAgencies() {
  if (resolved) return resolved;
  const list = [];
  try {
    const r = await fetch(`https://api.511.org/transit/operators?api_key=${encodeURIComponent(env("API_511_KEY"))}&format=json`);
    if (r.ok) {
      const ops = await readJson511(r);
      const arr = Array.isArray(ops) ? ops : pick(ops, "Operators", "Operator") || [];
      for (const w of WANTED) {
        const op = arr.find((o) => w.match.test(String(pick(o, "Name") || "")) || String(pick(o, "Id") || "").toUpperCase() === w.code);
        if (op) list.push({ code: String(pick(op, "Id")).toUpperCase(), name: w.name });
      }
    }
  } catch {}
  for (const w of WANTED) if (!list.some((x) => x.name === w.name)) list.push({ code: w.code, name: w.name });
  for (const a of list) AGENCIES[a.code] = a.name;
  resolved = list;
  return list;
}

// 511 returns GTFS-realtime as JSON, sometimes with a BOM, and key casing varies
// between PascalCase and snake_case. Read keys case-insensitively.
function pick(obj, ...names) {
  if (!obj || typeof obj !== "object") return undefined;
  const lower = Object.fromEntries(Object.keys(obj).map((k) => [k.toLowerCase().replace(/_/g, ""), k]));
  for (const n of names) {
    const k = lower[n.toLowerCase().replace(/_/g, "")];
    if (k !== undefined) return obj[k];
  }
  return undefined;
}

function translated(field) {
  const list = pick(field, "Translations", "Translation") || [];
  const en = list.find((t) => /^en/i.test(pick(t, "Language") || "")) || list[0];
  return en ? String(pick(en, "Text") || "").trim() : "";
}

function normalizeFeed(json, fallbackAgency) {
  const entities = pick(json, "Entities", "Entity") || [];
  const now = Date.now() / 1000;
  const out = [];
  for (const e of entities) {
    const a = pick(e, "Alert");
    if (!a) continue;
    const periods = pick(a, "ActivePeriods", "ActivePeriod") || [];
    const active =
      !periods.length ||
      periods.some((p) => {
        const s = Number(pick(p, "Start") || 0);
        const en = Number(pick(p, "End") || 0);
        return (!s || s <= now) && (!en || en >= now);
      });
    if (!active) continue;
    const informed = (pick(a, "InformedEntities", "InformedEntity") || []).map((ie) => ({
      agency: pick(ie, "AgencyId") || fallbackAgency,
      // The regional feed prefixes routes with the agency ("SF:N", "AC:96"); keep just the route.
      route: pick(ie, "RouteId") ? String(pick(ie, "RouteId")).replace(/^[A-Za-z0-9]{2}:/, "") : null,
      stop: pick(ie, "StopId") || null,
    }));
    const agency = (informed.find((i) => i.agency) || {}).agency || fallbackAgency;
    out.push({
      id: `${fallbackAgency}:${pick(e, "Id")}`,
      agency,
      agencyName: AGENCIES[agency] || agency,
      routes: [...new Set(informed.map((i) => i.route).filter(Boolean))],
      header: translated(pick(a, "HeaderText")),
      description: translated(pick(a, "DescriptionText")),
      informed,
    });
  }
  return out.filter((x) => x.header || x.description);
}

async function fetchAlerts(agency) {
  const url = `https://api.511.org/transit/servicealerts?api_key=${encodeURIComponent(env("API_511_KEY"))}&agency=${agency}&format=json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`511 ${agency}: HTTP ${r.status}`);
  return normalizeFeed(await readJson511(r), agency);
}

// One request for the whole Bay Area ("RG" = 511's regional feed), which keeps us well inside
// 511's hourly request limit. Falls back to Muni/BART/Caltrain one by one if RG fails.
async function fetchAllAlerts() {
  const agencies = await resolveAgencies();
  const wanted = new Set(agencies.map((a) => a.code));
  try {
    const all = await fetchAlerts("RG");
    const alerts = all
      .map((a) => {
        const ag = a.informed.find((i) => i.agency && wanted.has(String(i.agency).toUpperCase()));
        const agency = ag ? String(ag.agency).toUpperCase() : String(a.agency).toUpperCase();
        return { ...a, agency, agencyName: AGENCIES[agency] || agency };
      })
      .filter((a) => wanted.has(a.agency));
    return { alerts, errors: [], agencies };
  } catch (e) {
    const core = ["SF", "BA", "CT"].map((c) => agencies.find((a) => a.name === AGENCIES[c])?.code || c);
    const results = await Promise.allSettled(core.map(fetchAlerts));
    const alerts = [];
    const errors = [`RG: ${e.message}`];
    results.forEach((r, i) => (r.status === "fulfilled" ? alerts.push(...r.value) : errors.push(`${core[i]}: ${r.reason.message}`)));
    return { alerts, errors, agencies };
  }
}

// A subscription entry is "AGENCY:*" (whole agency) or "AGENCY:ROUTE" (one line), e.g. "SF:N", "BA:*".
function normalizeSubs(list) {
  if (!Array.isArray(list)) return [];
  const clean = new Set();
  for (const raw of list.slice(0, 40)) {
    const m = /^([A-Z0-9]{2}):([A-Za-z0-9*_-]{1,12})$/.exec(String(raw).trim().toUpperCase());
    if (m) clean.add(`${m[1]}:${m[2]}`);
  }
  return [...clean];
}

function alertMatches(alert, subs) {
  for (const s of subs) {
    const [ag, route] = s.split(":");
    if (route === "*") {
      if (alert.agency === ag || alert.informed.some((i) => String(i.agency).toUpperCase() === ag)) return true;
    } else if (alert.informed.some((i) => String(i.agency || alert.agency).toUpperCase() === ag && i.route && String(i.route).toUpperCase() === route)) {
      return true;
    }
  }
  return false;
}

export { AGENCIES, WANTED, resolveAgencies, normalizeFeed, fetchAlerts, fetchAllAlerts, normalizeSubs, alertMatches };
