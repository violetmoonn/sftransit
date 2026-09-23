// GET /api/send-alerts  (Authorization: Bearer CRON_SECRET)
// Called every 10 minutes by the GitHub Action in .github/workflows/transit-alerts.yml.
// Emails each paying subscriber about NEW alerts on the lines they picked.
import { env, redis, sendEmail, manageUrl, escapeHtml, siteUrl } from "./_lib/util.js";
import { fetchAllAlerts, alertMatches } from "./_lib/transit.js";

const SEEN_TTL = 60 * 60 * 24 * 7; // remember an alert for 7 days so it's only sent once

function emailHtml(email, alerts) {
  const items = alerts
    .map(
      (a) => `<div style="border-left:4px solid #c8102e;padding:8px 12px;margin:12px 0">
        <div style="font-size:12px;color:#666">${escapeHtml(a.agencyName)}${a.routes.length ? " · " + escapeHtml(a.routes.join(", ")) : ""}</div>
        <div style="font-weight:600">${escapeHtml(a.header || a.description.slice(0, 120))}</div>
        ${a.description && a.description !== a.header ? `<div style="color:#333;white-space:pre-line">${escapeHtml(a.description)}</div>` : ""}
      </div>`
    )
    .join("");
  return `<div style="font-family:system-ui,sans-serif;max-width:560px">${items}
    <p style="font-size:12px;color:#888">Live alerts: <a href="${siteUrl()}/subscribe.html">sf-transit.com</a> ·
    <a href="${manageUrl(email)}">Manage or cancel</a></p></div>`;
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${env("CRON_SECRET")}`) return res.status(401).send("Unauthorized");
  try {
    const { alerts, errors } = await fetchAllAlerts();

    // Find alerts we haven't seen before (SET NX = only succeeds the first time).
    const fresh = [];
    for (const a of alerts) {
      const isNew = await redis("SET", `seen:${a.id}`, "1", "NX", "EX", SEEN_TTL);
      if (isNew === "OK") fresh.push(a);
    }

    // On the very first run, don't blast everyone with every alert already in effect.
    const firstRun = (await redis("SET", "alerts:initialized", "1", "NX")) === "OK";
    if (firstRun || !fresh.length) {
      return res.status(200).json({ checked: alerts.length, new: fresh.length, sent: 0, firstRun, errors });
    }

    const emails = (await redis("SMEMBERS", "subs:active")) || [];
    let sent = 0;
    const failures = [];
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50);
      const raws = await redis("MGET", ...batch.map((e) => `sub:${e}`));
      await Promise.all(
        batch.map(async (email, j) => {
          const sub = raws[j] ? JSON.parse(raws[j]) : null;
          if (!sub || sub.status !== "active") return;
          const mine = fresh.filter((a) => alertMatches(a, sub.subs || []));
          if (!mine.length) return;
          const first = mine[0];
          const subject =
            mine.length === 1
              ? `${first.agencyName}${first.routes.length ? " " + first.routes.slice(0, 3).join(", ") : ""}: ${(first.header || "Service alert").slice(0, 80)}`
              : `${mine.length} new transit alerts for your lines`;
          try {
            await sendEmail({ to: email, subject, html: emailHtml(email, mine) });
            sent++;
          } catch (e) {
            failures.push(`${email}: ${e.message}`);
          }
        })
      );
    }
    if (failures.length) console.error("send failures", failures);
    res.status(200).json({ checked: alerts.length, new: fresh.length, subscribers: emails.length, sent, failed: failures.length, errors });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
