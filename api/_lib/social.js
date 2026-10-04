// Posts new transit alerts to the official SF Transit Bluesky account and Telegram channel.
// Optional: each one only runs if its keys are set in Vercel → Environment Variables.
//   BSKY_HANDLE          e.g. sftransit.bsky.social
//   BSKY_APP_PASSWORD    Bluesky → Settings → Privacy and security → App passwords
//   TELEGRAM_BOT_TOKEN   from @BotFather
//   TELEGRAM_CHAT_ID     your channel, e.g. @sftransitalerts (the bot must be a channel admin)

const SITE = "sf-transit.com";
const LINK = "https://www.sf-transit.com/subscribe.html";
const MAX_POSTS_PER_RUN = 3;

// Small stop moves are too noisy for a public feed; email subscribers still get them.
const MINOR = /\bSTOP (TEMP\.?|TEMPORARILY|PERMANENTLY) (MOVED|CLOSED)\b|\bRRT STOP CLOSED\b|elevator|escalator/i;
const MAJOR = /delay|shutdown|suspend|no service|shuttle|reroute|detour|disrupt|single.?track|out of service|late|cancel/i;

function pickAlerts(alerts) {
  const usable = alerts.filter((a) => (a.header || a.description) && !MINOR.test(a.header || ""));
  usable.sort((a, b) => Number(MAJOR.test(b.header + " " + b.description)) - Number(MAJOR.test(a.header + " " + a.description)));
  return usable.slice(0, MAX_POSTS_PER_RUN);
}

function postText(a, max) {
  const routes = a.routes && a.routes.length ? " " + a.routes.slice(0, 4).join(", ") : "";
  const head = `🚨 ${a.agencyName}${routes}: `;
  const tail = `\n\nLive alerts → ${SITE}`;
  let body = (a.header || a.description || "Service alert").replace(/\s+/g, " ").trim();
  const room = max - head.length - tail.length;
  if (body.length > room) body = body.slice(0, Math.max(0, room - 1)).trimEnd() + "…";
  return head + body + tail;
}

async function postBluesky(alerts) {
  const handle = process.env.BSKY_HANDLE;
  const password = process.env.BSKY_APP_PASSWORD;
  if (!handle || !password) return { skipped: true };
  const login = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: handle, password }),
  });
  if (!login.ok) throw new Error(`Bluesky login ${login.status}`);
  const { accessJwt, did } = await login.json();
  let posted = 0;
  for (const a of alerts) {
    const text = postText(a, 290);
    const enc = new TextEncoder();
    const start = enc.encode(text.slice(0, text.lastIndexOf(SITE))).length;
    const record = {
      $type: "app.bsky.feed.post",
      text,
      createdAt: new Date().toISOString(),
      langs: ["en"],
      facets: [{
        index: { byteStart: start, byteEnd: start + enc.encode(SITE).length },
        features: [{ $type: "app.bsky.richtext.facet#link", uri: LINK }],
      }],
    };
    const r = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessJwt}` },
      body: JSON.stringify({ repo: did, collection: "app.bsky.feed.post", record }),
    });
    if (!r.ok) throw new Error(`Bluesky post ${r.status}`);
    posted++;
  }
  return { posted };
}

async function postTelegram(alerts) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { skipped: true };
  let posted = 0;
  for (const a of alerts) {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: postText(a, 900).replace(SITE, LINK), disable_web_page_preview: true }),
    });
    if (!r.ok) throw new Error(`Telegram ${r.status}`);
    posted++;
  }
  return { posted };
}

// Never throws: a social-media hiccup must not stop subscriber emails.
export async function postToSocial(freshAlerts) {
  const alerts = pickAlerts(freshAlerts || []);
  const out = { candidates: alerts.length };
  if (!alerts.length) return out;
  for (const [name, fn] of [["bluesky", postBluesky], ["telegram", postTelegram]]) {
    try { out[name] = await fn(alerts); } catch (e) { out[name] = { error: e.message }; console.error(name, e); }
  }
  return out;
}
