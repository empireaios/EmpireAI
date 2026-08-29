/**
 * Combined causal + relevance qualification (>=100 cases).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessClaimAgainstCanonical } from "../src/orchestration/pillow-host/executive-claim-proposition.ts";
import { buildCanonicalCaseState } from "../src/orchestration/pillow-host/executive-canonical-state.ts";
import {
  enforceVisibleContractEnvelope,
  assessVisibleContractEnvelope,
  authorizeTransportRelease,
} from "../src/orchestration/pillow-host/executive-final-visible-contract.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

const pairs = [
  ["North", "East", "PeerNode"],
  ["Alpha", "Beta", "Relay"],
  ["Ridge", "Harbor", "Quay"],
  ["Cedar", "Inlet", "Dock"],
];

const cases = [];
let fail = 0;
for (let i = 0; i < 100; i++) {
  const [a, b, c] = pairs[i % pairs.length];
  const n = [5, 6, 8][i % 3];
  const pack = [
    `SyntheticCombined-${i} — ops only. Do not mention Mini Fan.`,
    `${a} directly caused FailureA. FailureA triggered failover to ${b}. ${b} then overloaded ${c}.`,
    `Answer in exactly ${n} numbered sections.`,
    ...Array.from({ length: n }, (_, j) => `${j + 1}. Section ${j + 1}`),
    `Audit 3 claims:`,
    `"${a}'s failure directly caused ${c}'s overload."`,
    `"${c} is unrelated to ${a} because ${c} did not suffer the original failure."`,
    `"${a} and ${c} share the same root cause."`,
  ].join("\n");
  const can = buildCanonicalCaseState(pack);
  const claims = [
    `${a}'s failure directly caused ${c}'s overload.`,
    `${c} is unrelated to ${a} because ${c} did not suffer the original failure.`,
    `${a} and ${c} share the same root cause.`,
  ];
  for (const claim of claims) {
    if (assessClaimAgainstCanonical(claim, can).overall !== "contradicted") fail += 1;
  }
  const body = Array.from({ length: n }, (_, j) => `${j + 1}. Section ${j + 1}\nBody.`).join("\n\n");
  const dirty =
    "Recommendation: Validate performance / evidence first, then scale only what clears constitutional and commercial thresholds.\n\n" +
    body +
    "\n\n### Risk / lesson\nFailover overload.";
  const enf = enforceVisibleContractEnvelope(dirty, n, pack);
  const env = assessVisibleContractEnvelope(enf.message, n, pack);
  if (env.failures.length > 0) fail += 1;
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
  if (!auth.authorized) fail += 1;
  cases.push({ id: `comb_${i}`, ok: true });
}

const summary = {
  generatedAt: new Date().toISOString(),
  COMBINED_CAUSAL_RELEVANCE_CASES: cases.length,
  COMBINED_FAILS: fail,
  COMBINED_PASS_RATE: fail === 0 ? "100%" : "FAIL",
  pass: cases.length >= 100 && fail === 0,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "CAUSAL_RELEVANCE_COMBINED_QUAL.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (!summary.pass) process.exit(1);
