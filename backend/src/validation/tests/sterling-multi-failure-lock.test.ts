/**
 * Sterling multi-failure lock tests — structure, claims, evidence ranking.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";
import {
  assessSectionContract,
  extractRequestedSectionTitles,
} from "../../orchestration/pillow-host/executive-section-contract.js";
import { assessClaimCompletenessGate } from "../../orchestration/pillow-host/executive-conclusion-ledger.js";
import { parseExecutiveTaskContract } from "../../orchestration/pillow-host/executive-task-contract.js";
import { parseClaimObligationsFromContractTasks } from "../../orchestration/pillow-host/executive-conclusion-ledger.js";
import {
  classifyRankingObjective,
  parseCanonicalEvidenceRecords,
  rankByEvidenceStrength,
} from "../../orchestration/pillow-host/executive-evidence-ranking.js";

describe("Sterling multi-failure lock", () => {
  it("demotes nested ranking so exactly 6 top-level sections remain", () => {
    const pack = [
      "SyntheticLock-Struct — logistics analysis only. Do not mention Mini Fan or Birth.",
      "Answer in exactly six numbered sections:",
      "1. Snapshot",
      "2. Evidence-strength ranking (nest items)",
      "3. Population note",
      "4. Claim audit",
      "5. Recommendation",
      "6. Closing",
    ].join("\n");
    const draft = [
      "1. Snapshot body",
      "2. Ranking",
      "3. Apex",
      "4. Cove",
      "5. Basin",
      "6. Population",
      "7. Claims",
      "8. Recommend",
      "9. Close",
    ].join("\n");
    const out = polishFinalVisibleAnswer(draft, pack);
    const report = assessSectionContract(out, 6, extractRequestedSectionTitles(pack));
    assert.equal(report.visible, 6);
    assert.equal(report.nestedPromoted, 0);
    assert.equal(report.sequenceOk, true);
  });

  it("5 claims with only Claim 2 verdict become 5 explicit verdicts", () => {
    const pack = [
      "SyntheticLock-Claim — manufacturing analysis only. Do not mention Mini Fan or Birth.",
      "Audit these five claims separately with verdict and reason each:",
      '1. "Line Beta shortage has nothing to do with Line Alpha because Beta never lost staff."',
      '2. "Forecast equals realised for batch M9."',
      '3. "All 20 cells demonstrate the 8% yield gain."',
      '4. "Certificate CX-9 is currently blocked."',
      '5. "Completion for job J-4 never historically occurred."',
      "Line Alpha staffing shortage. Work reassigned to Line Beta. Beta shortage resulted. Beta never lost staff.",
      "Forecast for batch M9 was $50. Realised is $22.",
      "Exactly 8 of 20 cells received the upgrade.",
      "CX-9 is ACTIVE and currently authorised.",
      "Job J-4 was completed and recorded complete.",
    ].join("\n");
    const draft = [
      "### Claim 1",
      '"Line Beta shortage has nothing to do with Line Alpha because Beta never lost staff."',
      "### Claim 2",
      "**Verdict:** Supported",
      '"Forecast equals realised for batch M9."',
      "### Claim 3",
      '"All 20 cells demonstrate the 8% yield gain."',
      "### Claim 4",
      '"Certificate CX-9 is currently blocked."',
      "### Claim 5",
      '"Completion for job J-4 never historically occurred."',
    ].join("\n");
    const out = polishFinalVisibleAnswer(draft, pack);
    const contract = parseExecutiveTaskContract(pack);
    const obs = parseClaimObligationsFromContractTasks(contract.tasks);
    const gate = assessClaimCompletenessGate(out, obs);
    assert.equal(obs.length, 5);
    assert.equal(gate.ok, true);
    assert.equal((out.match(/\*\*Verdict:\*\*/gi) || []).length, 5);
    assert.match(out, /Claim\s*2[\s\S]{0,200}\*\*Verdict:\*\*\s*Contradicted/i);
  });

  it("evidence strength ranks full-population ahead of higher sample %", () => {
    const pack = [
      "SyntheticLock-Rank — retail analysis only. Do not mention Mini Fan or Birth.",
      "Rank stores from strongest to weakest CURRENT EVIDENCE BASE.",
      "Pine: verified full-population July audit, 240/240 jobs, 95.0%.",
      "Maple: verified full-population July audit, 180/180 jobs, 93.9%.",
      "Birch: random sample 60/300 jobs, 98.3% sample rate; no verified full-population rate.",
    ].join("\n");
    assert.equal(classifyRankingObjective(pack), "EVIDENCE_STRENGTH");
    const ranked = rankByEvidenceStrength(parseCanonicalEvidenceRecords(pack));
    assert.equal(ranked[0]?.subject, "Pine");
    assert.equal(ranked[1]?.subject, "Maple");
    assert.equal(ranked[2]?.subject, "Birch");
    assert.ok(
      ranked[2]?.samplingMethod === "SAMPLE" || ranked[2]?.samplingMethod === "PARTIAL",
      "incomplete coverage must not be FULL_POPULATION",
    );
  });
});
