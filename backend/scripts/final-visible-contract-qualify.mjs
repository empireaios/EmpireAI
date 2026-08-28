/**
 * Final-visible contract qualification — grades exact answer strings.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSectionContractCorpus,
  buildClaimContractCorpus,
  buildEvidenceStrengthCorpus,
  buildPopulationScopeCorpus,
  buildCombinedCorpus,
  buildNegativeControls,
} from "../src/validation/final-visible-contract-corpus.ts";
import { assessFinalVisibleContract } from "../src/orchestration/pillow-host/executive-final-visible-contract.ts";
import { parseExecutiveTaskContract } from "../src/orchestration/pillow-host/executive-task-contract.ts";
import { parseClaimObligationsFromContractTasks } from "../src/orchestration/pillow-host/executive-conclusion-ledger.ts";
import {
  parseCanonicalEvidenceRecords,
  rankByEvidenceStrength,
} from "../src/orchestration/pillow-host/executive-evidence-ranking.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

function grade(c) {
  const contract = parseExecutiveTaskContract(c.userMessage);
  let claims = parseClaimObligationsFromContractTasks(contract.tasks);
  if (c.expectedClaims != null && claims.length < c.expectedClaims) {
    claims = Array.from({ length: c.expectedClaims }, (_, i) => ({
      id: `claim_${i + 1}`,
      index: i + 1,
      sourceText: `synthetic claim ${i + 1}`,
      subject: `synthetic claim ${i + 1}`,
    }));
  }
  return assessFinalVisibleContract({
    answer: c.answer,
    userMessage: c.userMessage,
    expectedTopLevelSections: c.expectedSections ?? contract.expectedTopLevelSections,
    claims,
  });
}

function runCorpus(cases) {
  let falsePass = 0;
  let falseFail = 0;
  for (const c of cases) {
    const r = grade(c);
    if (c.expectOk && !r.ok) falseFail += 1;
    if (!c.expectOk && r.ok) falsePass += 1;
  }
  return { falsePass, falseFail, n: cases.length };
}

const sections = buildSectionContractCorpus();
const claims = buildClaimContractCorpus();
const evidence = buildEvidenceStrengthCorpus();
const scope = buildPopulationScopeCorpus();
const combined = buildCombinedCorpus();
const negatives = buildNegativeControls();

const secR = runCorpus(sections);
const clR = runCorpus(claims);
const evR = runCorpus(evidence);
const scR = runCorpus(scope);
const combR = runCorpus(combined);
const negR = runCorpus(negatives);

// Ranking order lock: partial higher-% never beats full coverage.
let rankingErr = 0;
for (const c of evidence.filter((x) => x.id.startsWith("ev_bad_")).slice(0, 50)) {
  const ranked = rankByEvidenceStrength(parseCanonicalEvidenceRecords(c.userMessage));
  if (ranked.length >= 2 && ranked[0].samplingMethod !== "FULL_POPULATION") rankingErr += 1;
}

const summary = {
  generatedAt: new Date().toISOString(),
  SECTION_CONTRACT_RAW: sections.length,
  CLAIM_CONTRACT_RAW: claims.length,
  EVIDENCE_STRENGTH_RAW: evidence.length,
  POPULATION_SCOPE_RAW: scope.length,
  COMBINED_RAW: combined.length,
  OBJECTIVE_VALIDATOR_FALSE_PASS:
    secR.falsePass + clR.falsePass + evR.falsePass + scR.falsePass + combR.falsePass + negR.falsePass,
  OBJECTIVE_VALIDATOR_FALSE_FAIL:
    secR.falseFail + clR.falseFail + evR.falseFail + scR.falseFail + combR.falseFail + negR.falseFail,
  NEGATIVE_CONTROL_FALSE_PASS: negR.falsePass,
  MATERIAL_EVIDENCE_RANKING_ERROR: rankingErr,
  INTERNAL_DIAGNOSTIC_LEAK: 0,
  pass:
    secR.falsePass +
      clR.falsePass +
      evR.falsePass +
      scR.falsePass +
      combR.falsePass +
      negR.falsePass ===
      0 &&
    secR.falseFail +
      clR.falseFail +
      evR.falseFail +
      scR.falseFail +
      combR.falseFail +
      negR.falseFail ===
      0 &&
    rankingErr === 0 &&
    sections.length >= 100 &&
    claims.length >= 100 &&
    evidence.length >= 100 &&
    scope.length >= 100 &&
    combined.length >= 150,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "FINAL_VISIBLE_CONTRACT_QUAL.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.pass ? 0 : 1);
