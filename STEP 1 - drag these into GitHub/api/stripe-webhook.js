// POST /api/stripe-webhook  ← Stripe calls this when people subscribe / cancel.
// In Stripe: Developers → Webhooks → add endpoint https://sf-transit.com/api/stripe-webhook
// Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
import { env, redis, getSubscriber, saveSubscriber, verifyStripeSignature, readRawBody, sendEmail, manageUrl, siteUrl } from "./_lib/util.js";
import { AGENCIES } from "./_lib/transit.js";

async function setActive(email, active) {
  if (active) await redis("SADD", "subs:active", email);
  else await redis("SREM", "subs:active", email);
}

function describeSubs(subs) {
  return subs
    .map((s) => {
      const [ag, r] = s.split(":");
      return r === "*" ? `All ${AGENCIES[ag]}` : `${AGENCIES[ag]} ${r}`;
    })
    .join(", ");
}

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const raw = await readRawBody(req);
  if (!verifyStripeSignature(raw, req.headers["stripe-signature"], env("STRIPE_WEBHOOK_SECRET"))) {
    return res.status(400).send("Bad signature");
  }
  const event = JSON.parse(raw);
  const obj = event.data.object;

  try {
    if (event.type === "checkout.session.completed") {
      const email = ((obj.metadata && obj.metadata.email) || obj.client_reference_id || obj.customer_email || "").toLowerCase();
      if (!email) return res.status(200).send("no email");
      const sub = (await getSubscriber(email)) || { email, subs: ["SF:*"] };
      Object.assign(sub, { status: "active", customerId: obj.customer, subscriptionId: obj.subscription, activatedAt: Date.now() });
      await saveSubscriber(sub);
      await setActive(email, true);
      await sendEmail({
        to: email,
        subject: "You're subscribed to SF Transit Alerts",
        html: `<p>Thanks for subscribing! You'll get an email when a new alert affects: <b>${describeSubs(sub.subs)}</b>.</p>
               <p>Change your lines anytime at <a href="${siteUrl()}/subscribe.html">sf-transit.com/subscribe</a> using this same email address.</p>
               <p><a href="${manageUrl(email)}">Manage billing or cancel</a></p>`,
      }).catch((e) => console.error("welcome email failed", e));
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const email = ((obj.metadata && obj.metadata.email) || "").toLowerCase();
      if (email) {
        const active = event.type === "customer.subscription.updated" && ["active", "trialing"].includes(obj.status);
        const sub = await getSubscriber(email);
        if (sub) {
          sub.status = active ? "active" : "inactive";
          await saveSubscriber(sub);
        }
        await setActive(email, active);
      }
    }
    res.status(200).json({ received: true });
  } catch (e) {
    console.error(e);
    res.status(500).send("error"); // Stripe retries automatically
  }
}

export default handler;
