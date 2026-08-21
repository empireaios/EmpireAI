/**
 * Causal state extension — production representative ladder.
 * Grand-King-visible surface. Fresh sessions. First request only.
 * No sealed Redwood. No Wave certification.
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
const EVIDENCE = path.join(OUT, "CAUSAL_STATE_EXTENSION_PRODUCTION_LADDER.json");

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
    id: "CX_healthy_ne_no_role",
    message: [
      "SyntheticCX-01 — incident analysis only. Do not mention Mini Fan or Birth.",
      "North directly caused FailureA. FailureA triggered failover to East. East then overloaded PeerNode.",
      "Entity South remained healthy throughout.",
      `Separate verdict on: "South played no causal role in the incident."`,
    ].join("\n"),
    require: [/healthy|observation|OBSERVED_UNAFFECTED|not (?:establish|prove)|causal role|without affirmative/i],
    forbid: [/Mini Fan/i, /\bSouth played no causal role\b(?![\s\S]{0,200}(?:not|≠|does not|cannot))/i],
  },
  {
    id: "CX_indirect_not_unrelated",
    message: [
      "SyntheticCX-02 — incident analysis only. Do not mention Mini Fan.",
      "Alpha directly caused FailureB. FailureB triggered failover to Gamma. Gamma then overloaded DeltaNode.",
      `Verdict: "Alpha and DeltaNode are unrelated because they have different direct causes."`,
    ].join("\n"),
    require: [/related|path|indirect|DIFFERENT_DIRECT|CAUSALLY_UNRELATED|connected|chain/i],
    forbid: [/Mini Fan/i],
  },
  {
    id: "CX_connected_ne_same_root",
    message: [
      "SyntheticCX-03 — analysis only.",
      "West directly caused FailureC. FailureC triggered failover to Ridge. Ridge then overloaded HarborNode.",
      `Is it true that West and HarborNode share the same root cause?`,
    ].join("\n"),
    require: [/not|≠|different|connected|chain|indirect|COMMON_ROOT|same root/i],
    forbid: [/Mini Fan/i],
  },
  {
    id: "CX_failover_risk_lesson",
    message: [
      "SyntheticCX-04 — executive incident closeout. Do not mention Birth.",
      "Primary fault on NodeA triggered failover to NodeB. Failover to NodeB then caused overload on NodeC.",
      "Service restored. What is the strongest supported follow-up risk lesson?",
    ].join("\n"),
    require: [/failover|overload|resource|mitigation|demonstrated|protect/i],
    forbid: [/Mini Fan/i, /^[\s\S]*continue monitoring\.?\s*$/i],
  },
  {
    id: "CX_affirmative_non_participation",
    message: [
      "SyntheticCX-05 — analysis only.",
      "North directly caused FailureA. ZoneQ was offline and not invoked.",
      `Verdict: "ZoneQ played no causal role."`,
    ].join("\n"),
    require: [/ZoneQ|no causal|non-participation|offline|not invoked|supported|affirm/i],
    forbid: [/Mini Fan/i],
  },
  {
    id: "CX_entity_control",
    message: [
      "SyntheticCX-CTRL — analysis only. Do not mention Mini Fan.",
      "Verified registry: ZX-11 = North Pier Module. QR-42 = Partner Assembly; distinct.",
      `Verdict: "ZX-11 is definitely Partner Assembly."`,
    ].join("\n"),
    require: [/False|Contradict|distinct|North Pier|not/i],
    forbid: [/Mini Fan/i],
  },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = {
    mission: "CAUSAL_STATE_EXTENSION",
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
      const sessionId = `cx_${trial.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      console.log(`[CX] ${trial.id}`);
      const c = await chat(cookie, sessionId, trial.message);
      const g = grade(trial, c.status, c.text, c.kind);
      if (g.ok) ok += 1;
      report.results.push({
        id: trial.id,
        ok: g.ok,
        reasons: g.reasons,
        ms: c.ms,
        kind: c.kind,
        preview: g.visible.slice(0, 500),
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
