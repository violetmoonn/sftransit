// Shared helpers. Files in api/_lib are not deployed as endpoints (leading underscore).
import crypto from "node:crypto";

function env(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing environment variable ${name}`);
  }
  return v;
}

function siteUrl() {
  return env("SITE_URL", "https://sf-transit.com").replace(/\/$/, "");
}

// ---------- Redis (Upstash REST; works with Vercel's Upstash/KV integration) ----------
async function redis(...command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis is not configured (KV_REST_API_URL / KV_REST_API_TOKEN)");
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command.map(String)),
  });
  const data = await r.json();
  if (data.error) throw new Error(`Redis: ${data.error}`);
  return data.result;
}

async function getSubscriber(email) {
  const raw = await redis("GET", `sub:${email}`);
  return raw ? JSON.parse(raw) : null;
}
async function saveSubscriber(sub) {
  await redis("SET", `sub:${sub.email}`, JSON.stringify(sub));
}

// ---------- Stripe (plain REST, no SDK) ----------
function formEncode(obj, prefix, out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") formEncode(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out.join("&");
}

async function stripe(method, path, params) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env("STRIPE_SECRET_KEY")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params ? formEncode(params) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Stripe: ${data.error && data.error.message}`);
  return data;
}

// Verify the Stripe-Signature header against the raw request body.
function verifyStripeSignature(rawBody, header, secret, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), p.slice(i + 1)];
    })
  );
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return sigs.some(
    (s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))
  );
}

// ---------- Signed "manage subscription" links ----------
function manageToken(email) {
  return crypto.createHmac("sha256", env("LINK_SECRET")).update(email).digest("hex").slice(0, 32);
}
function linesToken(email, list) {
  return crypto.createHmac("sha256", env("LINK_SECRET")).update(`lines|${email}|${list}`).digest("hex").slice(0, 32);
}
function manageUrl(email) {
  return `${siteUrl()}/api/manage?email=${encodeURIComponent(email)}&t=${manageToken(email)}`;
}

// ---------- Email (Resend) ----------
async function sendEmail({ to, subject, html }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env("EMAIL_FROM", "SF Transit Alerts <alerts@sf-transit.com>"), to, subject, html }),
  });
  if (!r.ok) throw new Error(`Resend: ${r.status} ${await r.text()}`);
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(typeof c === "string" ? Buffer.from(c) : c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  return JSON.parse((await readRawBody(req)) || "{}");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export {
  env, siteUrl, redis, getSubscriber, saveSubscriber, stripe, formEncode, verifyStripeSignature,
  manageToken, linesToken, manageUrl, sendEmail, readRawBody, readJson, escapeHtml,
};
