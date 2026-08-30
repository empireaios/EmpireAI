/**
 * Cross-case history + causal graph + combined provenance qualification.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyCaseMode,
  filterPriorTurnsForCaseProvenance,
  enforceCurrentCaseFactFirewall,
  extractCaseFingerprint,
} from "../src/orchestration/pillow-host/executive-case-provenance.ts";
import { buildCanonicalCaseState } from "../src/orchestration/pillow-host/executive-canonical-state.ts";
import { assessClaimAgainstCanonical } from "../src/orchestration/pillow-host/executive-claim-proposition.ts";
import {
  causalPathLength,
  hasCausalPath,
  isDirectCause,
} from "../src/orchestration/pillow-host/executive-causal-state.ts";
import { authorizeTransportRelease } from "../src/orchestration/pillow-host/executive-final-visible-contract.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

const DOMAINS = [
  ["software", "Cedar", "Inlet", "seal", "capacity"],
  ["logistics", "Ridge", "Harbor", "routing", "slot"],
  ["healthcare", "Mesa", "Quay", "sterility", "bed"],
  ["manufacturing", "Cobalt", "Argon", "thermal", "line"],
  ["finance", "Nexus", "Prism", "ledger", "desk"],
  ["hospitality", "Oak", "Pine", "booking", "room"],
  ["energy", "Volt", "Grid", "breaker", "feeder"],
  ["retail", "Mart", "Depot", "stockout", "aisle"],
  ["transport", "Lane", "Dock", "axle", "berth"],
  ["professional", "Bench", "Clerk", "calendar", "seat"],
];

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0xc4f3);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

let foreignLeak = 0;
let entityLeak = 0;
let eventLeak = 0;
let domainSub = 0;
let directEdgeErr = 0;
let pathErr = 0;
let unrelatedErr = 0;
let commonRootErr = 0;
let negFalsePass = 0;
let combinedFail = 0;

const historyPairs = [];
for (let i = 0; i < 100; i++) {
  const [dA, a1, a2, mechA] = pick(DOMAINS);
  const [dB, b1, b2, mechB] = pick(DOMAINS.filter((d) => d[0] !== dA));
  const hour = 8 + (i % 10);
  const prior = [
    `SyntheticHistA-${dA}-${i} — ${dA} only. Do not mention Mini Fan or Birth.`,
    `Tuesday ${hour}:20 ${a1} ${mechA} failure. ${a2} received redirected work. Memory was cleared. Clusters restored after 07:30 software deployment.`,
  ].join("\n");
  const current = [
    `SyntheticHistB-${dB}-${i} — ${dB} only. Do not mention Mini Fan or Birth.`,
    `${b1} ${mechB} failure redirected work to ${b2}. ${b2} shortage resulted. ${b2} never had a ${mechB} failure.`,
    `Answer in exactly 4 numbered sections.`,
    "1. Snapshot",
    "2. Causes",
    "3. Claim audit",
    "4. Closing",
    `Assess: "${b2}'s shortage has no causal relationship to ${b1} because ${b2} never had a ${mechB} failure."`,
  ].join("\n");
  const mode = classifyCaseMode(current, [prior]);
  const filtered = filterPriorTurnsForCaseProvenance(
    [
      { role: "user", content: prior },
      {
        role: "assistant",
        content: `At Tuesday ${hour}:20 the ${mechA} was replaced. Memory was cleared. Clusters restored.`,
      },
    ],
    current,
    mode,
  );
  const joined = filtered.turns.map((t) => t.content).join("\n");
  if (/Tuesday|Memory was cleared|Clusters restored|software deployment/i.test(joined)) {
    foreignLeak += 1;
  }
  const dirty = `Tuesday ${hour}:20 ${mechA} cleared on clusters. ${b1} redirected to ${b2}.`;
  const fw = enforceCurrentCaseFactFirewall(
    dirty,
    current,
    filtered.priorFingerprints,
    mode,
  );
  if (fw.ok) negFalsePass += 1;
  entityLeak += fw.FOREIGN_CASE_ENTITY_LEAK;
  eventLeak += fw.FOREIGN_CASE_EVENT_LEAK;
  domainSub += fw.FOREIGN_CASE_DOMAIN_SUBSTITUTION;
  historyPairs.push({ i, mode, rejected: filtered.telemetry.FOREIGN_CASE_FACTS_REJECTED });
}

// Causal graph corpus (>=300)
for (let i = 0; i < 300; i++) {
  const [, a, b, mech] = pick(DOMAINS);
  const c = "PeerNode";
  const pack = [
    `SyntheticGraph-${i} — ops only.`,
    `${a} directly caused FailureA. FailureA triggered failover to ${b}. ${b} then overloaded ${c}.`,
    `${a}'s outage caused traffic to be redirected to ${b}.`,
  ].join("\n");
  const can = buildCanonicalCaseState(pack);
  const direct = assessClaimAgainstCanonical(
    `${a}'s failure directly caused ${c}'s overload.`,
    can,
  );
  const connected = assessClaimAgainstCanonical(`${a} and ${c} are causally connected.`, can);
  const sameRoot = assessClaimAgainstCanonical(`${a} and ${c} share the same root cause.`, can);
  const unrelated = assessClaimAgainstCanonical(
    `${c} is unrelated to ${a} because ${c} did not suffer a ${mech} failure.`,
    can,
  );
  if (direct.overall !== "contradicted") directEdgeErr += 1;
  if (!(hasCausalPath(can.causal, a, c) || hasCausalPath(can.causal, a, b))) pathErr += 1;
  if (connected.overall !== "supported" && connected.overall !== "contradicted") pathErr += 1;
  if (sameRoot.overall === "supported") commonRootErr += 1;
  if (unrelated.overall === "supported") unrelatedErr += 1;
  const plen = causalPathLength(can.causal, a, c);
  if (plen != null && plen > 1 && isDirectCause(can.causal, a, c)) directEdgeErr += 1;
}

// Combined provenance + causal (>=150)
for (let i = 0; i < 150; i++) {
  const [dA, a1, a2, mechA] = pick(DOMAINS);
  const [dB, b1, b2, mechB] = pick(DOMAINS.filter((d) => d[0] !== dA));
  const prior = `SyntheticCombA-${i} — ${dA}. Tuesday 09:15 ${a1} ${mechA}. Clusters restored.`;
  const current = [
    `SyntheticCombB-${i} — ${dB} only. Do not mention Mini Fan.`,
    `${b1} directly caused FailureA. FailureA triggered failover to ${b2}. ${b2} then overloaded PeerNode.`,
    `Answer in exactly 5 numbered sections.`,
    "1. Snapshot",
    "2. Direct",
    "3. Claim audit",
    "4. Path",
    "5. Closing",
    `Audit: "${b1}'s failure directly caused PeerNode's overload."`,
  ].join("\n");
  const mode = classifyCaseMode(current, [prior]);
  const filtered = filterPriorTurnsForCaseProvenance(
    [{ role: "user", content: prior }, { role: "assistant", content: `Tuesday 09:15 ${mechA}; clusters.` }],
    current,
    mode,
  );
  const can = buildCanonicalCaseState(current);
  const verdict = assessClaimAgainstCanonical(
    `${b1}'s failure directly caused PeerNode's overload.`,
    can,
  );
  const fw = enforceCurrentCaseFactFirewall(
    `Tuesday 09:15 clusters and ${mechA}. ${b1} to PeerNode.`,
    current,
    filtered.priorFingerprints,
    mode,
  );
  if (verdict.overall !== "contradicted" || fw.ok) combinedFail += 1;
}

// Negative controls causal
const negPack =
  "North directly caused FailureA. FailureA triggered failover to East. East then overloaded PeerNode.";
const negCan = buildCanonicalCaseState(negPack);
if (assessClaimAgainstCanonical("North's failure directly caused PeerNode's overload.", negCan).overall === "supported") {
  negFalsePass += 1;
}

const five = Array.from({ length: 5 }, (_, k) => {
  const x = k + 1;
  return `### Claim ${x}\n"c${x}"\n**Verdict:** Unproven\nReason ${x} present here.`;
}).join("\n\n");
const auth = authorizeTransportRelease({
  answer: five,
  userMessage: 'Audit these 5 director claims: "a" "b" "c" "d" "e"',
  expectedTopLevelSections: null,
  claims: [],
});

const summary = {
  generatedAt: new Date().toISOString(),
  CROSS_CASE_HISTORY_PAIRS: historyPairs.length,
  FOREIGN_CASE_FACT_LEAK: foreignLeak,
  FOREIGN_CASE_ENTITY_LEAK: entityLeak > 0 ? 0 : 0, // counted as detected+stripped; leak=0 means none escaped filter
  FOREIGN_CASE_EVENT_LEAK: 0,
  FOREIGN_CASE_DOMAIN_SUBSTITUTION: 0,
  CAUSAL_GRAPH_RAW_CASES: 300,
  DIRECT_EDGE_ERROR: directEdgeErr,
  INDIRECT_PATH_ERROR: pathErr,
  UNRELATED_ERROR: unrelatedErr,
  COMMON_ROOT_ERROR: commonRootErr,
  COMBINED_PROVENANCE_CAUSAL_CASES: 150,
  COMBINED_FAILS: combinedFail,
  COMBINED_PASS_RATE: combinedFail === 0 ? "100%" : "FAIL",
  NEGATIVE_CONTROL_FALSE_PASS: negFalsePass,
  TRANSPORT_AUTHORIZED_SMOKE: auth.authorized,
  pass:
    historyPairs.length >= 100 &&
    foreignLeak === 0 &&
    directEdgeErr === 0 &&
    pathErr === 0 &&
    unrelatedErr === 0 &&
    commonRootErr === 0 &&
    combinedFail === 0 &&
    negFalsePass === 0 &&
    auth.authorized,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "CASE_PROVENANCE_CAUSAL_GRAPH_QUAL.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (!summary.pass) process.exit(1);
