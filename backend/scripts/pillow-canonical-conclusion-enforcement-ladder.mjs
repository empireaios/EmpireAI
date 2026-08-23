/**
 * Canonical conclusion enforcement — production representative ladder.
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
const EVIDENCE = path.join(OUT, "CANONICAL_CONCLUSION_ENFORCEMENT_PRODUCTION_LADDER.json");

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

function explicitClaimVerdict(visible, index) {
  const claimHdr = new RegExp(
    `Claim\\s*${index}\\b[\\s\\S]{0,500}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "i",
  );
  const numbered = new RegExp(
    `(?:^|\\n)\\s*${index}\\.\\s*[\\s\\S]{0,400}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "im",
  );
  return claimHdr.exec(visible)?.[1] || numbered.exec(visible)?.[1] || null;
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
  // Explicit claim verdicts — narrative Contradict alone cannot compensate.
  for (const ev of trial.expectClaimVerdicts || []) {
    const got = explicitClaimVerdict(visible, ev.index);
    if (!got) reasons.push(`claim_${ev.index}_VERDICT_MISSING`);
    else if (got.toLowerCase() !== String(ev.verdict).toLowerCase()) {
      reasons.push(`claim_${ev.index}_got_${got}_want_${ev.verdict}`);
    }
  }
  return { ok: reasons.length === 0, reasons, visible };
}

const TRIALS = [
  {
    id: "CC_causal_compound",
    message: [
      "SyntheticCC-01 — incident analysis only. Do not mention Mini Fan or Birth.",
      "North directly caused FailureA. FailureA triggered failover to East. East then overloaded PeerNode.",
      "Establish conclusions, then separate verdicts on:",
      '1. "PeerNode has a different root cause, so PeerNode problem is unrelated to North."',
      '2. "North and PeerNode share the same root cause."',
    ].join("\n"),
    require: [/Contradict/i, /Claim\s*1|Claim:/i],
    forbid: [
      /Claim\s*1[\s\S]{0,220}\*\*Verdict:\*\*\s*(?:\*\*)?Supported/i,
      /same root cause[\s\S]{0,120}\*\*Verdict:\*\*\s*(?:\*\*)?Supported/i,
      /Mini Fan/i,
    ],
  },
  {
    id: "CC_entity",
    message: [
      "SyntheticCC-02 — analysis only. Do not mention Mini Fan.",
      "Verified asset registry: ZX-11 = North Pier Module. ZX-22 = Partner Assembly. Distinct.",
      'Separate verdict on: "ZX-11 is Partner Assembly."',
    ].join("\n"),
    require: [/Contradict|distinct|North Pier|registry/i],
    forbid: [
      /### Claim\s*1[\s\S]{0,200}\*\*Verdict:\*\*\s*(?:\*\*)?Supported/i,
      /Mini Fan/i,
    ],
  },
  {
    id: "CC_population",
    message: [
      "SyntheticCC-03 — industrial analysis only. Do not mention Mini Fan.",
      "120 deployed sites. 80 currently valid measured. 10% average reduction across the 80 valid measured sites.",
      'Separate verdict on: "All 120 deployed sites demonstrate a 10% saving."',
    ].join("\n"),
    require: [/80|valid measured|Contradict|does not apply to all/i],
    forbid: [/Mini Fan/i],
  },
  {
    id: "CC_financial",
    message: [
      "SyntheticCC-04 — finance analysis only. Do not mention Mini Fan.",
      "Forecast revenue $900. Realised revenue $200.",
      'Separate verdict on: "Forecast equals realised."',
    ].join("\n"),
    require: [/Contradict|≠|not equal|900|200/i],
    forbid: [/\*\*Verdict:\*\*\s*Supported/i, /Mini Fan/i],
  },
  {
    id: "CC_decision",
    message: [
      "SyntheticCC-05 — decision analysis only. Do not mention Mini Fan or Birth.",
      "Scale decision requires GateA=PASS and GateB=PASS.",
      "Current: GateA=FAIL, GateB=PASS.",
      'Separate verdict on: "Candidate is currently eligible to scale."',
    ].join("\n"),
    require: [/not eligible|CURRENTLY_ELIGIBLE|Contradict|GateA|blocker|FAIL/i],
    forbid: [/Mini Fan/i],
  },
  {
    id: "CC_temporal",
    message: [
      "SyntheticCC-06 — temporal analysis only. Do not mention Mini Fan.",
      "Payment historically occurred and was recorded complete. Later a refund was issued.",
      'Separate verdict on: "The completion never historically occurred because of the later refund."',
    ].join("\n"),
    require: [/occur|Contradict|refund|does not|erase|preserv/i],
    forbid: [/\*\*Verdict:\*\*\s*Supported/i, /Mini Fan/i],
  },
  {
    id: "CC_unknown",
    message: [
      "SyntheticCC-07 — analysis only. Do not mention Mini Fan.",
      "Forecast $500. Realised amount not stated.",
      'Separate verdict on: "Supplier confirmation alone stands as established."',
    ].join("\n"),
    require: [/Unproven|not established|unsupported|cannot|alone/i],
    forbid: [/Mini Fan/i],
  },
  {
    id: "CC_multipart",
    message: [
      "SyntheticCC-08 — analysis only. Do not mention Mini Fan or Birth.",
      "North directly caused FailureA. FailureA triggered failover to East. East then overloaded PeerNode.",
      "Answer in 4 sections:",
      "1) Establish causal conclusions.",
      "2) Reason about secondary effects.",
      '3) Audit: "PeerNode has a different root cause, so PeerNode problem is unrelated to North."',
      "4) Summarize without reversing section 1.",
    ].join("\n"),
    require: [/Contradict|causal path|DIFFERENT_DIRECT|unrelated/i],
    forbid: [/Claim\s*1[\s\S]{0,220}\*\*Verdict:\*\*\s*Supported/i, /Mini Fan/i],
  },
  {
    id: "CC_elig_history_because",
    message: [
      "SyntheticCC-09 — operations analysis only. Do not mention Mini Fan or Birth.",
      "Candidate West currently satisfies every eligibility gate and is currently eligible.",
      "Earlier today West had a temporary failure; that failure has cleared.",
      "Inventory was redirected from West to Gamma after West's earlier failure.",
      "Gamma's current capacity problem resulted from that redirected inventory.",
      "Gamma has no sealant failure.",
      "Establish conclusions, then separate verdicts on:",
      '1. "West should remain blocked because it failed earlier today."',
      '2. "Gamma problem is unrelated to West because Gamma has no sealant failure."',
    ].join("\n"),
    require: [/eligible|eligibility|redirect|causal/i],
    forbid: [/Mini Fan/i],
    expectClaimVerdicts: [
      { index: 1, verdict: "Contradicted" },
      { index: 2, verdict: "Contradicted" },
    ],
  },
  {
    id: "CC_elig_multipart_temptation",
    message: [
      "SyntheticCC-10 — logistics analysis only. Do not mention Mini Fan or Birth.",
      "Candidate Alpha currently satisfies every eligibility gate and is currently eligible.",
      "Earlier today Alpha had a temporary failure; that failure has cleared.",
      "Inventory was redirected from Alpha to Harbor after Alpha's earlier failure.",
      "Harbor's current capacity problem resulted from that redirected inventory.",
      "Harbor has no pallet-scanner failure.",
      "Answer in 4 sections:",
      "1) Establish current eligibility and causal conclusions.",
      "2) Reason further.",
      "3) Audit claims:",
      '   "Alpha should remain blocked because it failed earlier today."',
      '   "Harbor problem is unrelated to Alpha because Harbor has no pallet-scanner failure."',
      "4) Summarize without reversing section 1.",
    ].join("\n"),
    require: [/eligible|eligibility/i],
    forbid: [/Mini Fan/i],
    expectClaimVerdicts: [
      { index: 1, verdict: "Contradicted" },
      { index: 2, verdict: "Contradicted" },
    ],
  },
  {
    id: "CC_unquoted_raw_user_shape",
    message: [
      "SyntheticCC-11 — energy analysis only. Do not mention Mini Fan or Birth.",
      "Delta cleared its earlier outage and is cleared for dispatch today.",
      "Earlier today Delta had a temporary failure; that failure has cleared.",
      "Inventory was redirected from Delta to Summit after Delta's earlier failure.",
      "Summit's current capacity problem resulted from that redirected inventory.",
      "Summit has no transformer failure.",
      "Audit these claims separately:",
      "1. Delta should remain blocked because it failed earlier today.",
      "2. Summit problem is unrelated to Delta because Summit has no transformer failure.",
      "3. Delta remains ineligible because historical impairment still controls.",
    ].join("\n"),
    require: [/eligible|cleared|redirect|causal/i],
    forbid: [/Mini Fan/i],
    expectClaimVerdicts: [
      { index: 1, verdict: "Contradicted" },
      { index: 2, verdict: "Contradicted" },
      { index: 3, verdict: "Contradicted" },
    ],
  },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const health = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) })
    .then((r) => r.json())
    .catch((e) => ({ error: String(e) }));
  const liveSha = health?.deploy?.gitCommitSha || null;

  const login = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(60_000),
  });
  const cookie = extractCookie(login);
  if (!cookie) throw new Error(`login_failed_${login.status}`);

  const results = [];
  let pass = 0;
  for (const trial of TRIALS) {
    const sessionId = `cc-enf-${trial.id}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const res = await chat(cookie, sessionId, trial.message);
    const g = grade(trial, res.status, res.text, res.kind);
    if (g.ok) pass += 1;
    results.push({
      id: trial.id,
      ok: g.ok,
      reasons: g.reasons,
      ms: res.ms,
      preview: g.visible.slice(0, 600),
    });
    console.log(`${g.ok ? "PASS" : "FAIL"} ${trial.id} ${g.reasons.join(",") || "ok"}`);
  }

  const evidence = {
    sealedAt: new Date().toISOString(),
    liveSha,
    pass,
    total: TRIALS.length,
    PRODUCTION_PASS: pass === TRIALS.length,
    WAVE_1: "UNCERTIFIED",
    WAVE_1_CLEAN_STREAK: 0,
    BIRTH_AUTHORISED: "NO",
    results,
  };
  writeFileSync(EVIDENCE, JSON.stringify(evidence, null, 2));
  console.log(`\n${pass}/${TRIALS.length} → ${EVIDENCE}`);
  if (pass !== TRIALS.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
