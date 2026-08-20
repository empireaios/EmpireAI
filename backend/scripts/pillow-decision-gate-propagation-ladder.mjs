/**
 * Decision-gate propagation — production representative ladder.
 * Grand-King-visible surface. Fresh sessions. First request only.
 * No sealed exams. No Wave certification.
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
const EVIDENCE = path.join(OUT, "DECISION_GATE_PROPAGATION_PRODUCTION_LADDER.json");

const FORBIDDEN = [
  /sales-history evidence beyond realised orders/i,
  /\*\*Event-state reading:\*\*/i,
  /deliberation may still be catching up/i,
  /\bMini Fan\b/i,
];

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
    signal: AbortSignal.timeout(300_000),
  });
  const body = await r.json().catch(() => ({}));
  return {
    status: r.status,
    text: String(body.result?.message ?? body.message ?? "").trim(),
    kind: body.result?.kind ?? null,
    ms: Date.now() - t0,
  };
}

function grade(trial, status, text, kind) {
  const reasons = [];
  const visible = String(text || "");
  if (!(status >= 200 && status < 300)) reasons.push(`http_${status}`);
  if (kind === "terminal_infrastructure") reasons.push("terminal");
  if (visible.length < 60) reasons.push("too_short");
  for (const f of FORBIDDEN) if (f.test(visible)) reasons.push(`forbidden:${f}`);
  for (const r of trial.require || []) if (!r.test(visible)) reasons.push(`missing:${r}`);
  for (const f of trial.forbid || []) if (f.test(visible)) reasons.push(`forbid:${f}`);
  return { ok: reasons.length === 0, reasons, visible };
}

const TRIALS = [
  {
    id: "DG_perf_spend_change",
    message: [
      "SyntheticDG-01 — operations analysis only. Do not mention Mini Fan or Birth.",
      "Candidate B requires: performance >= 90% threshold; expenditure <= approved ceiling $12000.",
      "Both gates currently fail.",
      "What new evidence could CHANGE the recommendation toward Candidate B?",
    ].join("\n"),
    require: [
      /expenditure|ceiling|budget/i,
      /performance/i,
      /remain|both|blocker|CLEARING ONE|not (?:enough|yet)|alone|still/i,
    ],
    forbid: [/Mini Fan/i, /HT-77|Harbour Crown|ZX-11/i],
  },
  {
    id: "DG_auth_budget_ops_reverse",
    message: [
      "SyntheticDG-02 — analysis only. Do not mention Mini Fan.",
      "Candidate C requires: safety authorization; budget compatibility; sufficient operating evidence.",
      "Authorization missing; budget compatibility fails; operating evidence insufficient.",
      "What would make you reverse toward Candidate C?",
    ].join("\n"),
    require: [/authori|safety/i, /budget|cash|expenditure/i, /evidence|operating/i],
    forbid: [/Mini Fan/i, /HT-77|Harbour Crown/i],
  },
  {
    id: "DG_one_clear_not_unlock",
    message: [
      "SyntheticDG-03 — commerce analysis only. Do not mention Mini Fan or Birth.",
      "Module has negative unit economics and capacity limited to 100 transactions/week.",
      "Owner evidence: contribution is now positive after verified repair.",
      "Does this unlock meaningful scaling? State remaining gates.",
    ].join("\n"),
    require: [/capacity/i, /remain|gate|not (?:yet )?unlock|partial|still/i],
    forbid: [/fully unlocked|scale freely|all gates clear/i, /HT-77|Harbour Crown|ZX-11|Cedar Transit/i],
  },
  {
    id: "DG_eligible_ne_best",
    message: [
      "SyntheticDG-04 — strategy analysis only. Do not mention Birth.",
      "Candidate A: performance now meets the threshold; expenditure now within the approved ceiling.",
      "Even if eligible, comparative evidence does not justify Candidate A as best.",
      "Is Candidate A currently eligible? Should it be preferred?",
    ].join("\n"),
    require: [/eligib/i, /prefer|compar|not (?:automatically )?best|ELIGIBLE/i],
    forbid: [/Mini Fan/i, /HT-77|Harbour Crown/i],
  },
  {
    id: "DG_next_valuable_vs_decision",
    message: [
      "SyntheticDG-05 — industrial analysis only. Do not mention Mini Fan.",
      "Candidate B requires: performance >= threshold; expenditure <= approved ceiling. Both currently fail.",
      "What is the single most valuable next evidence? Distinguish uncertainty reduction vs decision-state change.",
    ].join("\n"),
    require: [/performance/i, /expenditure|ceiling/i, /remain|gate|not (?:yet )?change|decision|blocker/i],
    forbid: [/Mini Fan/i, /HT-77|Harbour Crown/i],
  },
  {
    id: "DG_rcs_entity_control",
    message: [
      "SyntheticDG-CTRL — analysis only. Do not mention Mini Fan or Birth.",
      "Verified asset registry: ZX-11 = North Pier Module. QR-42 = Partner Assembly; they are distinct.",
      `Provide a separate verdict on: "ZX-11 is definitely Partner Assembly."`,
    ].join("\n"),
    require: [/Contradict|False|distinct|not|North Pier|ZX-11/i],
    forbid: [/Mini Fan/i],
  },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = {
    mission: "DECISION_GATE_PROPAGATION",
    startedAt: new Date().toISOString(),
    brainSha: null,
    frontendSha: null,
    results: [],
    WAVE_1: "UNCERTIFIED",
    WAVE_1_CLEAN_STREAK: 0,
    BIRTH_AUTHORISED: "NO",
  };
  try {
    const health = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(30_000) }).then(
      (r) => r.json(),
    );
    report.brainSha = health.deploy?.gitCommitSha || null;
    try {
      report.frontendSha = (
        await fetch(`${COCKPIT}/api/eos-bundle-stamp`, { signal: AbortSignal.timeout(20_000) }).then(
          (r) => r.json(),
        )
      ).gitCommitSha;
    } catch {
      report.frontendSha = null;
    }
    const loginRes = await fetch(`${COCKPIT}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      signal: AbortSignal.timeout(60_000),
    });
    const cookie = extractCookie(loginRes);
    if (!cookie) throw new Error(`login_${loginRes.status}`);

    let ok = 0;
    for (const trial of TRIALS) {
      const sessionId = `dg_${trial.id}_${Date.now()}`;
      console.log(`[DG] ${trial.id}`);
      const c = await chat(cookie, sessionId, trial.message);
      const g = grade(trial, c.status, c.text, c.kind);
      if (g.ok) ok += 1;
      report.results.push({
        id: trial.id,
        ok: g.ok,
        reasons: g.reasons,
        ms: c.ms,
        kind: c.kind,
        preview: g.visible.slice(0, 600),
        full: g.visible,
      });
      console.log(`  -> ${g.ok ? "PASS" : "FAIL"} ${c.ms}ms ${g.reasons.join("|") || "none"}`);
    }
    report.finishedAt = new Date().toISOString();
    report.pass = ok;
    report.total = TRIALS.length;
    report.PRODUCTION_PASS = ok === TRIALS.length;
    writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ pass: ok, total: TRIALS.length, sha: report.brainSha }, null, 2));
    process.exit(ok === TRIALS.length ? 0 : 1);
  } catch (e) {
    report.error = String(e?.stack || e);
    writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    console.error(report.error);
    process.exit(1);
  }
}

main();
