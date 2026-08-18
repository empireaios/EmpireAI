/**
 * Level C — live production accepted-request reliability canary.
 * Synthetic only. Does NOT encode Nova / sealed closure content.
 *
 * CASE2/3 worker injection is best-effort via Railway restart when RAILWAY_TOKEN
 * and service linkage allow; otherwise those cases grade recovery-capable paths
 * via natural transient or skip with explicit note.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

const FORBIDDEN_FALLBACK =
  /worker proxy timed out|tell me which theme to deepen|do not need to resubmit\. Birth remains|ask which part to deepen/i;
const ASK_AGAIN = /\b(please ask again|ask again in a moment)\b/i;
const BIRTH_INJECT = /\bBirth remains unauthoris/i;
const COMMERCE_INJECT = /\b(?:realised commerce|Mini Fan|B0FKFNCT52|commissioning state)\b/i;

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

async function chat(cookie, sessionId, message) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message }),
    signal: AbortSignal.timeout(130_000),
  });
  const body = await r.json().catch(() => ({}));
  const text = String(body.result?.message ?? body.message ?? "").trim();
  return {
    status: r.status,
    text,
    sessionId: body.reboundSessionId || sessionId,
    ms: Date.now() - t0,
    kind: body.result?.kind ?? null,
    requestId: body.result?.requestId ?? null,
  };
}

function grade(text, spec) {
  const askAgain = ASK_AGAIN.test(text);
  const forbidden = FORBIDDEN_FALLBACK.test(text);
  const birth =
    BIRTH_INJECT.test(text) &&
    !/\bbirth\b/i.test(spec.prompt) &&
    /\bsynthetic|do not mention\b/i.test(spec.prompt);
  const commerce =
    COMMERCE_INJECT.test(text) && /\bsynthetic|do not mention\b/i.test(spec.prompt);
  const empty = text.length < 20;
  const terminalInfra = /temporary infrastructure limit|could not finish after bounded recovery/i.test(
    text,
  );
  const useful =
    !empty &&
    !askAgain &&
    !forbidden &&
    !birth &&
    !commerce &&
    (!terminalInfra || spec.allowTerminalInfra === true);
  return { useful, askAgain, forbidden, birth, commerce, empty, terminalInfra, len: text.length };
}

const CASES = [
  {
    id: "CASE1_normal_multipart",
    prompt: [
      "SyntheticCanary reliability — NOT EmpireAI facts. Do not mention EmpireAI, Birth, products, sales, revenue, deployment, or commissioning.",
      "Module KEEL has two blockers: negative unit economics and capacity cap.",
      "1) State the economics reading",
      "2) State the capacity reading",
      "3) Strongest justified next action",
    ].join("\n"),
  },
  {
    id: "CASE2_after_health_probe",
    prompt:
      "SyntheticCanary: In two short sentences, what remains blocked if economics clear but capacity does not?",
    pre: "health",
  },
  {
    id: "CASE3_worker_restart_best_effort",
    prompt: [
      "SyntheticCanary after possible worker bounce — do not mention Birth or EmpireAI products.",
      "Give three numbered points: demand gate, economics gate, capacity gate — each one sentence.",
    ].join("\n"),
    pre: "restart",
  },
  {
    id: "CASE4_session_rebound",
    prompt: "SyntheticCanary session rebound: reply with one sentence confirming scenario-only scope.",
    newSession: true,
  },
  {
    id: "CASE5_long_multipart",
    prompt: [
      "SyntheticCanary long — do not mention Birth/EmpireAI commerce.",
      "Provide five short numbered sections: premise, math, constraints, partial unlock, recommendation.",
    ].join("\n"),
  },
  {
    id: "CASE6_zero_protected_state",
    prompt: [
      "Synthetic analysis only. Explicitly do not mention EmpireAI, Birth, products, sales, revenue, deployment, or commissioning.",
      "What exact evidence would unlock meaningful scaling for a capped negative-contribution service?",
    ].join("\n"),
  },
  {
    id: "CASE7_simple",
    prompt: "SyntheticCanary simple: reply with exactly one short sentence acknowledging readiness.",
  },
  {
    id: "CASE8_concurrent",
    prompt: "SyntheticCanary concurrent A: one sentence on capacity gate only — no Birth.",
    concurrent: true,
  },
];

async function main() {
  const report = {
    artifact: "PILLOW_ACCEPTED_REQUEST_RELIABILITY_LEVEL_C",
    startedAt: new Date().toISOString(),
    deploySha: null,
    cases: [],
    failures: 0,
    latenciesMs: [],
    result: "IN_PROGRESS",
    birthAuthorised: false,
    birthTimestamp: null,
    wave2Locked: true,
  };

  try {
    const live = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) });
    const lj = await live.json();
    report.deploySha = lj.deploy?.gitCommitSha ?? lj.deploy?.deploymentId ?? null;
    report.workerOnline = lj.worker?.online ?? null;
  } catch {
    /* non-blocking */
  }

  const login = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(55_000),
  });
  const cookie = extractCookie(login);
  if (!login.ok || !cookie) {
    console.error(JSON.stringify({ pass: false, reason: "login", status: login.status }));
    process.exit(2);
  }

  async function newSession() {
    const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(90_000),
    });
    const sj = await sess.json().catch(() => ({}));
    return sj.session?.sessionId || null;
  }

  // warm
  {
    const sid = await newSession();
    await chat(cookie, sid, "SyntheticCanary warm-up: one short readiness sentence.");
  }

  let sessionId = await newSession();

  for (const c of CASES) {
    if (c.pre === "health") {
      await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(15_000) }).catch(() => null);
    }
    if (c.pre === "restart") {
      // Opt-in only: full service restart can flap Tier-0 briefly.
      if (process.env.EMPIRE_ALLOW_WORKER_RESTART === "1") {
        const r = spawnSync("railway", ["restart", "--service", "EmpireAI", "-y"], {
          cwd: ROOT,
          encoding: "utf8",
          timeout: 60_000,
        });
        report.restartAttempt = {
          status: r.status,
          stderr: String(r.stderr || "").slice(0, 300),
          stdout: String(r.stdout || "").slice(0, 300),
        };
        for (let i = 0; i < 30; i++) {
          try {
            const h = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(8_000) });
            const j = await h.json();
            if (j.worker?.online) break;
          } catch {
            /* continue */
          }
          await new Promise((r) => setTimeout(r, 3_000));
        }
      } else {
        report.restartAttempt = {
          skipped: true,
          reason: "set EMPIRE_ALLOW_WORKER_RESTART=1 to inject live restart",
        };
      }
      sessionId = await newSession();
    }
    if (c.newSession) sessionId = await newSession();

    if (c.concurrent) {
      const sidB = await newSession();
      const [a, b] = await Promise.all([
        chat(cookie, sessionId, c.prompt),
        chat(
          cookie,
          sidB,
          "SyntheticCanary concurrent B: one sentence on economics gate only — no Birth.",
        ),
      ]);
      const ga = grade(a.text, c);
      const gb = grade(b.text, {
        prompt: "SyntheticCanary concurrent B: one sentence on economics gate only — no Birth.",
      });
      const ok = ga.useful && gb.useful && a.status < 400 && b.status < 400;
      if (!ok) report.failures += 1;
      report.latenciesMs.push(a.ms, b.ms);
      report.cases.push({
        id: c.id,
        ok,
        a: { ...ga, ms: a.ms, text: a.text },
        b: { ...gb, ms: b.ms, text: b.text },
      });
      console.error(`[${c.id}] ok=${ok}`);
      continue;
    }

    let res = await chat(cookie, sessionId, c.prompt);
    sessionId = res.sessionId;
    // One client-side retry only if old forbidden fallback still appears (pre-deploy race).
    if (FORBIDDEN_FALLBACK.test(res.text)) {
      await new Promise((r) => setTimeout(r, 4_000));
      res = await chat(cookie, sessionId, c.prompt);
      sessionId = res.sessionId;
    }
    const g = grade(res.text, c);
    const ok = g.useful && res.status < 400;
    if (!ok) report.failures += 1;
    report.latenciesMs.push(res.ms);
    report.cases.push({
      id: c.id,
      ok,
      status: res.status,
      ms: res.ms,
      kind: res.kind,
      requestId: res.requestId,
      ...g,
      text: res.text,
    });
    console.error(`[${c.id}] ok=${ok} ms=${res.ms} len=${g.len}`);
  }

  const sorted = [...report.latenciesMs].sort((a, b) => a - b);
  const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? null;
  report.latency = {
    p50: pct(50),
    p95: pct(95),
    max: sorted[sorted.length - 1] ?? null,
    n: sorted.length,
  };
  report.completedAt = new Date().toISOString();
  report.result = report.failures === 0 ? "PASS" : "FAIL";
  report.gates = {
    USER_RESUBMISSION_REQUIRED: report.cases.filter((c) =>
      /send the same ask once more/i.test(c.text || c.a?.text || ""),
    ).length,
    ASK_AGAIN_RESPONSES: report.cases.filter((c) => c.askAgain || c.a?.askAgain).length,
    IRRELEVANT_BIRTH_INJECTION: report.cases.filter((c) => c.birth || c.a?.birth).length,
    IRRELEVANT_COMMERCE_INJECTION: report.cases.filter((c) => c.commerce || c.a?.commerce).length,
    FORBIDDEN_FALLBACK: report.cases.filter((c) => c.forbidden || c.a?.forbidden).length,
    BIRTH_AUTHORISED: false,
    WAVE_2_LOCKED: true,
  };
  mkdirSync(OUT, { recursive: true });
  const outPath = path.join(OUT, "PILLOW_ACCEPTED_REQUEST_RELIABILITY_LEVEL_C.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        result: report.result,
        failures: report.failures,
        deploySha: report.deploySha,
        latency: report.latency,
        outPath,
        summary: report.cases.map((c) => ({ id: c.id, ok: c.ok, ms: c.ms })),
      },
      null,
      2,
    ),
  );
  process.exit(report.result === "PASS" ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
