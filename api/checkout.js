// POST /api/checkout  { email, subs: ["SF:N", "BA:*"] }  → { url } of a Stripe Checkout page
import { env, siteUrl, stripe, getSubscriber, saveSubscriber, readJson, sendEmail, linesToken } from "./_lib/util.js";
import { normalizeSubs } from "./_lib/transit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const body = await readJson(req);
    const email = String(body.email || "").trim().toLowerCase();
    const subs = normalizeSubs(body.subs);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!subs.length) return res.status(400).json({ error: "Pick at least one line or system." });

    const existing = await getSubscriber(email);
    if (existing && existing.status === "active") {
      // Already paying: email them a link to confirm the new lines (no second charge,
      // and nobody can change someone else's lines just by knowing their email).
      const list = subs.join(",");
      const link = `${siteUrl()}/api/confirm-lines?email=${encodeURIComponent(email)}&subs=${encodeURIComponent(list)}&t=${linesToken(email, list)}`;
      await sendEmail({
        to: email,
        subject: "Confirm your SF Transit Alerts lines",
        html: `<p>Someone (hopefully you) asked to change the lines you get alerts for.</p>
               <p><a href="${link}">Confirm the change</a></p><p>If this wasn't you, ignore this email.</p>`,
      });
      return res.status(200).json({ updated: true, message: "You're already subscribed. Check your email to confirm the new lines." });
    }
    await saveSubscriber({ ...(existing || {}), email, subs, status: "pending", createdAt: Date.now() });

    const session = await stripe("POST", "checkout/sessions", {
      mode: "subscription",
      line_items: { 0: { price: env("STRIPE_PRICE_ID"), quantity: 1 } },
      customer_email: email,
      client_reference_id: email,
      metadata: { email },
      subscription_data: { metadata: { email } },
      allow_promotion_codes: "true",
      success_url: `${siteUrl()}/subscribe.html?success=1`,
      cancel_url: `${siteUrl()}/subscribe.html?canceled=1`,
    });
    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong starting checkout. Please try again." });
  }
};
