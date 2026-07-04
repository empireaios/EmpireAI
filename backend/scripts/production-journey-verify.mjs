/**
 * Production journey verification — empire-ai.co full path.
 * Usage: node backend/scripts/production-journey-verify.mjs
 */
const BASE = process.env.EMPIRE_COCKPIT_URL ?? "https://empire-ai.co";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL ?? "founder@empireai.com";
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD ?? "EmpireAI2026!";

function extractCookie(setCookies) {
  for (const header of setCookies) {
    const match = header.match(/^empireai_session=([^;]+)/);
    if (match) return `empireai_session=${match[1]}`;
  }
  return null;
}

async function timed(label, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`[PASS] ${label} (${Date.now() - start}ms)`);
    return result;
  } catch (error) {
    console.log(`[FAIL] ${label} (${Date.now() - start}ms): ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log(`Verifying production journey at ${BASE}`);

  const loginRes = await timed("login", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body)}`);
    const cookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    const cookie = extractCookie(cookies);
    if (!cookie) throw new Error("No session cookie returned");
    return { cookie, user: body.user };
  });

  await timed("auth/me", async () => {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { cookie: loginRes.cookie },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body)}`);
    if (!body.user?.email) throw new Error("No user in session");
    return body;
  });

  await timed("executive-home dispatch", async () => {
    const res = await fetch(`${BASE}/api/brain/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: loginRes.cookie },
      body: JSON.stringify({ module: "executive-home", action: "load" }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
    return body;
  });

  const pillowHealth = await timed("pillow health", async () => {
    const res = await fetch(`${BASE}/api/pillow/health`, { headers: { cookie: loginRes.cookie } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return body;
  });

  const session = await timed("pillow session create", async () => {
    const res = await fetch(`${BASE}/api/pillow/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: loginRes.cookie },
      body: JSON.stringify({}),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 503 && body.lifecycle === "starting") {
      await new Promise((r) => setTimeout(r, 5000));
      const retry = await fetch(`${BASE}/api/pillow/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: loginRes.cookie },
        body: JSON.stringify({}),
      });
      const retryBody = await retry.json().catch(() => ({}));
      if (!retry.ok) throw new Error(`HTTP ${retry.status} ${JSON.stringify(retryBody)}`);
      return retryBody.session;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body)}`);
    return body.session;
  });

  await timed("pillow chat", async () => {
    const res = await fetch(`${BASE}/api/pillow/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: loginRes.cookie },
      body: JSON.stringify({
        message: "Grand King production check — respond with one sentence confirming Pillow is live.",
        sessionId: session.sessionId,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
    const text = body.result?.message ?? body.message ?? "";
    if (!text || text.length < 5) throw new Error(`Empty Pillow response: ${JSON.stringify(body).slice(0, 200)}`);
    console.log(`  Pillow reply: ${text.slice(0, 160)}`);
    return body;
  });

  console.log("\nProduction journey: ALL STEPS PASSED");
}

main().catch((error) => {
  console.error("\nProduction journey FAILED:", error.message);
  process.exit(1);
});
