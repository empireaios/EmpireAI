/**
 * Production first-visible: transport-boundary claim contracts.
 * New scenarios only — no Valence/Evergreen/Sterling/Northstar/Solace replay.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  authorizeTransportRelease,
  countFinalTransportClaimVerdicts,
} from "../src/orchestration/pillow-host/executive-final-visible-contract.ts";
import { parseExecutiveTaskContract } from "../src/orchestration/pillow-host/executive-task-contract.ts";
import { parseClaimObligationsFromContractTasks } from "../src/orchestration/pillow-host/executive-conclusion-ledger.ts";
import { resolveTransportClaimObligations } from "../src/orchestration/pillow-host/executive-final-visible-contract.ts";

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
  return body.session?.sessionId || body.sessionId || `tb-${Date.now()}`;
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

function liveContam(text) {
  return /\bMini Fan\b|\bBirth\b|realised orders|### Temporal audit/i.test(text);
}

function gradeClaims(userMessage, text, expected) {
  const contract = parseExecutiveTaskContract(userMessage);
  const claims = resolveTransportClaimObligations({
    userMessage,
    answer: text,
    contractClaims: parseClaimObligationsFromContractTasks(contract.tasks),
  });
  const auth = authorizeTransportRelease({
    answer: text,
    userMessage,
    expectedTopLevelSections: contract.expectedTopLevelSections,
    claims,
  });
  const surface = countFinalTransportClaimVerdicts(text);
  const cleanFail = /cannot release/i.test(text);
  // Success path: authorized with enough verdicts; OR clean scoped failure (not malformed success).
  if (auth.authorized) {
    return (
      auth.assessment.provenance.finalTransportVerdictCount >= expected &&
      !liveContam(text) &&
      !/section contract/i.test(text)
    );
  }
  // Must not ship malformed claim audit as success.
  return cleanFail && surface.verdictCount < expected && !liveContam(text);
}

const CASES = [
  {
    id: "prod_five_claim_transport",
    message: [
      "SyntheticTB-5 — HarborOps only. Do not mention Mini Fan or Birth.",
      "Audit these 5 director claims separately with an explicit Verdict and reason each:",
      '1. "East lane delay equals shipment delay."',
      '2. "West shortage is independent of East."',
      '3. "North proves fleet-wide 9%."',
      '4. "Certificate CX-11 is blocked."',
      '5. "Forecast equals realised for batch H1."',
      "East delay is a duplicate incident report, not a shipment delay.",
      "West received East overflow work. West never lost staff.",
      "North sample 40/200 at 9%; no full-population rate.",
      "CX-11 is ACTIVE.",
      "Forecast H1 $30. Realised $12.",
    ].join("\n"),
    check: (t) => gradeClaims(CASES[0].message, t, 5),
  },
  {
    id: "prod_eight_claim_transport",
    message: [
      "SyntheticTB-8 — AtlasOps only. Do not mention Mini Fan or Birth.",
      "Audit these 8 director claims separately with Verdict and reason each:",
      ...Array.from({ length: 8 }, (_, i) => `"Atlas claim-body-${i + 1} is established independently."`),
      "No evidence establishes any of these as supported.",
    ].join("\n"),
    check: (t) => gradeClaims(CASES[1].message, t, 8),
  },
  {
    id: "prod_nested_sections",
    message: [
      "SyntheticTB-Sec — Cobalt logistics only. Do not mention Mini Fan or Birth.",
      "Answer in exactly six numbered sections:",
      "1. Snapshot",
      "2. Evidence-strength ranking",
      "3. Population note",
      "4. Claim audit",
      "5. Recommendation",
      "6. Closing",
      "Lane Red: verified full-population 100/100 91%.",
      "Lane Blue: sample 30/150 96%; no verified full-population.",
    ].join("\n"),
    check: (t) => !/section contract/i.test(t) && !liveContam(t),
  },
  {
    id: "prod_evidence_pop",
    message: [
      "SyntheticTB-Ev — Riverton fleet only. Do not mention Mini Fan or Birth.",
      "Rank by strength of fleet-wide evidence.",
      "Ridge: verified full-population 25/25 5%.",
      "Coast: verified 28 valid measured / 40 deployed 6%.",
    ].join("\n"),
    check: (t) => {
      const ridge = t.search(/\bRidge\b/i);
      const coast = t.search(/\bCoast\b/i);
      return (
        !liveContam(t) &&
        ((ridge >= 0 && coast >= 0 && ridge < coast) ||
          /Evidence-strength order[\s\S]{0,120}Ridge/i.test(t))
      );
    },
  },
  {
    id: "prod_financial",
    message: [
      "SyntheticTB-Fin — Quartz only. Do not mention Mini Fan or Birth.",
      "Assess: Forecast equals realised for batch Q9.",
      "Forecast $40. Realised $18.",
    ].join("\n"),
    check: (t) => /Contradicted|not equal|false|does not/i.test(t) && !liveContam(t),
  },
  {
    id: "prod_causal",
    message: [
      "SyntheticTB-Causal — Marble only. Do not mention Mini Fan or Birth.",
      "Mesa shortage. Work to Quay. Quay shortage resulted. Quay never lost staff.",
      "Assess: Quay shortage has nothing to do with Mesa because Quay never lost staff.",
    ].join("\n"),
    check: (t) => /Contradicted|not free of causal|not supported/i.test(t) && !liveContam(t),
  },
  {
    id: "prod_memory",
    seedTurns: [
      { role: "user", content: "Earlier Mini Fan notes — ignore." },
      { role: "assistant", content: "Understood." },
    ],
    message: [
      "SyntheticTB-Mem — Cedar only. Do not mention Mini Fan or Birth.",
      "Argon failure redirected work to Cobalt. Cobalt shortage resulted. Cobalt never failed staffing.",
      "Assess: Cobalt shortage is unrelated to Argon because Cobalt never failed staffing.",
    ].join("\n"),
    check: (t) =>
      !liveContam(t) &&
      /Contradicted|not supported|cannot be fully supported|unsupported|causally|not free of causal|indirect/i.test(
        t,
      ),
  },
  {
    id: "prod_warm",
    warmFirst: "SyntheticTB-Warm — Orchid only. Ready for claim audit. Do not mention Mini Fan or Birth.",
    message: [
      "Continue Orchid synthetic only. Do not mention Mini Fan or Birth.",
      "Audit these 5 director claims separately with Verdict and reason:",
      '1. "Alpha equals Partner."',
      '2. "Beta is blocked."',
      '3. "Gamma proves population rate."',
      '4. "Delta forecast equals realised."',
      '5. "Epsilon never occurred."',
      "Alpha ≠ Partner. Beta ACTIVE. Sample 10/100. Forecast 20 realised 8. Epsilon completed.",
    ].join("\n"),
    check: (t) => gradeClaims(CASES[7].message, t, 5),
  },
];

async function healthLive() {
  const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(30_000) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, deploy: j.deploy || null };
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
    const surface = countFinalTransportClaimVerdicts(res.text);
    const contract = parseExecutiveTaskContract(c.message);
    const auth = authorizeTransportRelease({
      answer: res.text,
      userMessage: c.message,
      expectedTopLevelSections: contract.expectedTopLevelSections,
      claims: resolveTransportClaimObligations({
        userMessage: c.message,
        answer: res.text,
        contractClaims: parseClaimObligationsFromContractTasks(contract.tasks),
      }),
    });
    const ok = c.check(res.text);
    const row = {
      id: c.id,
      ok,
      ms: res.ms,
      status: res.status,
      hasDiag: /section contract/i.test(res.text),
      surface,
      provenance: auth.assessment.provenance,
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
    path.join(OUT, "TRANSPORT_BOUNDARY_PRODUCTION_FIRST_VISIBLE.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log(JSON.stringify({ PRODUCTION_FIRST_VISIBLE_PASS: pass ? "PASS" : "FAIL" }));
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
