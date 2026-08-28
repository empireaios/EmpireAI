/**
 * Final-visible contract lock tests — objective parser + evidence quality.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessFinalVisibleContract,
  stripInternalValidatorDiagnostics,
  countInternalValidatorDiagnostics,
} from "../../orchestration/pillow-host/executive-final-visible-contract.js";
import {
  classifyRankingObjective,
  parseCanonicalEvidenceRecords,
  rankByEvidenceStrength,
} from "../../orchestration/pillow-host/executive-evidence-ranking.js";
import { enforceExactSectionContract } from "../../orchestration/pillow-host/executive-section-contract.js";
import { parseExecutiveTaskContract } from "../../orchestration/pillow-host/executive-task-contract.js";
import { parseClaimObligationsFromContractTasks } from "../../orchestration/pillow-host/executive-conclusion-ledger.js";
import {
  buildNegativeControls,
  buildEvidenceStrengthCorpus,
} from "../final-visible-contract-corpus.js";

describe("Final visible contract lock", () => {
  it("strips Section contract diagnostic and never appends it via enforce", () => {
    const leak =
      "1. A\n2. B\n3. C\n4. D\n5. E\n6. F\n\n**Section contract:** 0 of 6 requested top-level numbered sections are visible; missing section numbers remain open rather than invented.";
    const stripped = stripInternalValidatorDiagnostics(leak);
    assert.equal(countInternalValidatorDiagnostics(stripped), 0);
    assert.equal(/section contract/i.test(stripped), false);
    const short = enforceExactSectionContract("1. A\n2. B", 6).message;
    assert.equal(/section contract/i.test(short), false);
  });

  it("rejects diagnostic tail even when sections 1–6 are present", () => {
    const userMessage =
      "Answer in exactly 6 numbered sections:\n1. Snapshot\n2. Ranking\n3. Scope\n4. Claims\n5. Rec\n6. Close";
    const answer =
      "1. Snapshot\n2. Ranking\n3. Scope\n4. Claims\n5. Rec\n6. Close\n\n**Section contract:** 0 of 6 requested top-level numbered sections are visible.";
    const r = assessFinalVisibleContract({
      answer,
      userMessage,
      expectedTopLevelSections: 6,
      claims: [],
    });
    assert.equal(r.ok, false);
    assert.ok(r.failures.includes("INTERNAL_DIAGNOSTIC_LEAK"));
  });

  it("28/40 @ higher % loses to 25/25 full population on evidence strength", () => {
    const pack = [
      "Rank by strength of fleet-wide evidence.",
      "Nereid:",
      "28 valid measured / 40 deployed",
      "8.5%.",
      "Pelican:",
      "25 valid measured / 25 deployed",
      "8%.",
    ].join("\n");
    assert.equal(classifyRankingObjective(pack), "EVIDENCE_STRENGTH");
    const rec = parseCanonicalEvidenceRecords(pack);
    assert.ok(rec.length >= 2);
    const nereid = rec.find((r) => /nereid/i.test(r.subject));
    const pelican = rec.find((r) => /pelican/i.test(r.subject));
    assert.ok(nereid && pelican);
    assert.notEqual(nereid!.samplingMethod, "FULL_POPULATION");
    assert.equal(pelican!.samplingMethod, "FULL_POPULATION");
    const ranked = rankByEvidenceStrength(rec);
    assert.equal(ranked[0]!.subject.toLowerCase(), "pelican");
    assert.ok(ranked[0]!.evidenceStrength > ranked[1]!.evidenceStrength);
  });

  it("objective validator false-pass and false-fail are zero on fixture set", () => {
    const negatives = buildNegativeControls();
    let falsePass = 0;
    for (const n of negatives) {
      const contract = parseExecutiveTaskContract(n.userMessage);
      let claims = parseClaimObligationsFromContractTasks(contract.tasks);
      if (n.expectedClaims != null && claims.length < n.expectedClaims) {
        claims = Array.from({ length: n.expectedClaims }, (_, i) => ({
          id: `claim_${i + 1}`,
          index: i + 1,
          sourceText: `synthetic claim ${i + 1}`,
          subject: `synthetic claim ${i + 1}`,
        }));
      }
      const r = assessFinalVisibleContract({
        answer: n.answer,
        userMessage: n.userMessage,
        expectedTopLevelSections: n.expectedSections ?? contract.expectedTopLevelSections,
        claims,
      });
      if (r.ok) falsePass += 1;
    }
    assert.equal(falsePass, 0);

    const goods = buildEvidenceStrengthCorpus().filter((c) => c.expectOk).slice(0, 20);
    let falseFail = 0;
    for (const g of goods) {
      const r = assessFinalVisibleContract({
        answer: g.answer,
        userMessage: g.userMessage,
        expectedTopLevelSections: null,
        claims: [],
      });
      if (!r.ok) falseFail += 1;
    }
    assert.equal(falseFail, 0);
  });
});
