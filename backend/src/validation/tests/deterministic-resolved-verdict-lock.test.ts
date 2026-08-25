/**
 * Deterministic resolved-verdict lock — Harbour-class + judgment control spot checks.
 * Does not encode sealed examination content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCanonicalCaseState } from "../../orchestration/pillow-host/executive-canonical-state.js";
import { assessClaimAgainstCanonical } from "../../orchestration/pillow-host/executive-claim-proposition.js";
import {
  buildFinalVerdictObject,
  countLeftoverSupportedOverrides,
} from "../../orchestration/pillow-host/executive-final-verdict.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";

function explicitClaimVerdict(text: string, index = 1): string | null {
  const claimHdr = new RegExp(
    `Claim\\s*${index}\\b[\\s\\S]{0,500}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "i",
  );
  return claimHdr.exec(text)?.[1] || null;
}

describe("Deterministic resolved-verdict lock", () => {
  it("Harbour-class nothing-to-do-with + transfer facts → contradicted; polish locks Claim 1", () => {
    const claim =
      "Bench Quay's operator shortage has nothing to do with Bench Mesa because Quay itself never lost staff.";
    const pack = [
      "SyntheticVerdict-Lock — laboratory analysis only.",
      "Bench Mesa had a staffing shortage. Work was reassigned from Mesa to Quay.",
      "Quay operators were committed to the reassigned work. Quay's current operator shortage resulted from that commitment.",
      "Quay itself never lost staff to attrition.",
      `Assess this claim: ${claim}`,
    ].join("\n");

    const canonical = buildCanonicalCaseState(pack);
    const assessed = assessClaimAgainstCanonical(claim, canonical);
    assert.equal(assessed.overall, "contradicted");

    const locked = buildFinalVerdictObject("claim_1", claim, canonical);
    assert.equal(locked.resolutionStatus, "RESOLVED");
    assert.equal(locked.canonicalVerdict, "contradicted");

    const softDraft = [
      "### Conclusions",
      "Transfer path noted.",
      "**Verdict:** Supported",
      `"${claim}"`,
      "### Claim 1",
      "**Verdict:** Supported",
      `"${claim}"`,
    ].join("\n");
    const polished = polishFinalVisibleAnswer(softDraft, pack);
    assert.equal(explicitClaimVerdict(polished, 1)?.toLowerCase(), "contradicted");
    assert.equal(countLeftoverSupportedOverrides(polished), 0);
  });

  it("UNRESOLVED judgment control: generic preference claim does not force Contradicted", () => {
    const claim = "Flint Ridge presents the strongest overall case for investment.";
    const pack = [
      "SyntheticJudgment-Lock — generic preference only.",
      "Flint Ridge shows mixed signals: mild delay, partial upside, incomplete cost data.",
      "No eligibility registry, causal graph, or forecast reconciliation is provided.",
      `Assess this claim: ${claim}`,
    ].join("\n");

    const canonical = buildCanonicalCaseState(pack);
    const assessed = assessClaimAgainstCanonical(claim, canonical);
    const locked = buildFinalVerdictObject("claim_1", claim, canonical);

    assert.equal(locked.resolutionStatus, "UNRESOLVED");
    assert.notEqual(locked.canonicalVerdict, "contradicted");
    assert.notEqual(assessed.overall, "contradicted");
  });
});
