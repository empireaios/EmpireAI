/**
 * Production first-visible: causal predicate + visible relevance envelope.
 * New scenarios only — no Bluehaven/Valence/Evergreen/Sterling/Northstar/Solace replay.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  authorizeTransportRelease,
  assessVisibleContractEnvelope,
  countFinalTransportClaimVerdicts,
  resolveTransportClaimObligations,
} from "../src/orchestration/pillow-host/executive-final-visible-contract.ts";
import { parseExecutiveTaskContract } from "../src/orchestration/pillow-host/executive-task-contract.ts";
import { parseClaimObligationsFromContractTasks } from "../src/orchestration/pillow-host/executive-conclusion-ledger.ts";

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
  return body.session?.sessionId || body.sessionId || `cprv-${Date.now()}`;
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

function verdictAt(text, n) {
  return new RegExp(
    `###\\s*Claim\\s*${n}\\b[\\s\\S]*?\\*\\*Verdict:\\*\\*\\s*\\**([A-Za-z]+)`,
    "i",
  ).exec(text)?.[1];
}

function noPrePostLeak(text, n) {
  const env = assessVisibleContractEnvelope(text, n, `Answer in exactly ${n} numbered sections.`);
  return (
    env.failures.length === 0 &&
    !/^Recommendation:\s/im.test(text.trim()) &&
    !/###\s*Risk\s*\/\s*lesson/i.test(text)
  );
}

const CASES = [
  {
    id: "prod_direct_vs_indirect",
    message: [
      "SyntheticCPRV-Dir — logistics only. Do not mention Mini Fan or Birth.",
      "North directly caused FailureA. FailureA triggered failover to East. East then overloaded PeerNode.",
      "Answer in exactly 5 numbered sections.",
      "1. Snapshot",
      "2. Direct causes",
      "3. Claim audit",
      "4. Path note",
      "5. Closing",
      "Audit these claims with explicit Verdict each:",
      '"North\'s failure directly caused PeerNode\'s overload."',
      '"North and PeerNode are causally connected."',
      '"North and PeerNode share the same root cause."',
    ].join("\n"),
    check: (t) => {
      const v1 = verdictAt(t, 1);
      const v2 = verdictAt(t, 2);
      const v3 = verdictAt(t, 3);
      return (
        !liveContam(t) &&
        noPrePostLeak(t, 5) &&
        /Contradict/i.test(String(v1)) &&
        /Support/i.test(String(v2)) &&
        /Contradict/i.test(String(v3))
      );
    },
  },
  {
    id: "prod_unrelated_vs_connected",
    message: [
      "SyntheticCPRV-Unrel — software only. Do not mention Mini Fan or Birth.",
      "Cedar had seal failure. Work redirected from Cedar to Inlet. Inlet shortage resulted from that redirect.",
      "Inlet never had a seal failure.",
      "Assess: Inlet shortage is unrelated to Cedar because Inlet did not suffer a seal failure.",
    ].join("\n"),
    check: (t) =>
      !liveContam(t) &&
      /Contradict/i.test(t) &&
      !/\*\*Verdict:\*\*\s*Supported/i.test(t),
  },
  {
    id: "prod_common_root",
    message: [
      "SyntheticCPRV-Root — manufacturing only. Do not mention Mini Fan or Birth.",
      "Ridge directly caused FailureA. FailureA triggered failover to Harbor. Harbor then overloaded Quay.",
      "Assess: Ridge and Quay share the same root cause.",
    ].join("\n"),
    check: (t) => !liveContam(t) && /Contradict/i.test(t),
  },
  {
    id: "prod_five_claim_exact_sections",
    message: [
      "SyntheticCPRV-5 — infrastructure only. Do not mention Mini Fan or Birth.",
      "Alpha directly caused FailureA. FailureA triggered failover to Beta. Beta then overloaded PeerNode.",
      "Beta did not suffer a power-module failure.",
      "Answer in exactly 6 numbered sections.",
      "1. Snapshot",
      "2. Direct causes",
      "3. Claim audit",
      "4. Indirect path",
      "5. Recommendation",
      "6. Closing",
      "Audit these claims with explicit Verdict each:",
      '"FailureA triggered failover to Beta."',
      '"Alpha\'s failure directly caused PeerNode\'s overload."',
      '"Alpha and Beta are causally connected."',
      '"Beta is unrelated to Alpha because Beta did not suffer a power-module failure."',
      '"Alpha and Beta share the same root cause."',
    ].join("\n"),
    check: (t) => {
      const surface = countFinalTransportClaimVerdicts(t);
      const contract = parseExecutiveTaskContract(CASES[3].message);
      const auth = authorizeTransportRelease({
        answer: t,
        userMessage: CASES[3].message,
        expectedTopLevelSections: contract.expectedTopLevelSections,
        claims: resolveTransportClaimObligations({
          userMessage: CASES[3].message,
          answer: t,
          contractClaims: parseClaimObligationsFromContractTasks(contract.tasks),
        }),
      });
      const v2 = verdictAt(t, 2);
      const v3 = verdictAt(t, 3);
      const v4 = verdictAt(t, 4);
      const v5 = verdictAt(t, 5);
      return (
        !liveContam(t) &&
        noPrePostLeak(t, 6) &&
        surface.verdictCount >= 5 &&
        auth.authorized &&
        /Contradict/i.test(String(v2)) &&
        /Support/i.test(String(v3)) &&
        /Contradict/i.test(String(v4)) &&
        /Contradict/i.test(String(v5))
      );
    },
  },
  {
    id: "prod_risk_requested",
    message: [
      "SyntheticCPRV-RiskYes — ops only. Do not mention Mini Fan or Birth.",
      "North overloaded East via failover.",
      "Answer in exactly 4 numbered sections.",
      "1. Snapshot",
      "2. Mechanism",
      "3. Remaining risk",
      "4. Closing",
      "In section 3, state what risk remains.",
    ].join("\n"),
    check: (t) =>
      !liveContam(t) &&
      noPrePostLeak(t, 4) &&
      /risk|remain|overload|failover/i.test(t) &&
      !/###\s*Risk\s*\/\s*lesson/i.test(t),
  },
  {
    id: "prod_risk_not_requested",
    message: [
      "SyntheticCPRV-RiskNo — ops only. Do not mention Mini Fan or Birth.",
      "North overloaded East via failover.",
      "Answer in exactly 4 numbered sections.",
      "1. Snapshot",
      "2. Mechanism",
      "3. Evidence",
      "4. Closing",
    ].join("\n"),
    check: (t) => !liveContam(t) && noPrePostLeak(t, 4) && !/###\s*Risk\s*\/\s*lesson/i.test(t),
  },
  {
    id: "prod_rec_requested",
    message: [
      "SyntheticCPRV-RecYes — ops only. Do not mention Mini Fan or Birth.",
      "North overloaded East via failover.",
      "Answer in exactly 4 numbered sections.",
      "1. Snapshot",
      "2. Mechanism",
      "3. Recommendation",
      "4. Closing",
      "In section 3, give a recommendation.",
    ].join("\n"),
    check: (t) =>
      !liveContam(t) &&
      noPrePostLeak(t, 4) &&
      /recommend|should|next|monitor|capacity/i.test(t) &&
      !/^Recommendation:\s/im.test(t.trim()),
  },
  {
    id: "prod_rec_not_requested",
    message: [
      "SyntheticCPRV-RecNo — ops only. Do not mention Mini Fan or Birth.",
      "North overloaded East via failover.",
      "Answer in exactly 4 numbered sections.",
      "1. Snapshot",
      "2. Mechanism",
      "3. Evidence",
      "4. Closing",
    ].join("\n"),
    check: (t) =>
      !liveContam(t) &&
      noPrePostLeak(t, 4) &&
      !/^Recommendation:\s/im.test(t.trim()) &&
      !/Validate performance \/ evidence first/i.test(t),
  },
  {
    id: "prod_memory_temptation",
    seedTurns: [
      { role: "user", content: "Earlier Mini Fan notes — ignore." },
      { role: "assistant", content: "Understood." },
    ],
    message: [
      "SyntheticCPRV-Mem — professional only. Do not mention Mini Fan or Birth.",
      "Argon failure redirected work to Cobalt. Cobalt shortage resulted. Cobalt never failed staffing.",
      "Answer in exactly 3 numbered sections.",
      "1. Snapshot",
      "2. Claim audit",
      "3. Closing",
      'Assess: "Cobalt shortage is unrelated to Argon because Cobalt never failed staffing."',
    ].join("\n"),
    check: (t) =>
      !liveContam(t) &&
      noPrePostLeak(t, 3) &&
      /Contradict/i.test(t),
  },
  {
    id: "prod_warm",
    warmFirst:
      "SyntheticCPRV-Warm — laboratory only. Ready for causal audit. Do not mention Mini Fan or Birth.",
    message: [
      "Continue laboratory synthetic only. Do not mention Mini Fan or Birth.",
      "Mesa had thermal failure. Work reassigned to Quay. Quay overloaded. Quay never had thermal failure.",
      "Answer in exactly 5 numbered sections.",
      "1. Snapshot",
      "2. Direct causes",
      "3. Claim audit",
      "4. Connection",
      "5. Closing",
      "Audit these claims with explicit Verdict each:",
      '"Mesa\'s thermal failure directly caused Quay\'s overload."',
      '"Quay is unrelated to Mesa because Quay never had thermal failure."',
      '"Mesa and Quay are causally connected."',
    ].join("\n"),
    check: (t) => {
      const v1 = verdictAt(t, 1);
      const v2 = verdictAt(t, 2);
      const v3 = verdictAt(t, 3);
      return (
        !liveContam(t) &&
        noPrePostLeak(t, 5) &&
        /Contradict/i.test(String(v1)) &&
        /Contradict/i.test(String(v2)) &&
        /Support/i.test(String(v3))
      );
    },
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
    const ok = c.check(res.text);
    const row = {
      id: c.id,
      ok,
      ms: res.ms,
      status: res.status,
      head: res.text.slice(0, 500),
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
    path.join(OUT, "CAUSAL_PREDICATE_VISIBLE_RELEVANCE_PRODUCTION.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log(JSON.stringify({ PRODUCTION_FIRST_VISIBLE_PASS: pass ? "PASS" : "FAIL", passCount: rows.filter((r) => r.ok).length, total: rows.length }));
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
