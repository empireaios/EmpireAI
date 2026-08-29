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
import {
  assessVisibleContractEnvelope,
  enforceVisibleContractEnvelope,
} from "../../orchestration/pillow-host/executive-final-visible-contract.js";

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

  it("IC-03 bare Assess: cue extracts quoted and newline propositions", () => {
    const quoted = [
      "Synthetic. Do not mention Mini Fan or Birth.",
      'Assess: "B shortage has no causal relationship to A because B never had X."',
    ].join("\n");
    const bareNl = [
      "Synthetic. Do not mention Mini Fan or Birth.",
      "Assess:",
      "B shortage has no causal relationship to A because B never had X.",
    ].join("\n");
    assert.ok(extractQuotedClaimsOnly(quoted).length >= 1, "quoted Assess:");
    assert.ok(extractQuotedClaimsOnly(bareNl).length >= 1, "newline Assess:");
  });

  it("IC-03 causal grades: DIRECT / INDIRECT / COMMON_ROOT / UNRELATED", () => {
    const pack = [
      "North directly caused FailureA. FailureA triggered failover to East. East then overloaded PeerNode.",
      "North never shared a common root with PeerNode beyond the cascade.",
      "Assess claims.",
    ].join("\n");
    const can = buildCanonicalCaseState(pack);
    const direct = "North's failure directly caused PeerNode's overload.";
    const unrelated =
      "PeerNode is unrelated to North because PeerNode did not suffer the original failure.";
    const sameRoot = "North and PeerNode share the same root cause.";
    const connected = "North and PeerNode are causally connected.";
    assert.ok(decomposeClaimPropositions(direct).some((p) => p.kind === "causal_direct_cause"));
    assert.ok(decomposeClaimPropositions(unrelated).some((p) => p.kind === "causal_unrelated"));
    assert.equal(assessClaimAgainstCanonical(direct, can).overall, "contradicted", "DIRECT");
    assert.equal(assessClaimAgainstCanonical(unrelated, can).overall, "contradicted", "UNRELATED");
    assert.equal(assessClaimAgainstCanonical(sameRoot, can).overall, "contradicted", "COMMON_ROOT");
    assert.ok(decomposeClaimPropositions(connected).some((p) => p.kind === "causal_connected"));
    assert.equal(assessClaimAgainstCanonical(connected, can).overall, "supported", "INDIRECT");
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

  it("IC-16/22 visible contract envelope: no unrequested pre/post semantic blocks", () => {
    const pack =
      "SyntheticEnv — ops only. Answer in exactly 5 numbered sections.\n1. A\n2. B\n3. C\n4. D\n5. E";
    const body = [1, 2, 3, 4, 5].map((n) => `${n}. Section ${n}\nBody.`).join("\n\n");
    const dirty =
      "Recommendation: Validate performance / evidence first, then scale only what clears constitutional and commercial thresholds.\n\n" +
      body +
      "\n\n### Risk / lesson\nGeneric failover doctrine.";
    const enf = enforceVisibleContractEnvelope(dirty, 5, pack);
    const env = assessVisibleContractEnvelope(enf.message, 5, pack);
    assert.equal(env.failures.length, 0);
    assert.ok(!/^Recommendation:/im.test(enf.message));
    assert.ok(!/### Risk \/ lesson/i.test(enf.message));
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
