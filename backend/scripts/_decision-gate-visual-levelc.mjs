/**
 * Level C — multi-gate decision unlock + visual section separation.
 * Synthetic only. Does not encode sealed Atlas closure scenario.
 *
 * Requires env: EMPIRE_LOGIN_EMAIL, EMPIRE_LOGIN_PASSWORD
 * Optional: EMPIRE_COCKPIT_URL, EMPIRE_BRAIN_URL
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL ||
  process.env.FOUNDER_EMAIL ||
  "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD ||
  process.env.FOUNDER_PASSWORD ||
  "EmpireAI2026!";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

const ASK_AGAIN =
  /\b(please ask again|ask again in a moment|realigning executive intelligence)\b/i;
const TIMEOUT_SOFT =
  /worker proxy timed out|deep reasoning worker is temporarily restarting|tell me which theme to deepen/i;
const LIVE_CONTAM = /\b(High-Speed Handheld|Mini Fan|B0FKFNCT52)\b/i;
const FULL_UNLOCK =
  /\bunlock(?:s|ed|ing)?\s+(?:the\s+)?(?:decision\s+to\s+)?(?:meaningful\s+)?scale\b/i;

function countInlineNextSectionOccurrences(source) {
  return (
    String(source || "").match(/[.!?…][ \t]+[1-9]\d?[.)]\s+(?:\*\*[A-Za-z]|[A-Z])/g) || []
  ).length;
}
function countOrderedMarkers(text) {
  return (String(text || "").match(/^\s*[1-9]\d?[.)]\s+\S/gm) || []).length;
}

const CASES = [
  {
    id: "CASE1_two_blockers_one_resolve",
    prompt: [
      "Synthetic analysis only — NOT EmpireAI facts.",
      "Module KEEL currently loses S$4 per transaction after a verified S$2 cost cut (was worse before).",
      "Possible further S$5 saving exists but is UNVERIFIED.",
      "Operating capacity is capped at 120 transactions/week; expansion needs additional fixed investment.",
      "If the unverified S$5 saving becomes verified, what decision does that unlock — and what remains blocked?",
    ].join("\n"),
    requirePartialUnlock: true,
  },
  {
    id: "CASE2_three_blockers",
    prompt: [
      "Synthetic analysis only.",
      "Three blockers: (1) unit economics still negative, (2) capacity limited, (3) expansion investment not justified.",
      "Recommend the strongest justified next step. Do not treat clearing one gate as full scale unlock.",
    ].join("\n"),
    requirePartialUnlock: true,
  },
  {
    id: "CASE3_all_resolved",
    prompt: [
      "Synthetic analysis only.",
      "Verified: contribution now positive; capacity expanded and verified; investment ROI verified acceptable.",
      "Is meaningful scaling eligible? State gate status briefly.",
    ].join("\n"),
    allowScaleEligible: true,
  },
  {
    id: "CASE4_exact_evidence",
    prompt: [
      "Synthetic analysis only.",
      "Service has negative contribution remaining after a partial verified cost cut, capacity capped, and expansion needs fixed investment.",
      "What exact evidence would make this eligible for meaningful scaling?",
    ].join("\n"),
    requireExactEvidence: true,
  },
  {
    id: "CASE5_seven_sections",
    prompt: [
      "SyntheticCanary — seven clearly separated numbered sections with nested bullets under section 2:",
      "1) Economics reading",
      "2) Capacity reading",
      "3) Unverified saving",
      "4) Partial unlock",
      "5) Exact evidence for scale",
      "6) Best next action",
      "7) Recommendation",
      "Facts: negative contribution remains; capacity capped; expansion needs investment; one unverified saving.",
    ].join("\n"),
    requireOrdered: 7,
  },
  {
    id: "CASE6_three_sections",
    prompt: [
      "SyntheticCanary — three clearly separated numbered sections:",
      "1) Active blockers",
      "2) What one verified saving would clear",
      "3) What would still block meaningful scaling",
      "Scenario: negative unit economics + capacity limit.",
    ].join("\n"),
    requireOrdered: 3,
  },
  {
    id: "CASE7_simple",
    prompt:
      "SyntheticCanary simple: In one short sentence, what is our verified realised order count?",
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

function grade(text, spec) {
  const soft = TIMEOUT_SOFT.test(text);
  const askAgain = ASK_AGAIN.test(text);
  const contam = LIVE_CONTAM.test(text) && !spec.simple;
  const newlines = (text.match(/\n/g) || []).length;
  const wall = text.length > 900 && newlines < 2;
  const inlineNext = countInlineNextSectionOccurrences(text);
  const orderedMarkers = countOrderedMarkers(text);
  const orderedOk = !spec.requireOrdered || orderedMarkers >= spec.requireOrdered;
  const visuallySeparated = !spec.requireOrdered || inlineNext === 0;
  let gateOk = true;
  if (spec.requirePartialUnlock) {
    const claimsFullUnlock =
      FULL_UNLOCK.test(text) &&
      !/\b(?:not|remain|still|partial|capacity|investment|gate)\b/i.test(text);
    const acknowledgesRemain =
      /\b(?:remain|still|capacity|investment|partial unlock|not (?:yet )?eligible|gate)\b/i.test(
        text,
      );
    gateOk = !claimsFullUnlock && acknowledgesRemain;
  }
  if (spec.requireExactEvidence) {
    gateOk = /\b(?:capacity|investment|contribution|economics|evidence)\b/i.test(text);
  }
  if (spec.allowScaleEligible) {
    gateOk = /\b(?:eligible|clear|pass|positive)\b/i.test(text) || !FULL_UNLOCK.test(text);
  }
  const simpleOk = !spec.simple || (text.length <= 500 && /\b(0|zero)\b/i.test(text));
  const ok =
    !soft &&
    !askAgain &&
    !contam &&
    !wall &&
    orderedOk &&
    visuallySeparated &&
    gateOk &&
    simpleOk &&
    text.length >= 40;
  return {
    ok,
    soft,
    askAgain,
    contam,
    wall,
    inlineNext,
    orderedMarkers,
    orderedOk,
    visuallySeparated,
    gateOk,
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
  if (!EMAIL || !PASSWORD) {
    console.error(JSON.stringify({ pass: false, reason: "missing_login_env" }));
    process.exit(2);
  }
  const report = {
    artifact: "PILLOW_DECISION_GATE_VISUAL_LEVEL_C",
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
    const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(90_000),
    });
    const sj = await sess.json().catch(() => ({}));
    if (sess.ok && sj.session?.sessionId) sessionId = sj.session.sessionId;
    await new Promise((r) => setTimeout(r, 2000));
    let res = await chat(cookie, sessionId, c.prompt);
    sessionId = res.sessionId;
    // One retry on transient worker faults (not a reasoning FAIL).
    if (/transient fault|worker proxy timed out|temporarily restarting/i.test(res.text)) {
      await new Promise((r) => setTimeout(r, 4000));
      res = await chat(cookie, sessionId, c.prompt);
      sessionId = res.sessionId;
    }
    const g = grade(res.text, c);
    if (!g.ok || res.status >= 400) report.failures += 1;
    report.cases.push({
      id: c.id,
      ok: g.ok && res.status < 400,
      status: res.status,
      ...g,
      text: res.text,
    });
    console.error(
      `[${c.id}] ok=${g.ok} gate=${g.gateOk} inlineNext=${g.inlineNext} ordered=${g.orderedMarkers}`,
    );
  }
  report.completedAt = new Date().toISOString();
  report.result = report.failures === 0 ? "PASS" : "FAIL";
  mkdirSync(OUT, { recursive: true });
  const outPath = path.join(OUT, "PILLOW_DECISION_GATE_VISUAL_LEVEL_C.json");
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
          gateOk: c.gateOk,
          inlineNext: c.inlineNext,
          orderedMarkers: c.orderedMarkers,
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
