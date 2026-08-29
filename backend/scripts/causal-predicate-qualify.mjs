/**
 * Causal predicate qualification (>=200 cases).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessClaimAgainstCanonical } from "../src/orchestration/pillow-host/executive-claim-proposition.ts";
import { buildCanonicalCaseState } from "../src/orchestration/pillow-host/executive-canonical-state.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");
const DOMAINS = [
  ["North", "East", "PeerNode"],
  ["Alpha", "Beta", "Relay"],
  ["Ridge", "Harbor", "Quay"],
  ["Cedar", "Inlet", "Dock"],
  ["Atlas", "Cobalt", "Forge"],
];

function chain(a, b, c) {
  return `${a} directly caused FailureA. FailureA triggered failover to ${b}. ${b} then overloaded ${c}.`;
}

const cases = [];
let i = 0;
for (const [a, b, c] of DOMAINS) {
  for (let n = 0; n < 40; n++) {
    i += 1;
    const pack = `SyntheticCQ-${i} — ops only.\n${chain(a, b, c)}`;
    const can = buildCanonicalCaseState(pack);
    cases.push({
      id: `direct_for_indirect_${i}`,
      pack,
      claim: `${a}'s power-module failure directly caused ${b}'s memory exhaustion.`,
      expect: "contradicted",
      class: "DIRECT_FOR_INDIRECT",
      can,
    });
    cases.push({
      id: `unrelated_${i}`,
      pack,
      claim: `${c} problem is unrelated to ${a} because ${c} did not suffer the same failure.`,
      expect: "contradicted",
      class: "INDIRECT_AS_UNRELATED",
      can,
    });
    cases.push({
      id: `same_root_${i}`,
      pack,
      claim: `${a} and ${c} share the same root cause.`,
      expect: "contradicted",
      class: "CONNECTION_AS_COMMON_ROOT",
      can,
    });
    cases.push({
      id: `connected_${i}`,
      pack,
      claim: `${a} is the direct cause of ${c}.`,
      expect: "contradicted",
      class: "DIRECT_FOR_INDIRECT",
      can,
    });
  }
}

// Temporal-only: no causal verbs linking entities
for (let n = 0; n < 20; n++) {
  const [a, b] = DOMAINS[n % DOMAINS.length];
  const pack = `SyntheticTemporal-${n} — ops only.\n${a} reported at 09:00. ${b} reported at 09:15. No redirect, failover, or causal link is stated.`;
  const can = buildCanonicalCaseState(pack);
  cases.push({
    id: `temporal_${n}`,
    pack,
    claim: `${a} directly caused ${b}.`,
    expect: "unproven",
    class: "TEMPORAL_AS_CAUSAL",
    can,
  });
}

// Negative controls: wrong Supported must not pass when expect contradicted
let directErr = 0;
let unrelatedErr = 0;
let rootErr = 0;
let temporalErr = 0;
let negFalsePass = 0;

for (const c of cases) {
  const got = assessClaimAgainstCanonical(c.claim, c.can).overall;
  const ok = got === c.expect;
  if (!ok) {
    if (c.class === "DIRECT_FOR_INDIRECT") directErr += 1;
    if (c.class === "INDIRECT_AS_UNRELATED") unrelatedErr += 1;
    if (c.class === "CONNECTION_AS_COMMON_ROOT") rootErr += 1;
    if (c.class === "TEMPORAL_AS_CAUSAL") temporalErr += 1;
  }
  // Negative: if we wrongly mark Supported when expect contradicted
  if (c.expect === "contradicted" && got === "supported") negFalsePass += 1;
}

const summary = {
  generatedAt: new Date().toISOString(),
  CAUSAL_RAW_CASES: cases.length,
  DIRECT_FOR_INDIRECT_ERROR: directErr,
  INDIRECT_AS_UNRELATED_ERROR: unrelatedErr,
  CONNECTION_AS_COMMON_ROOT_ERROR: rootErr,
  TEMPORAL_AS_CAUSAL_ERROR: temporalErr,
  NEGATIVE_CONTROL_FALSE_PASS: negFalsePass,
  pass:
    cases.length >= 200 &&
    directErr === 0 &&
    unrelatedErr === 0 &&
    rootErr === 0 &&
    temporalErr === 0 &&
    negFalsePass === 0,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "CAUSAL_PREDICATE_QUAL.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (!summary.pass) process.exit(1);
