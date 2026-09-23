// GET /api/confirm-lines?email=...&subs=...&t=...  ← link emailed to existing subscribers who change lines
import crypto from "node:crypto";
import { getSubscriber, saveSubscriber, linesToken, siteUrl } from "./_lib/util.js";
import { normalizeSubs } from "./_lib/transit.js";

export default async function handler(req, res) {
  try {
    const email = String(req.query.email || "").toLowerCase();
    const list = String(req.query.subs || "");
    const t = String(req.query.t || "");
    const expected = linesToken(email, list);
    if (t.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(t), Buffer.from(expected))) {
      return res.status(403).send("This link is invalid or has been changed.");
    }
    const sub = await getSubscriber(email);
    const subs = normalizeSubs(list.split(","));
    if (!sub || !subs.length) return res.status(404).send("No subscription found.");
    sub.subs = subs;
    await saveSubscriber(sub);
    res.writeHead(302, { Location: `${siteUrl()}/subscribe.html?updated=1` }).end();
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong. Please try again.");
  }
};
