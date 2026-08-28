/**
 * Pre-fix reproductions for final-visible contract failures (new domains only).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assessFinalVisibleContract,
  stripInternalValidatorDiagnostics,
} from "../src/orchestration/pillow-host/executive-final-visible-contract.ts";
import { enforceExactSectionContract } from "../src/orchestration/pillow-host/executive-section-contract.ts";
import {
  classifyRankingObjective,
  parseCanonicalEvidenceRecords,
  rankByEvidenceStrength,
} from "../src/orchestration/pillow-host/executive-evidence-ranking.ts";
import { parseExecutiveTaskContract } from "../src/orchestration/pillow-host/executive-task-contract.ts";
import { parseClaimObligationsFromContractTasks } from "../src/orchestration/pillow-host/executive-conclusion-ledger.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

const sectionRepros = [];
for (const domain of ["Harbor", "Atlas", "Cobalt"]) {
  const userMessage = `Answer in exactly 6 numbered sections for ${domain}:\n1. Snapshot\n2. Ranking\n3. Scope\n4. Claims\n5. Rec\n6. Close`;
  const answer =
    "1. Snapshot\n2. Ranking\n3. Scope\n4. Claims\n5. Rec\n6. Close\n\n**Section contract:** 0 of 6 requested top-level numbered sections are visible; missing section numbers remain open rather than invented.";
  const before = assessFinalVisibleContract({
    answer,
    userMessage,
    expectedTopLevelSections: 6,
    claims: [],
  });
  const stripped = stripInternalValidatorDiagnostics(answer);
  const afterStrip = assessFinalVisibleContract({
    answer: stripped,
    userMessage,
    expectedTopLevelSections: 6,
    claims: [],
  });
  const enforceLeak = /section contract/i.test(
    enforceExactSectionContract("1. A\n2. B", 6).message,
  );
  sectionRepros.push({
    domain,
    PRE_FIX_SECTION_FAILURE_REPRODUCED: before.failures.includes("INTERNAL_DIAGNOSTIC_LEAK"),
    DIAGNOSTIC_LEAKED: before.diagnosticsVisible > 0,
    AFTER_STRIP_OK: afterStrip.ok,
    ENFORCE_NO_LONGER_APPENDS: !enforceLeak,
  });
}

const claimRepros = [];
for (const domain of ["Riverton", "Quartz", "Marble"]) {
  const userMessage = [
    `${domain} audit.`,
    "Audit each of the following 5 claims separately with Verdict and reason:",
    'Claim 1: "Alpha shortage is independent."',
    'Claim 2: "Beta never lost staff."',
    'Claim 3: "Gamma equals Partner Assembly."',
    'Claim 4: "Delta forecast equals realised."',
    'Claim 5: "Epsilon is blocked."',
  ].join("\n");
  const answer = [
    '### Claim 1\n"Alpha shortage is independent."',
    '### Claim 2\n"Beta never lost staff."',
    '### Claim 3\n"Gamma equals Partner Assembly."',
    "### Claim 4\n**Verdict:** Unproven\nInsufficient evidence for forecast equality.",
    "### Claim 5\n**Verdict:** Unproven\nBlocked status not established.",
  ].join("\n\n");
  const contract = parseExecutiveTaskContract(userMessage);
  const claims = parseClaimObligationsFromContractTasks(contract.tasks);
  const r = assessFinalVisibleContract({
    answer,
    userMessage,
    expectedTopLevelSections: null,
    claims,
  });
  claimRepros.push({
    domain,
    PRE_FIX_CLAIM_FAILURE_REPRODUCED: r.failures.includes("EXPLICIT_VERDICT_OMISSION"),
    missingVerdict: r.claims?.missingVerdict ?? [],
  });
}

const rankingRepros = [];
for (const pair of [
  ["Cedar", "Orchid"],
  ["Harbor", "Atlas"],
  ["Cobalt", "Quartz"],
]) {
  const [a, b] = pair;
  const userMessage = [
    "Rank by strength of fleet-wide evidence.",
    `${a}:`,
    "28 valid measured / 40 deployed",
    "8.5%.",
    `${b}:`,
    "25 valid measured / 25 deployed",
    "8%.",
  ].join("\n");
  const badAnswer = `1. ${a} stronger at 8.5%\n2. ${b} at 8%`;
  const ranked = rankByEvidenceStrength(parseCanonicalEvidenceRecords(userMessage));
  const r = assessFinalVisibleContract({
    answer: badAnswer,
    userMessage,
    expectedTopLevelSections: null,
    claims: [],
  });
  rankingRepros.push({
    pair,
    objective: classifyRankingObjective(userMessage),
    expectedFirst: ranked[0]?.subject,
    PRE_FIX_RANKING_FAILURE_REPRODUCED: r.failures.includes("VALUE_FOR_STRENGTH_SUBSTITUTION"),
  });
}

const scopeRepros = [];
for (const domain of ["Harbor", "Atlas", "Cobalt"]) {
  const userMessage = `${domain}: verified 28 valid measured / 40 deployed 8.5%.`;
  const bad = `${domain} has verified 8.5% performance fleet-wide across the entire deployed population.`;
  const r = assessFinalVisibleContract({
    answer: bad,
    userMessage,
    expectedTopLevelSections: null,
    claims: [],
  });
  scopeRepros.push({
    domain,
    PRE_FIX_SCOPE_FAILURE_REPRODUCED: r.failures.includes("SAMPLE_TO_POPULATION_OVERGENERALIZATION"),
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  PRE_FIX_SECTION_FAILURE_REPRODUCED: sectionRepros.every((r) => r.PRE_FIX_SECTION_FAILURE_REPRODUCED),
  PRE_FIX_CLAIM_FAILURE_REPRODUCED: claimRepros.every((r) => r.PRE_FIX_CLAIM_FAILURE_REPRODUCED),
  PRE_FIX_RANKING_FAILURE_REPRODUCED: rankingRepros.every((r) => r.PRE_FIX_RANKING_FAILURE_REPRODUCED),
  PRE_FIX_SCOPE_FAILURE_REPRODUCED: scopeRepros.every((r) => r.PRE_FIX_SCOPE_FAILURE_REPRODUCED),
  sectionRepros,
  claimRepros,
  rankingRepros,
  scopeRepros,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "FINAL_VISIBLE_CONTRACT_REPRO.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(
  summary.PRE_FIX_SECTION_FAILURE_REPRODUCED &&
    summary.PRE_FIX_CLAIM_FAILURE_REPRODUCED &&
    summary.PRE_FIX_RANKING_FAILURE_REPRODUCED &&
    summary.PRE_FIX_SCOPE_FAILURE_REPRODUCED
    ? 0
    : 1,
);
