/**
 * Long-run production stability verification.
 * Exercises repeated login → executive-home → Pillow chat cycles with idle gaps.
 *
 * Usage: node backend/scripts/production-long-run-stability.mjs
 */
const BASE = process.env.EMPIRE_COCKPIT_URL ?? "https://empire-ai.co";
const BRAIN = process.env.RAILWAY_BRAIN_URL ?? "https://empireai-production.up.railway.app";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL ?? "founder@empireai.com";
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD ?? "EmpireAI2026!";
const CYCLES = Number(process.env.STABILITY_CYCLES ?? 3);
const IDLE_MS = Number(process.env.STABILITY_IDLE_MS ?? 15_000);
const HEALTH_TIMEOUT_MS = 5_000;

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

async function checkBrainHealth(label) {
  const res = await fetch(`${BRAIN}/health/live`, {
    signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${label}: health/live HTTP ${res.status}`);
  const body = await res.json();
  if (body.brain !== "online") throw new Error(`${label}: brain not online`);
  if (typeof body.eventLoopLagMs === "number" && body.eventLoopLagMs > 2_000) {
    console.warn(`  warn: event loop lag ${body.eventLoopLagMs}ms`);
  }
  if (body.sqlite?.pending) {
    console.log(`  sqlite persist pending (flushes: ${body.sqlite.flushCount ?? 0})`);
  }
  return body;
}

async function login() {
  return timed("login", async () => {
    const loginPromise = fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    await checkBrainHealth("health during login");
    const res = await loginPromise;
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body)}`);
    const cookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    const cookie = extractCookie(cookies);
    if (!cookie) throw new Error("No session cookie returned");
    return { cookie, user: body.user };
  });
}

async function logout(cookie) {
  await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: { cookie },
  });
}

async function executiveHome(cookie) {
  return timed("executive-home dispatch", async () => {
    const dispatchPromise = fetch(`${BASE}/api/brain/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ module: "executive-home", action: "load" }),
    });
    await new Promise((r) => setTimeout(r, 1500));
    await checkBrainHealth("health during executive-home");
    const res = await dispatchPromise;
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
    if (body.result?._trace) console.log("  trace:", JSON.stringify(body.result._trace));
    return body;
  });
}

async function ensurePillowSession(cookie) {
  return timed("pillow session", async () => {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      const res = await fetch(`${BASE}/api/pillow/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({}),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.session) return body.session;
      if (res.status === 503 && body.lifecycle === "starting") {
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }
      throw new Error(`HTTP ${res.status} ${JSON.stringify(body)}`);
    }
    throw new Error("Pillow session timed out");
  });
}

async function pillowChat(cookie, sessionId, message, index) {
  return timed(`pillow chat ${index}`, async () => {
    await checkBrainHealth(`health before pillow chat ${index}`);
    const res = await fetch(`${BASE}/api/pillow/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ message, sessionId }),
      signal: AbortSignal.timeout(65_000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
    const text = body.result?.message ?? body.message ?? "";
    if (!text || text.length < 5) throw new Error(`Empty reply: ${JSON.stringify(body).slice(0, 200)}`);
    if (body.result?.trace) console.log("  trace:", JSON.stringify(body.result.trace));
    console.log(`  reply: ${text.slice(0, 120)}`);
    return body;
  });
}

async function runCycle(cycle) {
  console.log(`\n=== Stability cycle ${cycle}/${CYCLES} ===`);

  const { cookie } = await login();
  await executiveHome(cookie);
  const session = await ensurePillowSession(cookie);

  const messages = [
    `Cycle ${cycle}: Hello Pillow — one short sentence.`,
    `Cycle ${cycle}: Confirm you are connected — one sentence.`,
    `Cycle ${cycle}: Still stable? One sentence.`,
  ];

  for (const [index, message] of messages.entries()) {
    await pillowChat(cookie, session.sessionId, message, index + 1);
  }

  await logout(cookie);
  console.log(`Cycle ${cycle} complete — idling ${IDLE_MS}ms`);
  await new Promise((r) => setTimeout(r, IDLE_MS));
  await checkBrainHealth(`health after cycle ${cycle} idle`);
}

async function main() {
  console.log(`Long-run stability test: ${CYCLES} cycles at ${BASE}`);
  console.log(`Brain: ${BRAIN}`);

  await checkBrainHealth("baseline health");

  for (let cycle = 1; cycle <= CYCLES; cycle++) {
    await runCycle(cycle);
  }

  console.log("\n=== Re-login stress (3 rapid logins) ===");
  for (let i = 1; i <= 3; i++) {
    const { cookie } = await login();
    await checkBrainHealth(`health after rapid login ${i}`);
    await logout(cookie);
  }

  console.log("\nLong-run stability: ALL CYCLES PASSED");
}

main().catch((error) => {
  console.error("\nLong-run stability FAILED:", error.message);
  process.exit(1);
});
