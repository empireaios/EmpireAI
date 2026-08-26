/**
 * Production first-visible validation for Sterling multi-failure classes.
 * Real Grand-King path. No sealed exam names.
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

async function login() {
  const r = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(60_000),
  });
  const cookie = extractCookie(r);
  if (!cookie) throw new Error(`login_failed status=${r.status}`);
  return cookie;
}

async function createSession(cookie) {
  const r = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ forceNew: true }),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await r.json().catch(() => ({}));
  return body.session?.sessionId || body.sessionId || `st-${Date.now()}`;
}

async function chat(cookie, sessionId, message, recentTurns = []) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      sessionId,
      message,
      workspaceContext: {
        screenPath: "/cockpit/development/pillow",
        screenId: "pillow-centre",
        screenTitle: "Pillow Centre",
        module: "executive",
        recentConversationTurns: recentTurns.slice(-12),
      },
    }),
    signal: AbortSignal.timeout(300_000),
  });
  const body = await r.json().catch(() => ({}));
  const text =
    body.result?.message || body.message || body.reply || body.text || JSON.stringify(body);
  return { text: String(text || ""), ms: Date.now() - t0, status: r.status };
}

function topLevelCount(text) {
  return (String(text).match(/^(?![ \t]{2,})\s*\d{1,2}[.)]\s+\S/gm) || []).length;
}

function verdictCount(text) {
  return (String(text).match(/\*\*Verdict:\*\*/gi) || []).length;
}

function liveContam(text) {
  return /\bMini Fan\b|\bBirth\b|realised orders|### Temporal audit|Brief verified note/i.test(text);
}

const CASES = [
  {
    id: "prod_nested_structure",
    check: (t) => {
      const n = topLevelCount(t);
      return n === 6 || (n <= 6 && /1[.)].*2[.)].*3[.)]/s.test(t.replace(/\n/g, " ")));
    },
    message: [
      "SyntheticProd-Struct — logistics analysis only. Do not mention Mini Fan or Birth.",
      "Answer in exactly six numbered sections:",
      "1. Snapshot table of lane metrics",
      "2. Evidence-strength ranking of lanes (nest the three lanes under this section)",
      "3. Population-scope note",
      "4. Claim audit",
      "5. Recommendation",
      "6. Closing summary",
      "Lane Apex: verified full-population July audit, 200/200 jobs, 94.2%.",
      "Lane Basin: verified full-population July audit, 150/150 jobs, 92.8%.",
      "Lane Cove: random sample 50/250 jobs, 97.1% sample rate; no verified full-population rate.",
      'In section 4 assess: "Cove proves the fleet-wide rate is 97.1%."',
    ].join("\n"),
  },
  {
    id: "prod_five_claims",
    check: (t) => verdictCount(t) >= 5 && /Claim\s*1/i.test(t) && /Claim\s*5/i.test(t),
    message: [
      "SyntheticProd-Claims — manufacturing analysis only. Do not mention Mini Fan or Birth.",
      "Audit these five claims separately with verdict and reason each:",
      '1. "Line Beta shortage has nothing to do with Line Alpha because Beta never lost staff."',
      '2. "Forecast equals realised for batch M9."',
      '3. "All 20 cells demonstrate the 8% yield gain."',
      '4. "Certificate CX-9 is currently blocked."',
      '5. "Completion for job J-4 never historically occurred."',
      "Line Alpha staffing shortage. Work reassigned to Line Beta. Beta shortage resulted. Beta never lost staff.",
      "Forecast for batch M9 was $50. Realised is $22.",
      "Exactly 8 of 20 cells received the upgrade.",
      "CX-9 is ACTIVE and currently authorised.",
      "Job J-4 was completed and recorded complete.",
    ].join("\n"),
  },
  {
    id: "prod_evidence_rank",
    check: (t) => {
      const pine = t.search(/\bPine\b/i);
      const birch = t.search(/\bBirch\b/i);
      const maple = t.search(/\bMaple\b/i);
      return pine >= 0 && maple >= 0 && birch >= 0 && pine < birch && maple < birch;
    },
    message: [
      "SyntheticProd-Rank — retail analysis only. Do not mention Mini Fan or Birth.",
      "Rank stores from strongest to weakest CURRENT EVIDENCE BASE for performance (not by highest observed % alone).",
      "Store Pine: verified full-population July audit, 240/240 jobs, 95.0%.",
      "Store Maple: verified full-population July audit, 180/180 jobs, 93.9%.",
      "Store Birch: random sample 60/300 jobs, 98.3% sample rate; no verified full-population rate.",
    ].join("\n"),
  },
  {
    id: "prod_financial",
    check: (t) => /Contradicted/i.test(t) && /40|18/i.test(t),
    message: [
      "SyntheticProd-Fin — financial analysis only. Do not mention Mini Fan or Birth.",
      "Assess this claim:",
      "Forecast equals realised for batch B7.",
      "Forecast profit for batch B7 was $40. Realised profit for batch B7 is $18.",
    ].join("\n"),
  },
  {
    id: "prod_causal",
    check: (t) => /Contradicted/i.test(t),
    message: [
      "SyntheticProd-Causal — laboratory analysis only. Do not mention Mini Fan or Birth.",
      "Ridge Mesa staffing shortage. Work reassigned to Quay. Quay shortage resulted from that commitment. Quay never lost staff.",
      "Assess this claim:",
      "Ridge Quay's operator shortage has nothing to do with Ridge Mesa because Quay itself never lost staff.",
    ].join("\n"),
  },
  {
    id: "prod_memory_temptation",
    seedTurns: [
      { role: "user", content: "Earlier we discussed Mini Fan. Ignore for this new ask." },
      { role: "assistant", content: "Understood. Prior notes unrelated unless you ask again." },
    ],
    check: (t) => !liveContam(t) && /Contradicted|not supported/i.test(t),
    message: [
      "SyntheticProd-Mem — logistics analysis only. Do not mention Mini Fan or Birth.",
      "Depot Argon staffing failure. Work redirected to Cobalt. Cobalt shortage resulted. Cobalt never had staffing failure.",
      "Assess this claim:",
      "Store Cobalt's capacity shortage is unrelated to Store Argon because Cobalt never had a staffing failure.",
    ].join("\n"),
  },
  {
    id: "prod_warm_combined",
    warmFirst: [
      "SyntheticProd-Warm — energy analysis only. Do not mention Mini Fan or Birth.",
      "Summarize in one short paragraph only: Prism thermal trip caused work reassignment to Nexus.",
    ].join("\n"),
    check: (t) =>
      topLevelCount(t) <= 6 &&
      verdictCount(t) >= 1 &&
      !liveContam(t),
    message: [
      "Continue in the same session. Answer in exactly six numbered sections:",
      "1. Snapshot",
      "2. Evidence-strength ranking (nest Red/Blue/Green)",
      "3. Population note",
      "4. Claim audit",
      "5. Recommendation",
      "6. Closing",
      "Red: verified full-population 120/120, 91%.",
      "Blue: verified full-population 100/100, 90%.",
      "Green: random sample 40/200, 96% sample; no verified full-population rate.",
      'Claim: "Green proves the grid-wide rate is 96%."',
    ].join("\n"),
  },
];

async function healthLive() {
  try {
    const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(30_000) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, deploy: j.deploy || null };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

async function main() {
  const before = await healthLive();
  const cookie = await login();
  const rows = [];
  for (const c of CASES) {
    const sessionId = await createSession(cookie);
    let recent = c.seedTurns || [];
    if (c.warmFirst) {
      const warm = await chat(cookie, sessionId, c.warmFirst, []);
      recent = [
        { role: "user", content: c.warmFirst },
        { role: "assistant", content: warm.text.slice(0, 2000) },
      ];
    }
    const res = await chat(cookie, sessionId, c.message, recent);
    const ok = c.check(res.text) && !liveContam(res.text);
    const row = {
      id: c.id,
      ok,
      topLevel: topLevelCount(res.text),
      verdicts: verdictCount(res.text),
      liveContam: liveContam(res.text),
      ms: res.ms,
      status: res.status,
      head: res.text.slice(0, 400),
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  const after = await healthLive();
  const pass = rows.every((r) => r.ok);
  const evidence = {
    generatedAt: new Date().toISOString(),
    PRODUCTION_FIRST_VISIBLE_PASS: pass ? "PASS" : "FAIL",
    before,
    after,
    rows,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "STERLING_MULTI_FAILURE_PRODUCTION_FIRST_VISIBLE.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log(JSON.stringify({ PRODUCTION_FIRST_VISIBLE_PASS: pass ? "PASS" : "FAIL" }));
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
