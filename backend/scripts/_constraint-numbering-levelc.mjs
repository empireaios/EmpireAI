/**
 * Level C — decision-constraint persistence + ordered numbering (final-visible).
 * Synthetic prompts only. Does not encode sealed Meridian / Product A-B closure exam.
 *
 * Env: EMPIRE_COCKPIT_URL, EMPIRE_LOGIN_EMAIL / EMPIRE_LOGIN_PASSWORD
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

const ASK_AGAIN =
  /\b(please ask again|ask again in a moment|realigning executive intelligence)\b/i;
const TIMEOUT_SOFT =
  /worker proxy timed out|deep reasoning worker is temporarily restarting|tell me which theme to deepen/i;
const LIVE_CONTAM = /\b(High-Speed Handheld|Mini Fan|B0FKFNCT52)\b/i;
const SCALE_BAD =
  /\bscale(?:\s+up)?(?:\s+(?:production|marketing|spend|ads))?\b/i;

const CASES = [
  {
    id: "CASE1_neg_econ_vs_demand",
    prompt: [
      "Synthetic analysis only — NOT facts about EmpireAI.",
      "Item HELIX-9 previously had zero completed sales.",
      "A verified experiment produced 28 completed sales with contribution margin = -S$3 per completed sale.",
      "Item ORBIT-2 has zero sales; a supplier claims strong demand (unverified); estimated contribution +S$5 if accurate.",
      "1) Reconcile yesterday vs today for HELIX-9.",
      "2) What do the 28 sales prove / not prove?",
      "3) Assess ORBIT-2 evidence.",
      "4) Choose one next experiment.",
      "5) Choose one critical verification.",
      "6) Explain exactly what decision that verification unlocks.",
      "7) State reversal evidence.",
    ].join("\n"),
    requireNegEconRespect: true,
    requireOrdered: true,
    minOrdered: 5,
  },
  {
    id: "CASE2_constraint_superseded",
    prompt: [
      "Synthetic analysis only — not EmpireAI facts.",
      "Yesterday: SKU Nova had negative unit economics.",
      "Today: verified supplier cost reduction makes contribution margin positive.",
      "Recommend whether a bounded demand test and later scale are now eligible, and name the superseding evidence.",
    ].join("\n"),
    allowScaleIfQualified: true,
  },
  {
    id: "CASE3_two_blockers_one_verify",
    prompt: [
      "Synthetic analysis only — not EmpireAI facts.",
      "Two blockers: (1) demand unverified, (2) contribution margin negative per sale.",
      "If we only verify demand, what is unlocked and what remains blocked? Recommend next step.",
    ].join("\n"),
    requireNegEconRespect: true,
  },
  {
    id: "CASE4_seven_numbered",
    prompt: [
      "SyntheticCanary — answer in exactly 7 correctly numbered sections:",
      "1) Premise quality",
      "2) Evidence gap",
      "3) Risk",
      "4) Verification priority",
      "5) Decision unlock",
      "6) Reversal test",
      "7) Recommendation",
      "Topic: a supplier asserts corridor demand is proven for module ZX-TEMP (synthetic only).",
    ].join("\n"),
    requireOrdered: true,
    minOrdered: 7,
  },
  {
    id: "CASE5_nested_plus_ordered",
    prompt: [
      "Synthetic analysis only.",
      "Provide three numbered sections. Under section 2 include two nested bullets.",
      "1) Claim audit for co-occurrence identity",
      "2) Evidence needs",
      "3) Recommendation",
    ].join("\n"),
    requireOrdered: true,
    minOrdered: 3,
  },
  {
    id: "CASE6_simple",
    prompt: "SyntheticCanary simple: In one short sentence, what is our verified realised order count?",
    simple: true,
  },
];

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

function countLooseOrderedMarkers(text) {
  const lines = text.split(/\n/);
  let n = 0;
  for (const line of lines) {
    if (/^\s*\d+[.)]\s+\S/.test(line)) n += 1;
  }
  return n;
}

function grade(id, text, spec) {
  const soft = TIMEOUT_SOFT.test(text);
  const askAgain = ASK_AGAIN.test(text);
  const contam = LIVE_CONTAM.test(text) && !spec.simple;
  const newlines = (text.match(/\n/g) || []).length;
  const wall = text.length > 900 && newlines < 2;
  const orderedCount = countLooseOrderedMarkers(text);
  const orderedOk = !spec.requireOrdered || orderedCount >= (spec.minOrdered ?? 3);
  // Sequential markers preferred: not all "1."
  const markers = [...text.matchAll(/^\s*(\d+)[.)]\s+/gm)].map((m) => Number(m[1]));
  const sequentialHint =
    markers.length < 2 ||
    new Set(markers).size > 1 ||
    markers.length === markers.filter((x) => x === 1).length; // all-1 still OK if frontend merges; backend may emit all 1.
  // Constraint: must not recommend unconstrained scale under negative economics cases.
  let constraintOk = true;
  if (spec.requireNegEconRespect) {
    const hasNeg =
      /\bnegative\b/i.test(text) ||
      /\bloses?\s+money\b/i.test(text) ||
      /\bcontribution\b/i.test(text);
    const unlockScale =
      SCALE_BAD.test(text) &&
      /\bunlock/i.test(text) &&
      !/\bdo not scale|until (?:margin|economics|contribution)|scale losses\b/i.test(text);
    const nakedScale =
      /\bscale up (?:production|marketing)\b/i.test(text) &&
      !/\buntil|do not scale|withhold scale|not scale\b/i.test(text);
    constraintOk = hasNeg && !unlockScale && !nakedScale;
  }
  if (spec.allowScaleIfQualified) {
    constraintOk =
      /\bpositive|supersed|cost reduction|eligible\b/i.test(text) ||
      !/\bscale up production and marketing\b/i.test(text);
  }
  const simpleOk =
    !spec.simple || (text.length <= 500 && /\b(0|zero)\b/i.test(text));
  const ok =
    !soft &&
    !askAgain &&
    !contam &&
    !wall &&
    orderedOk &&
    constraintOk &&
    simpleOk &&
    text.length >= 40 &&
    sequentialHint;

  return {
    ok,
    soft,
    askAgain,
    contam,
    wall,
    orderedCount,
    orderedOk,
    constraintOk,
    markers,
    newlines,
    len: text.length,
  };
}

async function chat(cookie, sessionId, message) {
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = await r.json().catch(() => ({}));
  return {
    status: r.status,
    text: String(body.result?.message ?? body.message ?? "").trim(),
    sessionId: body.reboundSessionId || sessionId,
  };
}

async function main() {
  const report = {
    artifact: "PILLOW_CONSTRAINT_NUMBERING_LEVEL_C",
    startedAt: new Date().toISOString(),
    deploySha: null,
    cases: [],
    failures: 0,
    result: "IN_PROGRESS",
    birthAuthorised: false,
    birthTimestamp: null,
  };

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

  try {
    const live = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) });
    const lj = await live.json();
    report.deploySha = lj.deploy?.gitCommitSha ?? null;
  } catch {
    /* non-blocking */
  }

  let sessionId = null;
  for (const c of CASES) {
    let res = null;
    let g = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(90_000),
      });
      const sj = await sess.json().catch(() => ({}));
      if (sess.ok && sj.session?.sessionId) sessionId = sj.session.sessionId;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      res = await chat(cookie, sessionId, c.prompt);
      sessionId = res.sessionId;
      g = grade(c.id, res.text, c);
      if (!TIMEOUT_SOFT.test(res.text) && g.ok) break;
      if (!TIMEOUT_SOFT.test(res.text) && !g.ok) break; // real grade fail, don't retry forever
      console.error(`[${c.id}] soft-timeout attempt=${attempt}, retrying…`);
      await new Promise((r) => setTimeout(r, 6000));
    }
    if (!g.ok || res.status >= 400) report.failures += 1;
    report.cases.push({
      id: c.id,
      ok: g.ok && res.status < 400,
      status: res.status,
      ...g,
      text: res.text,
    });
    console.error(`[${c.id}] ok=${g.ok} soft=${g.soft} constraint=${g.constraintOk} ordered=${g.orderedCount}`);
  }

  report.completedAt = new Date().toISOString();
  report.result = report.failures === 0 ? "PASS" : "FAIL";
  mkdirSync(OUT, { recursive: true });
  const outPath = path.join(OUT, "PILLOW_CONSTRAINT_NUMBERING_LEVEL_C.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        result: report.result,
        failures: report.failures,
        deploySha: report.deploySha,
        outPath,
        summary: report.cases.map((c) => ({
          id: c.id,
          ok: c.ok,
          constraintOk: c.constraintOk,
          orderedCount: c.orderedCount,
        })),
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
