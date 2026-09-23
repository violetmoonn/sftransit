// Fetches and normalizes service alerts from the 511 SF Bay open data API.
// Free API key: https://511.org/open-data/token
import { env } from "./util.js";

const AGENCIES = {
  SF: "Muni",
  BA: "BART",
  CT: "Caltrain",
};

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
      route: pick(ie, "RouteId") || null,
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
  const text = (await r.text()).replace(/^﻿/, "");
  return normalizeFeed(JSON.parse(text), agency);
}

async function fetchAllAlerts() {
  const results = await Promise.allSettled(Object.keys(AGENCIES).map(fetchAlerts));
  const alerts = [];
  const errors = [];
  results.forEach((r, i) => (r.status === "fulfilled" ? alerts.push(...r.value) : errors.push(`${Object.keys(AGENCIES)[i]}: ${r.reason.message}`)));
  return { alerts, errors };
}

// A subscription entry is "AGENCY:*" (whole agency) or "AGENCY:ROUTE" (one line), e.g. "SF:N", "BA:*".
function normalizeSubs(list) {
  if (!Array.isArray(list)) return [];
  const clean = new Set();
  for (const raw of list.slice(0, 40)) {
    const m = /^([A-Z]{2}):([A-Za-z0-9*_-]{1,12})$/.exec(String(raw).trim());
    if (m && AGENCIES[m[1]]) clean.add(`${m[1]}:${m[2].toUpperCase()}`);
  }
  return [...clean];
}

function alertMatches(alert, subs) {
  for (const s of subs) {
    const [ag, route] = s.split(":");
    if (route === "*") {
      if (alert.agency === ag || alert.informed.some((i) => i.agency === ag)) return true;
    } else if (alert.informed.some((i) => (i.agency || alert.agency) === ag && i.route && String(i.route).toUpperCase() === route)) {
      return true;
    }
  }
  return false;
}

export { AGENCIES, normalizeFeed, fetchAlerts, fetchAllAlerts, normalizeSubs, alertMatches };
