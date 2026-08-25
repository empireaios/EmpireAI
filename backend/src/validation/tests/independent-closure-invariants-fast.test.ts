/**
 * FAST INVARIANT GATE — cheap development gate for high-risk regressions.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractQuotedClaimsOnly,
  buildCanonicalCaseState,
} from "../../orchestration/pillow-host/executive-canonical-state.js";
import {
  assessClaimAgainstCanonical,
  decomposeClaimPropositions,
} from "../../orchestration/pillow-host/executive-claim-proposition.js";
import {
  CRITICAL_INVARIANT_PAIRS,
  INDEPENDENT_CLOSURE_INVARIANTS,
  changeImpactForFile,
  describeChangeImpact,
} from "../../orchestration/pillow-host/independent-closure-invariants.js";
import {
  stripUnmappedVisibleDoctrine,
  validateVisibleBlockRelevance,
} from "../../orchestration/pillow-host/executive-memory-relevance.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";

const APEX =
  /A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred/i;

describe("FAST INVARIANT GATE", () => {
  it("catalog has >=25 invariants", () => {
    assert.ok(INDEPENDENT_CLOSURE_INVARIANTS.length >= 25);
  });

  it("critical interaction pairs defined", () => {
    assert.ok(CRITICAL_INVARIANT_PAIRS.length >= 10);
  });

  it("IC-03 soft claim extracts after assess newline", () => {
    const soft = [
      "Line A.",
      "",
      "Assess this claim:",
      "B shortage has no causal relationship to A because B never had X.",
    ].join("\n");
    assert.ok(extractQuotedClaimsOnly(soft).length >= 1);
  });

  it("IC-03 causal_unrelated assesses contradicted on transfer path", () => {
    const claim =
      "North shortage has no causal relationship to South because North never had seal failure.";
    const pack = [
      "South had seal failure.",
      "Work transferred to North.",
      "North has shortage from that transfer.",
      "North never had seal failure.",
      `Assess this claim:\n${claim}`,
    ].join("\n");
    const props = decomposeClaimPropositions(claim);
    assert.ok(props.some((p) => p.kind === "causal_unrelated"));
    const can = buildCanonicalCaseState(pack);
    assert.equal(assessClaimAgainstCanonical(claim, can).overall, "contradicted");
  });

  it("IC-20 irrelevant doctrine strips when no refund obligation", () => {
    const pack =
      "SyntheticFast — ops only. Node eligible. No refund. Do not mention Mini Fan or Birth.";
    const dirty = `Eligible.\n\nA later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred.`;
    const stripped = stripUnmappedVisibleDoctrine(dirty, pack);
    assert.ok(stripped.stripped || !APEX.test(stripped.message));
    const v = validateVisibleBlockRelevance(dirty, pack);
    assert.equal(v.UNMAPPED_VISIBLE_DOCTRINE, 0);
    const polished = polishFinalVisibleAnswer(dirty, pack);
    assert.ok(!APEX.test(polished));
  });

  it("change-impact mapping covers claim and memory modules", () => {
    const a = describeChangeImpact("executive-canonical-state.ts");
    assert.ok(a.possibleAffected.includes("IC-03"));
    assert.ok(a.requiredRegressions.length >= 1);
    const b = changeImpactForFile("executive-memory-relevance.ts");
    assert.ok(b.includes("IC-20"));
  });
});
