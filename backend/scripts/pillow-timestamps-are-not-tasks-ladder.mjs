/**
 * TIMESTAMPS_ARE_NOT_TASKS — production representative ladder.
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
const EVIDENCE = path.join(OUT, "TIMESTAMPS_ARE_NOT_TASKS_PRODUCTION_LADDER.json");

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
    id: "TS_six_sections_many_stamps",
    maxSections: 10,
    message: [
      "SyntheticTS-01 — industrial plant analysis only. Do not mention Mini Fan or Birth.",
      "Answer in exactly 6 numbered sections:",
      "1) Timeline summary",
      "2) Causal chain",
      "3) Contradictions",
      "4) What is unknown",
      "5) Strongest supported conclusion",
      "6) Next verification",
      "08:00 Pump A pressure dropped.",
      "08:20 Backup loop engaged on NodeB.",
      "08:45 Vibration on NodeC.",
      "09:10 Secondary cooler tripped.",
      "09:40 Service restored.",
      "10:05 Post-incident note filed.",
    ].join("\n"),
    require: [/Timeline|Causal|unknown|verification/i],
    forbid: [/Mini Fan/i, /\bBirth\b/i, /realised orders/i],
  },
  {
    id: "TS_dates_and_money",
    maxSections: 8,
    message: [
      "SyntheticTS-02 — maritime logistics analysis only. Do not mention Mini Fan.",
      "Answer in exactly 4 numbered sections:",
      "1) Chronology",
      "2) Cost signals",
      "3) Unknowns",
      "4) Next check",
      "2026-03-12 08:00 Berth sensor dropped.",
      "2026-03-12 09:10 Pier overload.",
      "Item 1 cost $400. Item 2 cost $120.",
    ].join("\n"),
    require: [/Chronology|Cost|Unknown|check/i],
    forbid: [/Mini Fan/i, /realised revenue remain zero/i],
  },
  {
    id: "TS_table_and_correction",
    maxSections: 8,
    message: [
      "SyntheticTS-03 — laboratory process analysis only. Do not mention Mini Fan or Birth.",
      "Answer in exactly 5 numbered sections:",
      "1) Table reading",
      "2) Causal note",
      "3) Correction handling",
      "4) Supported conclusion",
      "5) Verification",
      "| Time | Reading |",
      "| 08:00 | 12 |",
      "| 08:20 | 40 |",
      "Later note: 09:55 correction — earlier 08:20 reading was sensor noise.",
    ].join("\n"),
    require: [/Table|Causal|Correction|Verification|conclusion/i],
    forbid: [/Mini Fan/i, /\bBirth\b/i],
  },
  {
    id: "TS_control_stamp_in_title",
    maxSections: 6,
    message: [
      "SyntheticTS-04 — civic infrastructure analysis only. Do not mention Mini Fan.",
      "Answer in exactly 3 numbered sections:",
      "1) Summary of the 08:00–09:40 window",
      "2) Causal reading",
      "3) Unknowns",
      "Evidence: 08:00 start; 08:20 transfer; 09:40 restore.",
    ].join("\n"),
    require: [/Summary|Causal|Unknown/i],
    forbid: [/Mini Fan/i],
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
