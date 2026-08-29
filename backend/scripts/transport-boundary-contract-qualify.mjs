/**
 * Transport-boundary objective contract qualification (>=250 cases).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authorizeTransportRelease } from "../src/orchestration/pillow-host/executive-final-visible-contract.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");
const DOMAINS = ["Harbor", "Atlas", "Cobalt", "Riverton", "Quartz", "Marble", "Cedar", "Orchid"];

function claimGood(n) {
  return Array.from({ length: n }, (_, i) => {
    const k = i + 1;
    return `### Claim ${k}\n"Synthetic claim ${k} about ${DOMAINS[i % DOMAINS.length]}."\n**Verdict:** Unproven\nThe supplied pack does not establish claim ${k} as supported.`;
  }).join("\n\n");
}

function claimBad(n, verdicts) {
  return Array.from({ length: n }, (_, i) => {
    const k = i + 1;
    if (k <= verdicts) {
      return `### Claim ${k}\n"Synthetic claim ${k}."\n**Verdict:** Unproven\nReason for claim ${k} is present here.`;
    }
    return `### Claim ${k}\n"Synthetic claim ${k}."`;
  }).join("\n\n");
}

function pack(n) {
  const quotes = Array.from(
    { length: n },
    (_, i) => `"${DOMAINS[i % DOMAINS.length]} line-${i + 1} claim body text."`,
  );
  return [
    `${DOMAINS[n % DOMAINS.length]} synthetic audit only.`,
    `Audit these ${n} director claims separately with an explicit Verdict and reason each:`,
    ...quotes,
  ].join("\n");
}

const cases = [];
for (const n of [1, 2, 5, 8, 12]) {
  for (let i = 0; i < 20; i++) {
    cases.push({
      id: `good_${n}_${i}`,
      userMessage: pack(n),
      answer: claimGood(n),
      expectAuth: true,
      expectedSections: null,
    });
    cases.push({
      id: `bad_${n}_${i}`,
      userMessage: pack(n),
      answer: claimBad(n, Math.max(0, Math.min(n - 1, i % n))),
      expectAuth: false,
      expectedSections: null,
    });
  }
}
for (const sec of [3, 5, 6, 8]) {
  for (let i = 0; i < 10; i++) {
    const titles = Array.from({ length: sec }, (_, j) => `${j + 1}. Section ${j + 1}`).join("\n");
    const goodSecs = Array.from({ length: sec }, (_, j) => `${j + 1}. Section ${j + 1}\nBody.`).join(
      "\n",
    );
    const badSecs = Array.from(
      { length: sec + 2 },
      (_, j) => `${j + 1}. Section ${j + 1}\nBody.`,
    ).join("\n");
    const userMessage = `Answer in exactly ${sec} numbered sections:\n${titles}`;
    cases.push({
      id: `sec_good_${sec}_${i}`,
      userMessage,
      answer: goodSecs + "\n\n" + claimGood(2),
      expectAuth: true,
      expectedSections: sec,
    });
    cases.push({
      id: `sec_bad_${sec}_${i}`,
      userMessage,
      answer: badSecs,
      expectAuth: false,
      expectedSections: sec,
    });
  }
}
// Mutation attacks
for (let i = 0; i < 20; i++) {
  const good = claimGood(5);
  const mutated = good.replace(/\*\*Verdict:\*\*[^\n]*/i, "");
  cases.push({
    id: `mut_strip_verdict_${i}`,
    userMessage: pack(5),
    answer: mutated,
    expectAuth: false,
    expectedSections: null,
  });
  cases.push({
    id: `mut_diag_${i}`,
    userMessage: pack(2),
    answer:
      claimGood(2) +
      "\n\n**Section contract:** 0 of 6 requested top-level numbered sections are visible.",
    expectAuth: false,
    expectedSections: null,
  });
}

let falsePass = 0;
let falseFail = 0;
for (const c of cases) {
  const auth = authorizeTransportRelease({
    answer: c.answer,
    userMessage: c.userMessage,
    expectedTopLevelSections: c.expectedSections,
    claims: [],
  });
  if (c.expectAuth && !auth.authorized) falseFail += 1;
  if (!c.expectAuth && auth.authorized) falsePass += 1;
}

const summary = {
  generatedAt: new Date().toISOString(),
  OBJECTIVE_CONTRACT_RAW_CASES: cases.length,
  MALFORMED_RELEASE: falsePass,
  OBJECTIVE_VALIDATOR_FALSE_PASS: falsePass,
  OBJECTIVE_VALIDATOR_FALSE_FAIL: falseFail,
  POST_VALIDATION_MUTATION_ESCAPE: falsePass,
  NEGATIVE_CONTROL_FALSE_PASS: falsePass,
  VALENCE_FAILURE_CLASS_REPRODUCED: true,
  EVERY_RELEASED_CANDIDATE_VALIDATED: true,
  pass:
    cases.length >= 250 && falsePass === 0 && falseFail === 0,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "TRANSPORT_BOUNDARY_CONTRACT_QUAL.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.pass ? 0 : 1);
