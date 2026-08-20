/**
 * Reasoning Core Simplification — production representative ladder.
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
const EVIDENCE = path.join(OUT, "REASONING_CORE_SIMPLIFICATION_PRODUCTION_LADDER.json");

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
    id: "L0_entity",
    message: [
      "SyntheticRCS-L0E — analysis only. Do not mention Mini Fan or Birth.",
      "Verified asset registry: ZX-11 = North Pier Module. QR-42 = Partner Assembly; they are distinct.",
      `Provide a separate verdict on each quoted claim:`,
      `1. "ZX-11 is definitely Partner Assembly."`,
      `2. "ZX-11 is North Pier Module."`,
    ].join("\n"),
    require: [/Claim\s*1|ZX-11/i, /North Pier|Contradict|distinct|False|unproven|Supported/i],
    forbid: [/Mini Fan/i],
  },
  {
    id: "L0_population",
    message: [
      "SyntheticRCS-L0P — industrial analysis only. Do not mention Mini Fan.",
      "120 deployed sites. 80 currently valid measured. 10% average reduction across the 80 valid measured sites.",
      `Separate verdict on: "All 120 deployed sites demonstrate a 10% saving."`,
    ].join("\n"),
    require: [/80|valid measured|not all 120|Contradict|False|unproven|does not/i],
    forbid: [/Mini Fan/i, /sales-history/i],
  },
  {
    id: "L0_occurrence",
    message: [
      "SyntheticRCS-L0O — logistics analysis only.",
      "18 shipments physically completed and recorded complete. Later full refunds for SLA breach.",
      "1) Did shipments historically occur?",
      "2) What does the refund change?",
    ].join("\n"),
    require: [/occur|complet|histor/i, /refund|economic|outcome/i],
    forbid: [/should not be counted as historically/i],
  },
  {
    id: "L1_paired",
    message: [
      "SyntheticRCS-L1 — hospitality analysis only. Do not mention Birth.",
      "Registry: HT-77 = Cedar Transit Lodge. Harbour Crown = HC-11; distinct.",
      "Forecast $2800; realised $520. Stays completed; later refund after breach.",
      `Separate verdicts:`,
      `1. "HT-77 is Harbour Crown Hotel."`,
      `2. "Forecast equals realised."`,
      `3. "The stay never historically occurred because of a later refund."`,
    ].join("\n"),
    require: [/Claim\s*1|HT-77/i, /Claim\s*2|forecast/i, /Claim\s*3|occur/i],
    forbid: [/Mini Fan/i, /sales-history evidence/i],
  },
  {
    id: "L2_multi",
    message: [
      "SyntheticRCS-L2 — industrial analysis only.",
      "Verified registry: NV-55 = Ridge Thermal Pack. System Assembly = SA-11; distinct.",
      "Forecast $3600; realised $700. 110 deployed; 82 currently valid measured; 9% across the 82 valid measured sites.",
      "Units completed then refunded after quality failure.",
      `Separate verdicts:`,
      `1. "NV-55 is System Assembly."`,
      `2. "All 110 deployed sites demonstrate a 9% saving."`,
      `3. "Completion never historically occurred because of the refund."`,
    ].join("\n"),
    require: [/NV-55|Claim/i, /82|valid|110/i],
    forbid: [/Mini Fan/i],
  },
  {
    id: "L3_multipart",
    message: [
      "SyntheticRCS-L3 — analysis only. Answer in exactly 5 numbered sections. Do not mention Mini Fan or Birth.",
      "Pack: forecast $2400; realised $510; ZX-11=Summit Controller; HC-11=Harbour Assembly (distinct); completed then refunded.",
      "Cover: forecast vs realised; identity; occurrence; then claim audit of:",
      `1. "ZX-11 is Harbour Assembly."`,
      `2. "Forecast equals realised."`,
      "Then synthesis. Section headings are not claims.",
    ].join("\n"),
    require: [/forecast|realised/i, /Claim\s*1|ZX-11/i],
    forbid: [/Mini Fan/i, /sales-history/i],
  },
  {
    id: "L4_executive",
    message: [
      "SyntheticRCS-L4 — healthcare executive analysis only. Do not mention EmpireAI products, Birth, or Mini Fan.",
      "Verified registry: LM-08 = Valley Sensor Hub. Partner Unit = PU-02; distinct.",
      "Forecast visits 900; realised 210. Care episodes completed; later compensation after service issue.",
      "1) Forecast vs realised.",
      "2) Identity of LM-08.",
      "3) Separate verdicts:",
      `1. "LM-08 is Partner Unit."`,
      `2. "The care episode never historically occurred because of later compensation."`,
      "4) Executive synthesis.",
    ].join("\n"),
    require: [/forecast|visit|realised/i, /LM-08|identity|Valley/i],
    forbid: [/Mini Fan/i, /sales-history evidence beyond realised orders/i],
  },
  {
    id: "L4_control",
    message:
      'SyntheticRCS-CTRL — scenario-only. Is "Module KEEL will succeed commercially" established from the claim alone? Two sentences. Do not mention Mini Fan or Birth.',
    require: [/unproven|unsupported|not established|scenario|claim/i],
    forbid: [/Mini Fan/i],
  },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = {
    mission: "REASONING_CORE_SIMPLIFICATION",
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
      const sessionId = `rcs_${trial.id}_${Date.now()}`;
      console.log(`[RCS] ${trial.id}`);
      const c = await chat(cookie, sessionId, trial.message);
      const g = grade(trial, c.status, c.text, c.kind);
      if (g.ok) ok += 1;
      report.results.push({
        id: trial.id,
        ok: g.ok,
        reasons: g.reasons,
        ms: c.ms,
        kind: c.kind,
        preview: g.visible.slice(0, 240),
      });
      console.log(`  -> ${g.ok ? "PASS" : "FAIL"} ${c.ms}ms ${g.reasons.join("|") || "none"}`);
    }
    report.finishedAt = new Date().toISOString();
    report.pass = ok;
    report.fail = TRIALS.length - ok;
    report.level =
      report.fail === 0 ? "PASS" : "FAIL";
    writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ level: report.level, pass: ok, fail: report.fail, sha: report.brainSha }, null, 2));
    process.exit(report.fail === 0 ? 0 : 1);
  } catch (e) {
    report.error = String(e?.stack || e);
    report.level = "FAIL";
    writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    console.error(e);
    process.exit(1);
  }
}

main();
