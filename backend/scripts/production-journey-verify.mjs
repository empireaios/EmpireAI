/**
 * Production journey verification — empire-ai.co full path.
 * Usage: node backend/scripts/production-journey-verify.mjs
 */
const BASE = process.env.EMPIRE_COCKPIT_URL ?? "https://empire-ai.co";
const BRAIN = process.env.RAILWAY_BRAIN_URL ?? "https://empireai-production.up.railway.app";
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
    const loginPromise = fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    await new Promise((r) => setTimeout(r, 500));
    const healthDuring = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(3000) });
    if (!healthDuring.ok) throw new Error(`health/live failed during login: HTTP ${healthDuring.status}`);
    console.log("  health/live during login: OK");
    const res = await loginPromise;
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

  await timed("stale session cookie cleared", async () => {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { cookie: "empireai_session=invalid-stale-token" },
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const cleared = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    const hasClear = cleared.some((h) => /empireai_session=;|Max-Age=0/i.test(h));
    if (!hasClear) throw new Error("401 did not clear session cookie");
    const loginPage = await fetch(`${BASE}/login`, {
      redirect: "manual",
      headers: { cookie: "empireai_session=invalid-stale-token" },
    });
    if (loginPage.status >= 300 && loginPage.status < 400) {
      throw new Error(`Stale cookie still redirects login (${loginPage.status})`);
    }
    return true;
  });

  await timed("health/live baseline", async () => {
    const res = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

  await timed("executive-home dispatch", async () => {
    const dispatchPromise = fetch(`${BASE}/api/brain/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: loginRes.cookie },
      body: JSON.stringify({ module: "executive-home", action: "load" }),
    });
    await new Promise((r) => setTimeout(r, 1500));
    const healthDuring = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(3000) });
    if (!healthDuring.ok) throw new Error(`health/live failed during dispatch: HTTP ${healthDuring.status}`);
    const healthBody = await healthDuring.json();
    if (healthBody.brain !== "online") throw new Error("health/live not online during dispatch");
    console.log("  health/live during dispatch: OK");
    const res = await dispatchPromise;
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
    if (body.result?._trace) console.log("  executive-home trace:", JSON.stringify(body.result._trace));
    if (body.result?._fallback) console.log("  executive-home fallback: true");
    return body;
  });

  const pillowHealth = await timed("pillow health", async () => {
    const res = await fetch(`${BASE}/api/pillow/health`, { headers: { cookie: loginRes.cookie } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return body;
  });

  const session = await timed("pillow session create", async () => {
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      const res = await fetch(`${BASE}/api/pillow/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: loginRes.cookie },
        body: JSON.stringify({}),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.session) return body.session;
      if (res.status === 503 && body.lifecycle === "starting") {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      throw new Error(`HTTP ${res.status} ${JSON.stringify(body)}`);
    }
    throw new Error("Pillow session create timed out after 90s");
  });

  await timed("pillow chat message 1", async () => {
    const res = await fetch(`${BASE}/api/pillow/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: loginRes.cookie },
      body: JSON.stringify({
        message: "Hello Pillow — reply in one short sentence.",
        sessionId: session.sessionId,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
    const text = body.result?.message ?? body.message ?? "";
    if (!text || text.length < 5) throw new Error(`Empty Pillow response: ${JSON.stringify(body).slice(0, 200)}`);
    if (body.result?.trace) console.log("  trace:", JSON.stringify(body.result.trace));
    console.log(`  reply 1: ${text.slice(0, 160)}`);
    return body;
  });

  for (const [index, message] of [
    "What is your role in EmpireAI? One sentence.",
    "Confirm you are still connected. One sentence.",
  ].entries()) {
    await timed(`pillow chat message ${index + 2}`, async () => {
      const res = await fetch(`${BASE}/api/pillow/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: loginRes.cookie },
        body: JSON.stringify({ message, sessionId: session.sessionId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
      const text = body.result?.message ?? body.message ?? "";
      if (!text || text.length < 5) throw new Error(`Empty Pillow response: ${JSON.stringify(body).slice(0, 200)}`);
      if (body.result?.trace) console.log("  trace:", JSON.stringify(body.result.trace));
      console.log(`  reply ${index + 2}: ${text.slice(0, 160)}`);
      return body;
    });
  }

  console.log("\nProduction journey: ALL STEPS PASSED");
}

main().catch((error) => {
  console.error("\nProduction journey FAILED:", error.message);
  process.exit(1);
});
