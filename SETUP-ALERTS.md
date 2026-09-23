# SF Transit premium alerts: setup

**What it is:** free live Muni/BART/Caltrain alerts at `sf-transit.com/subscribe.html`, plus **$5/month** email alerts for the lines each subscriber picks.
**Goal:** $50/week ≈ $217/month. After Stripe's fee (2.9% + 30¢) you net about $4.55 per subscriber, so you need **~48 subscribers** (~52 if you upgrade email, below).

## 1. Code
Already in this repo:
```
api/                          ← serverless functions Vercel runs automatically
  _lib/util.js, _lib/transit.js
  alerts.js, checkout.js, stripe-webhook.js, manage.js, confirm-lines.js, send-alerts.js
  realtime/alerts.js, realtime/transit-data.js   ← powers the Real-Time tab on Vercel
public/subscribe.html         ← the Service Alerts page (sf-transit.com/subscribe.html)
.github/workflows/transit-alerts.yml   ← runs the alert check every 10 min
```
`server.ts` is only used for local development (`npm run dev`); Vercel uses the `api/` folder.

## 2. Create the free accounts and keys
| Service | What to do | Cost |
|---|---|---|
| **511.org** | Request a free API token at 511.org/open-data/token | Free |
| **Stripe** | Create a Product "SF Transit Alerts" with a $5/month recurring price. Copy the **Price ID** (`price_...`) and **Secret key** (`sk_live_...`) | 2.9% + 30¢ per charge |
| **Upstash Redis** | In Vercel: your project → **Storage → Create → Upstash (Redis)** → connect it. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically | Free tier |
| **Resend** | Sign up, add and verify the domain `sf-transit.com` (DNS records go in Vercel → Domains), then create an API key | Free up to 3,000 emails/mo and 100/day |

## 3. Set environment variables in Vercel
1. Fill in your keys in the block below. Do this in a note on your computer, not in this file, because this file goes into your public repo.
```
API_511_KEY=your 511 token
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
RESEND_API_KEY=re_...
LINK_SECRET=any long random string
CRON_SECRET=another long random string
EMAIL_FROM=SF Transit Alerts <alerts@sf-transit.com>
SITE_URL=https://sf-transit.com
```
2. In Vercel, open your project, then **Settings → Environment Variables**.
3. Paste the whole block into the first **Key** box. Vercel splits it into separate rows by itself.
4. Leave all environments checked and click **Save**.
5. Go to **Deployments → ⋯ → Redeploy** so the site picks up the keys.

The database keys (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) are added automatically when you connect Upstash. `STRIPE_WEBHOOK_SECRET` comes later in step 4. Add it the same way, then redeploy again.

## 4. Connect Stripe to your site
Stripe → **Developers → Webhooks → Add endpoint**
- URL: `https://sf-transit.com/api/stripe-webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

Also turn on the **Customer portal** (Settings → Billing → Customer portal) so subscribers can cancel themselves.

## 5. Turn on the 10-minute alert check
GitHub repo → **Settings → Secrets and variables → Actions → New repository secret** → name `CRON_SECRET`, same value as in Vercel.
Test it: **Actions → Send transit alerts → Run workflow**. The first run only records the alerts that are already active, so nobody gets flooded. After that, only new alerts are emailed.
(GitHub pauses scheduled workflows after 60 days without any commits, so push a small change every couple of months.)

## 6. Test before you launch
Use Stripe **test mode** keys first (`sk_test_...`, test price) and card `4242 4242 4242 4242`. Subscribe to "All Muni", run the workflow, and check that the email arrives. Then switch to live keys.

## Getting to ~48 subscribers
The code is the easy part. Subscribers come from being where riders already are:
- Post in r/sanfrancisco, r/bayarea, r/sfmuni, and Nextdoor for neighborhoods along the N/J/L/38 when there's a big disruption. Screenshot your live alerts page.
- Put a QR-code flyer on community boards near busy stops (where allowed).
- Offer a free first month with a Stripe promo code. Checkout already accepts codes.
- Keep the live alerts page free and fast, since that's what gets shared.

**Watch costs:** Resend's free plan caps at 100 emails/day. Once you pass about 30 active subscribers, check your Resend usage. You may need the $20/mo plan, which raises the goal to about 52 subscribers.
