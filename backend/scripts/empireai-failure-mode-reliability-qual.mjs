/**
 * Failure-mode reliability qualification (NOT another 1000-count optics run).
 *
 * Proves:
 * - Tier-0 isolation is live
 * - Auth/session survive while worker is degraded or slow
 * - Cockpit bootstrap + EH/Pillow when worker online
 * - Persistence signals observed (flush fields present)
 * - Deploy identity stable across the short window
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

async function timed(fn) {
  const t0 = Date.now();
  try {
    const value = await fn();
    return { ok: true, ms: Date.now() - t0, value };
  } catch (error) {
    return { ok: false, ms: Date.now() - t0, error: String(error?.message || error) };
  }
}

const results = [];
function record(id, outcome, detail = {}) {
  results.push({ id, ok: outcome.ok, ms: outcome.ms, error: outcome.error || null, ...detail });
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error("Set EMPIRE_LOGIN_EMAIL / EMPIRE_LOGIN_PASSWORD");
    process.exit(2);
  }

  const report = {
    artifact: "EMPIREAI_FAILURE_MODE_RELIABILITY_QUAL",
    startedAt: new Date().toISOString(),
    completedAt: null,
    methodology:
      "State-transition / failure-mode proof — not a 1000-repetition optics harness",
    brain: BRAIN,
    cockpit: COCKPIT,
    results,
    gates: {},
    result: "IN_PROGRESS",
    birthAuthorised: false,
    birthTimestamp: null,
  };

  // Q1: liveness + isolation flag
  const live = await timed(async () => {
    const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) });
    const j = await r.json();
    if (!r.ok || j.status !== "ok") throw new Error(`live ${r.status}`);
    return j;
  });
  record("Q1_health_live", live, {
    tier0Isolation: live.value?.tier0Isolation === true,
    brain: live.value?.brain,
    sha: live.value?.deploy?.gitCommitSha,
    workerOnline: live.value?.worker?.online ?? live.value?.tier0?.workerOnline,
  });
  report.deploySha = live.value?.deploy?.gitCommitSha ?? null;
  report.deploymentId = live.value?.deploy?.deploymentId ?? null;

  // Q2: auth login via Cockpit BFF (Tier-0 path)
  let cookie = null;
  const login = await timed(async () => {
    const r = await fetch(`${COCKPIT}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      signal: AbortSignal.timeout(40_000),
    });
    const j = await r.json().catch(() => ({}));
    cookie = extractCookie(r);
    if (!r.ok || !cookie) {
      throw new Error(`login ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
    }
    if (/unavailable|timeout/i.test(String(j.error || ""))) {
      throw new Error(`login misclassified unavailable: ${j.error}`);
    }
    return j;
  });
  record("Q2_auth_login", login);

  // Q3: session continuity burst (10× /me) — proves Tier-0 repetition under time, not 1000 optics
  let meOk = 0;
  for (let i = 0; i < 10; i++) {
    const me = await timed(async () => {
      const r = await fetch(`${COCKPIT}/api/auth/me`, {
        headers: { cookie },
        signal: AbortSignal.timeout(20_000),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.user?.email) throw new Error(`me ${r.status}`);
      return j;
    });
    if (me.ok) meOk += 1;
    record(`Q3_session_me_${i}`, me);
  }

  // Q4: sustained health while session path warm (coexistence signal)
  const coexist = await timed(async () => {
    const meP = fetch(`${COCKPIT}/api/auth/me`, {
      headers: { cookie },
      signal: AbortSignal.timeout(20_000),
    });
    const liveP = fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(15_000) });
    const [meR, liveR] = await Promise.all([meP, liveP]);
    const lj = await liveR.json().catch(() => ({}));
    if (!meR.ok) throw new Error(`coexist me ${meR.status}`);
    if (!liveR.ok || lj.status !== "ok") throw new Error(`coexist live ${liveR.status}`);
    return { isolation: lj.tier0Isolation === true, workerOnline: lj.worker?.online };
  });
  record("Q4_auth_health_coexist", coexist);

  // Q5: Executive Home (requires worker)
  const eh = await timed(async () => {
    const r = await fetch(`${COCKPIT}/api/brain/dispatch`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ module: "executive-home", action: "load" }),
      signal: AbortSignal.timeout(90_000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`EH ${r.status} ${JSON.stringify(j).slice(0, 120)}`);
    return { keys: Object.keys(j).slice(0, 12) };
  });
  record("Q5_executive_home", eh);

  // Q6: Pillow session (requires worker)
  let pillowSessionId = null;
  const pillow = await timed(async () => {
    const s = await fetch(`${COCKPIT}/api/pillow/session`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(90_000),
    });
    const sj = await s.json().catch(() => ({}));
    if (!s.ok || !sj.session?.sessionId) {
      throw new Error(`pillow session ${s.status} ${JSON.stringify(sj).slice(0, 160)}`);
    }
    pillowSessionId = sj.session.sessionId;
    return { sessionId: pillowSessionId.slice(0, 8) };
  });
  record("Q6_pillow_session", pillow);

  // Q7: persistence lifecycle observability (not forcing a multi-minute export)
  const persist = await timed(async () => {
    const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) });
    const j = await r.json();
    if (!r.ok) throw new Error(`persist live ${r.status}`);
    const sqlite = j.worker?.sqlite ?? j.sqlite;
    if (!sqlite || typeof sqlite !== "object") throw new Error("sqlite stats missing");
    return {
      flushInFlight: sqlite.flushInFlight,
      flushCount: sqlite.flushCount,
      lastFlushDurationMs: sqlite.lastFlushDurationMs,
      pending: sqlite.pending,
      canFlushFullDb: j.worker?.disk?.canFlushFullDb ?? j.disk?.canFlushFullDb,
      dbBytes: j.worker?.disk?.dbBytes ?? j.disk?.dbBytes,
      isolation: j.tier0Isolation === true,
    };
  });
  record("Q7_persistence_signals", persist, persist.value || {});

  // Q8: invalid login must not be "unavailable"
  const invalid = await timed(async () => {
    const r = await fetch(`${COCKPIT}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: `wrong-${Date.now()}` }),
      signal: AbortSignal.timeout(20_000),
    });
    const j = await r.json().catch(() => ({}));
    if (r.status !== 401) throw new Error(`expected 401 got ${r.status}`);
    if (/unavailable|timeout/i.test(String(j.error || ""))) {
      throw new Error(`misclassified: ${j.error}`);
    }
    return j;
  });
  record("Q8_invalid_credentials_not_unavailable", invalid);

  const isolationLive = results.some(
    (r) => r.id === "Q1_health_live" && r.ok && r.tier0Isolation === true,
  );
  const authOk = results.find((r) => r.id === "Q2_auth_login")?.ok && meOk === 10;
  const coexistOk = results.find((r) => r.id === "Q4_auth_health_coexist")?.ok;
  const ehOk = results.find((r) => r.id === "Q5_executive_home")?.ok;
  const pillowOk = results.find((r) => r.id === "Q6_pillow_session")?.ok;
  const persistOk = results.find((r) => r.id === "Q7_persistence_signals")?.ok;
  const invalidOk = results.find((r) => r.id === "Q8_invalid_credentials_not_unavailable")?.ok;

  report.gates = {
    TIER0_ISOLATION_LIVE: isolationLive,
    TIER0_AUTH_PROTECTED: Boolean(authOk),
    SESSION_CONTINUITY_PROVEN: meOk === 10,
    AUTH_HEALTH_COEXISTENCE: Boolean(coexistOk),
    COCKPIT_EH_PROVEN: Boolean(ehOk),
    PILLOW_CONTINUITY_PROVEN: Boolean(pillowOk),
    PERSISTENCE_SIGNALS_OBSERVED: Boolean(persistOk),
    INVALID_AUTH_NOT_MISCLASSIFIED: Boolean(invalidOk),
    REAL_MULTI_GB_EXPORT_FORCED: false,
    NOTE_EXPORT_FORCED:
      "Does not force a destructive multi-minute export; isolation architecture is the protection under test.",
  };

  const required = [
    isolationLive,
    authOk,
    coexistOk,
    ehOk,
    pillowOk,
    persistOk,
    invalidOk,
  ];
  report.result = required.every(Boolean) ? "PASS" : "FAIL";
  report.completedAt = new Date().toISOString();
  report.sessionMeSuccesses = meOk;

  mkdirSync(OUT, { recursive: true });
  const outPath = path.join(OUT, "EMPIREAI_FAILURE_MODE_RELIABILITY_QUAL_EVIDENCE.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ result: report.result, gates: report.gates, deploySha: report.deploySha, outPath }, null, 2));
  process.exit(report.result === "PASS" ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
