// GET /api/manage?email=...&t=...  → Stripe billing portal (cancel, update card).
// The signed link is included in every email, so only the subscriber can open it.
import crypto from "node:crypto";
import { stripe, getSubscriber, manageToken, siteUrl } from "./_lib/util.js";

export default async function handler(req, res) {
  try {
    const email = String(req.query.email || "").toLowerCase();
    const t = String(req.query.t || "");
    const expected = manageToken(email);
    if (!email || t.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(t), Buffer.from(expected))) {
      return res.status(403).send("This link is invalid. Use the link from one of your alert emails.");
    }
    const sub = await getSubscriber(email);
    if (!sub || !sub.customerId) return res.status(404).send("No subscription found for this email.");
    const portal = await stripe("POST", "billing_portal/sessions", {
      customer: sub.customerId,
      return_url: `${siteUrl()}/subscribe.html`,
    });
    res.writeHead(302, { Location: portal.url }).end();
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong. Please try again.");
  }
};
