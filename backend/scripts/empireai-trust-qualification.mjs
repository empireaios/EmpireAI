/**
 * EmpireAI Trust Qualification Harness — Grand King visible reliability.
 *
 * Perfect-run rule: ATTEMPTS=1000, SUCCESSES=1000, FAILURES=0 → PASS.
 * First failure stops the run (no averaging, no silent retry erasure).
 *
 * Env:
 *   EMPIRE_COCKPIT_URL, EMPIRE_BRAIN_URL
 *   EMPIRE_LOGIN_EMAIL / EMPIRE_LOGIN_PASSWORD (or FOUNDER_*)
 *   TRUST_QUAL_TARGET (default 1000)
 *   TRUST_QUAL_DELAY_MS (default 120)
 *   TRUST_QUAL_DRY_PLAN=1 — print plan only
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;
const TARGET = Math.max(1, Number(process.env.TRUST_QUAL_TARGET || 1000));
const DELAY_MS = Math.max(0, Number(process.env.TRUST_QUAL_DELAY_MS || 120));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = path.join(ROOT, "docs/audits/complete-state");

/** Diversified distribution for TARGET=1000 (scaled proportionally otherwise). */
export function buildPlan(target = 1000) {
  const base = {
    "TQ-A": 380, // liveness
    "TQ-B": 220, // auth/session
    "TQ-C": 100, // cockpit bootstrap (BFF session)
    "TQ-D": 60, // executive home
    "TQ-E": 50, // pillow availability
    "TQ-F": 80, // database read
    "TQ-G": 40, // persistence/durability signals
    "TQ-H": 40, // background coexistence
    "TQ-I": 20, // redeploy/identity stability (non-destructive)
    "TQ-J": 10, // degraded dependency behaviour
  };
  const sum = Object.values(base).reduce((a, b) => a + b, 0);
  if (target === sum) return { ...base };
  const scaled = {};
  let allocated = 0;
  const keys = Object.keys(base);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (i === keys.length - 1) {
      scaled[k] = target - allocated;
    } else {
      scaled[k] = Math.max(1, Math.round((base[k] / sum) * target));
      allocated += scaled[k];
    }
  }
  return scaled;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const header of raw) {
    const m = String(header).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

function pct(sorted, p) {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
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

async function main() {
  const plan = buildPlan(TARGET);
  const planSum = Object.values(plan).reduce((a, b) => a + b, 0);
  if (planSum !== TARGET) {
    console.error(`Plan sum ${planSum} != TARGET ${TARGET}`);
    process.exit(2);
  }

  if (process.env.TRUST_QUAL_DRY_PLAN === "1") {
    console.log(JSON.stringify({ target: TARGET, plan }, null, 2));
    return;
  }

  if (!EMAIL || !PASSWORD) {
    console.error("Set EMPIRE_LOGIN_EMAIL and EMPIRE_LOGIN_PASSWORD");
    process.exit(2);
  }

  const report = {
    artifact: "EMPIREAI_TRUST_QUALIFICATION",
    startedAt: new Date().toISOString(),
    completedAt: null,
    cockpit: COCKPIT,
    brain: BRAIN,
    target: TARGET,
    plan,
    deploySha: null,
    deploymentId: null,
    attempts: 0,
    successes: 0,
    failures: 0,
    byClass: {},
    latenciesMs: [],
    firstFailure: null,
    result: "IN_PROGRESS",
    birthAuthorised: false,
    birthTimestamp: null,
  };

  for (const cls of Object.keys(plan)) {
    report.byClass[cls] = { planned: plan[cls], attempts: 0, successes: 0, failures: 0, latenciesMs: [] };
  }

  let cookie = null;
  let pillowSessionId = null;
  let baselineSha = null;
  let chatBudget = Math.min(5, plan["TQ-E"]);

  async function ensureLogin() {
    const r = await fetch(`${COCKPIT}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      signal: AbortSignal.timeout(55_000),
    });
    const body = await r.json().catch(() => ({}));
    cookie = extractCookie(r);
    if (!r.ok || !cookie) {
      throw new Error(`login failed HTTP ${r.status} ${JSON.stringify(body).slice(0, 160)}`);
    }
    return body;
  }

  async function record(cls, label, outcome) {
    report.attempts += 1;
    report.byClass[cls].attempts += 1;
    report.latenciesMs.push(outcome.ms);
    report.byClass[cls].latenciesMs.push(outcome.ms);
    if (outcome.ok) {
      report.successes += 1;
      report.byClass[cls].successes += 1;
    } else {
      report.failures += 1;
      report.byClass[cls].failures += 1;
      report.firstFailure = {
        class: cls,
        label,
        ms: outcome.ms,
        error: outcome.error || "unknown",
        attempt: report.attempts,
        at: new Date().toISOString(),
      };
      report.result = "FAIL";
      report.completedAt = new Date().toISOString();
      finalize(report);
      console.error(JSON.stringify(report.firstFailure, null, 2));
      process.exit(1);
    }
    if (report.attempts % 50 === 0) {
      console.log(
        JSON.stringify({
          progress: `${report.successes}/${TARGET}`,
          lastClass: cls,
          lastLabel: label,
          lastMs: outcome.ms,
        }),
      );
    }
    if (DELAY_MS) await sleep(DELAY_MS);
  }

  // Seed session + deploy identity
  {
    const live = await timed(async () => {
      const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(8_000) });
      const j = await r.json();
      if (!r.ok || j.brain !== "online") throw new Error(`live ${r.status}`);
      baselineSha = j.deploy?.gitCommitSha || null;
      report.deploySha = baselineSha;
      report.deploymentId = j.deploy?.deploymentId || null;
      return j;
    });
    if (!live.ok) {
      report.firstFailure = { class: "BOOTSTRAP", label: "seed-health", error: live.error };
      report.result = "FAIL";
      finalize(report);
      process.exit(1);
    }
    await ensureLogin();
  }

  // TQ-A liveness
  for (let i = 0; i < plan["TQ-A"]; i++) {
    const outcome = await timed(async () => {
      const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(8_000) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.status !== "ok" || j.brain !== "online") {
        throw new Error(`liveness HTTP ${r.status}`);
      }
      return j;
    });
    await record("TQ-A", `live#${i}`, outcome);
  }

  // TQ-B auth/session — mix of /me, logout/relogin, invalid, stale
  const bPlan = plan["TQ-B"];
  const bInvalid = Math.min(15, Math.floor(bPlan * 0.07));
  const bStale = Math.min(10, Math.floor(bPlan * 0.05));
  const bRelogin = Math.min(15, Math.floor(bPlan * 0.07));
  const bMe = bPlan - bInvalid - bStale - bRelogin;

  for (let i = 0; i < bMe; i++) {
    const outcome = await timed(async () => {
      if (!cookie) await ensureLogin();
      const r = await fetch(`${COCKPIT}/api/auth/me`, {
        headers: { cookie },
        signal: AbortSignal.timeout(20_000),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.user?.email) throw new Error(`auth/me HTTP ${r.status}`);
      return j;
    });
    await record("TQ-B", `me#${i}`, outcome);
  }

  for (let i = 0; i < bInvalid; i++) {
    const outcome = await timed(async () => {
      const r = await fetch(`${COCKPIT}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: EMAIL, password: `wrong-${i}-${Date.now()}` }),
        signal: AbortSignal.timeout(20_000),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status !== 401) throw new Error(`expected 401 got ${r.status}`);
      const msg = String(j.error || j.message || "");
      if (/unavailable|timeout|taking longer/i.test(msg)) {
        throw new Error(`misclassified unavailable: ${msg}`);
      }
      if (!/invalid/i.test(msg)) throw new Error(`unexpected auth error: ${msg}`);
      return j;
    });
    await record("TQ-B", `invalid#${i}`, outcome);
  }

  for (let i = 0; i < bStale; i++) {
    const outcome = await timed(async () => {
      const r = await fetch(`${COCKPIT}/api/auth/me`, {
        headers: { cookie: "empireai_session=invalid-stale-token" },
        signal: AbortSignal.timeout(20_000),
      });
      if (r.status !== 401) throw new Error(`stale expected 401 got ${r.status}`);
      return { status: r.status };
    });
    await record("TQ-B", `stale#${i}`, outcome);
  }

  for (let i = 0; i < bRelogin; i++) {
    const outcome = await timed(async () => {
      if (cookie) {
        await fetch(`${COCKPIT}/api/auth/logout`, {
          method: "POST",
          headers: { cookie },
          signal: AbortSignal.timeout(20_000),
        });
      }
      const unauth = await fetch(`${COCKPIT}/api/auth/me`, {
        headers: cookie ? { cookie } : {},
        signal: AbortSignal.timeout(20_000),
      });
      if (unauth.status !== 401) throw new Error(`post-logout expected 401 got ${unauth.status}`);
      await ensureLogin();
      const me = await fetch(`${COCKPIT}/api/auth/me`, {
        headers: { cookie },
        signal: AbortSignal.timeout(20_000),
      });
      if (!me.ok) throw new Error(`relogin me ${me.status}`);
      return { ok: true };
    });
    await record("TQ-B", `relogin#${i}`, outcome);
  }

  // TQ-C cockpit bootstrap — BFF session path used by CockpitAuthGuard
  for (let i = 0; i < plan["TQ-C"]; i++) {
    const outcome = await timed(async () => {
      if (!cookie) await ensureLogin();
      const r = await fetch(`${COCKPIT}/api/auth/me`, {
        headers: { cookie },
        signal: AbortSignal.timeout(20_000),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.user) throw new Error(`cockpit bootstrap me ${r.status}`);
      const live = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(8_000) });
      const lj = await live.json().catch(() => ({}));
      if (!live.ok || lj.brain !== "online") throw new Error("brain offline during cockpit bootstrap");
      return j;
    });
    await record("TQ-C", `bootstrap#${i}`, outcome);
  }

  // TQ-D Executive Home
  for (let i = 0; i < plan["TQ-D"]; i++) {
    const outcome = await timed(async () => {
      if (!cookie) await ensureLogin();
      const r = await fetch(`${COCKPIT}/api/brain/dispatch`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ module: "executive-home", action: "load" }),
        signal: AbortSignal.timeout(60_000),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`EH HTTP ${r.status} ${JSON.stringify(j).slice(0, 120)}`);
      return j;
    });
    await record("TQ-D", `eh#${i}`, outcome);
  }

  // TQ-E Pillow — health-heavy, bounded chat
  for (let i = 0; i < plan["TQ-E"]; i++) {
    const outcome = await timed(async () => {
      if (!cookie) await ensureLogin();
      if (i < chatBudget) {
        if (!pillowSessionId) {
          const s = await fetch(`${COCKPIT}/api/pillow/session`, {
            method: "POST",
            headers: { "content-type": "application/json", cookie },
            body: JSON.stringify({}),
            signal: AbortSignal.timeout(60_000),
          });
          const sj = await s.json().catch(() => ({}));
          pillowSessionId = sj.session?.sessionId || null;
          if (!s.ok || !pillowSessionId) throw new Error(`pillow session ${s.status}`);
        }
        const c = await fetch(`${COCKPIT}/api/pillow/chat`, {
          method: "POST",
          headers: { "content-type": "application/json", cookie },
          body: JSON.stringify({
            sessionId: pillowSessionId,
            message: "Trust qual: reply with exactly the word ONLINE.",
          }),
          signal: AbortSignal.timeout(60_000),
        });
        const cj = await c.json().catch(() => ({}));
        const text = cj.result?.message ?? cj.message ?? "";
        if (!c.ok || text.length < 4) throw new Error(`pillow chat ${c.status}`);
        return { text: text.slice(0, 80) };
      }
      const h = await fetch(`${COCKPIT}/api/pillow/health`, {
        headers: { cookie },
        signal: AbortSignal.timeout(20_000),
      });
      if (!h.ok) throw new Error(`pillow health ${h.status}`);
      return await h.json().catch(() => ({}));
    });
    await record("TQ-E", i < chatBudget ? `chat#${i}` : `pillow-health#${i}`, outcome);
  }

  // TQ-F database read
  for (let i = 0; i < plan["TQ-F"]; i++) {
    const outcome = await timed(async () => {
      if (!cookie) await ensureLogin();
      const r = await fetch(`${COCKPIT}/api/pillow-commissioning/status`, {
        headers: { cookie },
        signal: AbortSignal.timeout(30_000),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`commissioning status ${r.status}`);
      const one = j.oneProduct;
      if (!one?.asin && !one?.commissioningId) {
        // tolerate nested shapes
        if (!j.operating && !j.birth) throw new Error("commissioning payload missing core fields");
      }
      return j;
    });
    await record("TQ-F", `db-read#${i}`, outcome);
  }

  // TQ-G persistence signals (read-only durability health)
  for (let i = 0; i < plan["TQ-G"]; i++) {
    const outcome = await timed(async () => {
      const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(8_000) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`persist probe ${r.status}`);
      if (j.sqlite?.lastFlushError) throw new Error(`lastFlushError=${j.sqlite.lastFlushError}`);
      if (j.disk?.canFlushFullDb === false && !j.sqlite?.flushInFlight) {
        throw new Error("canFlushFullDb=false while idle");
      }
      if (j.disk?.exists !== true) throw new Error("data volume missing");
      return j.sqlite;
    });
    await record("TQ-G", `persist#${i}`, outcome);
  }

  // TQ-H background coexistence — health while EH in flight
  for (let i = 0; i < plan["TQ-H"]; i++) {
    const outcome = await timed(async () => {
      if (!cookie) await ensureLogin();
      const ehPromise = fetch(`${COCKPIT}/api/brain/dispatch`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ module: "executive-home", action: "load" }),
        signal: AbortSignal.timeout(60_000),
      });
      await sleep(200);
      const live = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(8_000) });
      const lj = await live.json().catch(() => ({}));
      if (!live.ok || lj.brain !== "online") throw new Error("live failed during EH");
      const eh = await ehPromise;
      if (!eh.ok) throw new Error(`EH during coexist ${eh.status}`);
      return { lag: lj.eventLoopLagMs };
    });
    await record("TQ-H", `coexist#${i}`, outcome);
  }

  // TQ-I deploy identity stability (non-destructive stand-in for restart recovery proof)
  for (let i = 0; i < plan["TQ-I"]; i++) {
    const outcome = await timed(async () => {
      const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(8_000) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`identity ${r.status}`);
      const sha = j.deploy?.gitCommitSha;
      if (!sha) throw new Error("missing deploy sha");
      if (baselineSha && sha !== baselineSha) {
        throw new Error(`deploy sha changed mid-run ${baselineSha} → ${sha}`);
      }
      return { sha };
    });
    await record("TQ-I", `identity#${i}`, outcome);
  }

  // TQ-J degraded dependency behaviour
  for (let i = 0; i < plan["TQ-J"]; i++) {
    const outcome = await timed(async () => {
      const r = await fetch(`${COCKPIT}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-a-user@empireai.invalid", password: "x" }),
        signal: AbortSignal.timeout(20_000),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status !== 401) throw new Error(`TQ-J expected 401 got ${r.status}`);
      if (/unavailable/i.test(String(j.error || ""))) {
        throw new Error("invalid user misclassified as unavailable");
      }
      return j;
    });
    await record("TQ-J", `degraded#${i}`, outcome);
  }

  report.result =
    report.attempts === TARGET && report.successes === TARGET && report.failures === 0
      ? "PASS"
      : "FAIL";
  report.completedAt = new Date().toISOString();
  finalize(report);
  console.log(
    JSON.stringify(
      {
        result: report.result,
        attempts: report.attempts,
        successes: report.successes,
        failures: report.failures,
        deploySha: report.deploySha,
        p50: pct([...report.latenciesMs].sort((a, b) => a - b), 0.5),
        p95: pct([...report.latenciesMs].sort((a, b) => a - b), 0.95),
        p99: pct([...report.latenciesMs].sort((a, b) => a - b), 0.99),
        byClass: Object.fromEntries(
          Object.entries(report.byClass).map(([k, v]) => [
            k,
            { planned: v.planned, ok: v.successes, fail: v.failures },
          ]),
        ),
      },
      null,
      2,
    ),
  );
  process.exit(report.result === "PASS" ? 0 : 1);
}

function finalize(report) {
  const sorted = [...report.latenciesMs].sort((a, b) => a - b);
  report.latency = {
    p50Ms: pct(sorted, 0.5),
    p95Ms: pct(sorted, 0.95),
    p99Ms: pct(sorted, 0.99),
    worstMs: sorted.length ? sorted[sorted.length - 1] : null,
  };
  for (const cls of Object.keys(report.byClass)) {
    const s = [...report.byClass[cls].latenciesMs].sort((a, b) => a - b);
    report.byClass[cls].latency = {
      p50Ms: pct(s, 0.5),
      p95Ms: pct(s, 0.95),
      worstMs: s.length ? s[s.length - 1] : null,
    };
    delete report.byClass[cls].latenciesMs;
  }
  delete report.latenciesMs;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    path.join(OUT_DIR, "EMPIREAI_TRUST_QUALIFICATION_EVIDENCE.json"),
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    path.join(OUT_DIR, "EMPIREAI_TRUST_QUALIFICATION_REPORT.md"),
    `# EmpireAI Trust Qualification

**Result:** ${report.result}  
**Attempts / Successes / Failures:** ${report.attempts} / ${report.successes} / ${report.failures}  
**Deploy SHA:** ${report.deploySha}  
**Deployment ID:** ${report.deploymentId}  
**Completed:** ${report.completedAt}

## Perfect-run rule

PASS only when attempts=1000, successes=1000, failures=0.

## Distribution

${Object.entries(report.byClass)
  .map(([k, v]) => `- ${k}: planned=${v.planned} ok=${v.successes} fail=${v.failures}`)
  .join("\n")}

## Latency

p50=${report.latency?.p50Ms}ms p95=${report.latency?.p95Ms}ms p99=${report.latency?.p99Ms}ms worst=${report.latency?.worstMs}ms

## First failure

${report.firstFailure ? JSON.stringify(report.firstFailure, null, 2) : "none"}

## Birth integrity

BIRTH_AUTHORISED=NO  
BIRTH_TIMESTAMP=NULL  
`,
  );
}

main().catch((e) => {
  console.error(String(e?.stack || e));
  process.exit(2);
});
