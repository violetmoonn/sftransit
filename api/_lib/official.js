// Keeps SFtransit's fares and live times in step with the official sources.
// Source: 511 SF Bay open data (run by the Metropolitan Transportation Commission),
// which republishes each agency's official GTFS schedules/fares and real-time feeds.
//
// Rate limit: a 511 key allows about 60 requests an hour, so every result here is
// cached in Redis and shared by all visitors.
import { inflateRawSync } from "node:zlib";
import { env } from "./util.js";

const API = "https://api.511.org/transit";

// ---------- Redis cache (falls back to "no cache" if Redis isn't configured) ----------
async function redis(...command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command.map(String)),
  });
  const data = await r.json();
  return data.error ? null : data.result;
}

async function cached(key, ttlSeconds, load) {
  try {
    const hit = await redis("GET", key);
    if (hit) return JSON.parse(hit);
  } catch {}
  // Only one visitor refreshes at a time; others get the last saved copy.
  const gotLock = await redis("SET", `${key}:lock`, "1", "NX", "EX", "60").catch(() => null);
  if (gotLock === null && process.env.KV_REST_API_URL) {
    const stale = await redis("GET", `${key}:last`).catch(() => null);
    if (stale) return JSON.parse(stale);
  }
  const value = await load();
  if (value) {
    await redis("SET", key, JSON.stringify(value), "EX", String(ttlSeconds)).catch(() => {});
    await redis("SET", `${key}:last`, JSON.stringify(value), "EX", String(60 * 60 * 24 * 14)).catch(() => {});
  }
  return value;
}

// ---------- Minimal ZIP reader (only the few small fare files we need) ----------
function unzipSelected(buf, wanted) {
  const b = Buffer.from(buf);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (b.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a zip file");
  const count = b.readUInt16LE(eocd + 10);
  let p = b.readUInt32LE(eocd + 16);
  const out = {};
  for (let n = 0; n < count; n++) {
    if (b.readUInt32LE(p) !== 0x02014b50) break;
    const method = b.readUInt16LE(p + 10);
    const csize = b.readUInt32LE(p + 20);
    const nameLen = b.readUInt16LE(p + 28), extraLen = b.readUInt16LE(p + 30), commentLen = b.readUInt16LE(p + 32);
    const local = b.readUInt32LE(p + 42);
    const name = b.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    const base = name.split("/").pop();
    if (!wanted.includes(base)) continue;
    const start = local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28);
    const data = b.subarray(start, start + csize);
    out[base] = (method === 8 ? inflateRawSync(data) : data).toString("utf8");
  }
  return out;
}

// ---------- CSV ----------
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.replace(/^﻿/, "").trim());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const FARE_FILES = ["fare_attributes.txt", "fare_rules.txt", "routes.txt", "fare_products.txt", "rider_categories.txt", "fare_leg_rules.txt"];

async function loadGtfsFares(operatorId) {
  const url = `${API}/datafeeds?api_key=${encodeURIComponent(env("API_511_KEY"))}&operator_id=${operatorId}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`511 datafeeds ${operatorId}: HTTP ${r.status}`);
  const files = unzipSelected(await r.arrayBuffer(), FARE_FILES);
  const out = {};
  for (const [name, txt] of Object.entries(files)) out[name] = parseCsv(txt);
  return out;
}

// Adult, single-ride fares only (skip passes and discount fares).
const NOT_SINGLE_ADULT = /youth|senior|disab|discount|reduced|lifeline|rtc|clipper start|pass|month|weekly|day|week|free|student|child|transfer/i;

function adultAmounts(g) {
  const list = []; // { amount, cable }
  const routes = new Map((g["routes.txt"] || []).map((r) => [r.route_id, r]));
  const isCableRoute = (id) => {
    const r = routes.get(id);
    return !!r && (r.route_type === "5" || /cable/i.test(`${r.route_long_name} ${r.route_short_name}`));
  };

  // GTFS Fares v1
  const rulesByFare = {};
  for (const fr of g["fare_rules.txt"] || []) (rulesByFare[fr.fare_id] ||= []).push(fr);
  for (const fa of g["fare_attributes.txt"] || []) {
    const amount = parseFloat(fa.price);
    if (!isFinite(amount) || amount <= 0 || NOT_SINGLE_ADULT.test(fa.fare_id)) continue;
    const rules = rulesByFare[fa.fare_id] || [];
    const cable = /cable/i.test(fa.fare_id) || (rules.length > 0 && rules.every((x) => x.route_id && isCableRoute(x.route_id)));
    list.push({ amount, cable });
  }

  // GTFS Fares v2
  const cats = g["rider_categories.txt"] || [];
  const adultCats = new Set(
    cats.filter((c) => c.is_default_fare_category === "1" || /adult|general|regular/i.test(c.rider_category_name || c.rider_category_id)).map((c) => c.rider_category_id)
  );
  for (const p of g["fare_products.txt"] || []) {
    const amount = parseFloat(p.amount);
    const name = `${p.fare_product_id} ${p.fare_product_name || ""}`;
    if (!isFinite(amount) || amount <= 0 || NOT_SINGLE_ADULT.test(name)) continue;
    if (p.rider_category_id && cats.length && !adultCats.has(p.rider_category_id)) continue;
    list.push({ amount, cable: /cable/i.test(name) });
  }
  return list;
}

const within = (v, lo, hi) => (typeof v === "number" && v >= lo && v <= hi ? Math.round(v * 100) / 100 : null);
const minOf = (xs) => (xs.length ? Math.min(...xs) : null);

async function refreshFares() {
  const checkedAt = new Date().toISOString();
  const fares = {};
  const errors = [];
  const tasks = {
    SF: async () => {
      const a = adultAmounts(await loadGtfsFares("SF"));
      fares.muni = within(minOf(a.filter((x) => !x.cable && x.amount >= 2 && x.amount <= 4.5).map((x) => x.amount)), 2, 4.5);
      fares.cableCar = within(minOf(a.filter((x) => x.cable).map((x) => x.amount)) ?? minOf(a.filter((x) => x.amount >= 6 && x.amount <= 20).map((x) => x.amount)), 6, 20);
    },
    BA: async () => { fares.bartMin = within(minOf(adultAmounts(await loadGtfsFares("BA")).map((x) => x.amount).filter((v) => v >= 1.5)), 1.5, 4.5); },
    CT: async () => { fares.caltrainMin = within(minOf(adultAmounts(await loadGtfsFares("CT")).map((x) => x.amount).filter((v) => v >= 2)), 2, 9); },
    SB: async () => { fares.ferryMin = within(minOf(adultAmounts(await loadGtfsFares("SB")).map((x) => x.amount).filter((v) => v >= 2)), 2, 20); },
  };
  for (const [op, run] of Object.entries(tasks)) {
    try { await run(); } catch (e) { errors.push(`${op}: ${e.message}`); }
  }
  for (const k of Object.keys(fares)) if (fares[k] === null) delete fares[k];
  if (!Object.keys(fares).length) {
    console.warn("Official fare refresh found nothing:", errors);
    return null;
  }
  return { fares, checkedAt, source: "511 SF Bay open data (official agency GTFS)", errors };
}

async function getOfficialInfo({ force = false } = {}) {
  if (force) {
    const fresh = await refreshFares();
    if (fresh) {
      await redis("SET", "official:fares", JSON.stringify(fresh), "EX", String(60 * 60 * 24)).catch(() => {});
      await redis("SET", "official:fares:last", JSON.stringify(fresh), "EX", String(60 * 60 * 24 * 14)).catch(() => {});
    }
    return fresh;
  }
  return cached("official:fares", 60 * 60 * 24, refreshFares);
}

// ---------- Real-time departures (SIRI StopMonitoring) ----------
function arr(x) { return x == null ? [] : Array.isArray(x) ? x : [x]; }
function text(x) { return Array.isArray(x) ? text(x[0]) : x && typeof x === "object" ? x.value ?? x.Value ?? "" : x ?? ""; }

async function stopMonitoring(agency, stopCode) {
  const q = new URLSearchParams({ api_key: env("API_511_KEY"), agency, format: "json" });
  if (stopCode) q.set("stopCode", stopCode);
  const r = await fetch(`${API}/StopMonitoring?${q}`);
  if (!r.ok) throw new Error(`511 StopMonitoring ${agency}: HTTP ${r.status}`);
  const json = JSON.parse((await r.text()).replace(/^﻿/, ""));
  const sd = json.ServiceDelivery || json.Siri?.ServiceDelivery || {};
  return arr(sd.StopMonitoringDelivery).flatMap((d) => arr(d.MonitoredStopVisit)).map((v) => {
    const j = v.MonitoredVehicleJourney || {};
    const c = j.MonitoredCall || {};
    return {
      line: text(j.LineRef),
      lineName: text(j.PublishedLineName),
      direction: text(j.DirectionRef),
      destination: text(j.DestinationName),
      stop: text(c.StopPointName),
      stopRef: text(c.StopPointRef),
      vehicle: text(j.VehicleRef) || text(j.FramedVehicleJourneyRef?.DatedVehicleJourneyRef),
      time: c.ExpectedDepartureTime || c.ExpectedArrivalTime || c.AimedDepartureTime || c.AimedArrivalTime || null,
    };
  }).filter((x) => x.time);
}

// Caltrain departures from San Francisco (4th & King). One request covers the whole line.
async function getCaltrainLive() {
  return cached("rt:caltrain", 180, async () => {
    const visits = await stopMonitoring("CT");
    const fromSF = visits.filter((v) => /san francisco/i.test(v.stop) && !/san francisco/i.test(v.destination));
    return { fetchedAt: Date.now(), departures: fromSF.slice(0, 40) };
  });
}

export { getOfficialInfo, getCaltrainLive, cached, parseCsv, adultAmounts, stopMonitoring };
