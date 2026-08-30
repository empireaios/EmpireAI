/**
 * Decision-state authority lock — Pioneer-class fragmentation.
 * Does not encode sealed examination content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDecisionCaseState,
  assessDecisionVisibilityConsistency,
  repairDecisionVisibility,
} from "../../orchestration/pillow-host/executive-decision-case-state.js";
import { buildCanonicalCaseState } from "../../orchestration/pillow-host/executive-canonical-state.js";
import { assessClaimAgainstCanonical } from "../../orchestration/pillow-host/executive-claim-proposition.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";

const PACK = [
  "SyntheticSelectOps — procurement only. Do not mention Mini Fan or Birth.",
  "Rule: supplier eligible only if ALL: total 3-month procurement cost <= S$450000; on-time delivery >= 94%; NO mandatory compliance approval pending.",
  "If exactly one eligible, select that supplier. If none eligible, do not select any. Future approval changes are reversal conditions only.",
  "FLINT: cost 360000 PASS; delivery 96% PASS; approval granted PASS.",
  "MAPLE: cost 380000 PASS; delivery 95% PASS; approval PENDING FAIL.",
  "OAK: cost 330000 PASS; delivery 93.5% FAIL; approval granted PASS.",
  "Answer in exactly 6 numbered sections.",
  "1. Snapshot",
  "2. Gate detail",
  "3. Eligible set",
  "4. Claim audit",
  "5. Recommendation",
  "6. Closing",
  "Audit these claims with explicit Verdict each:",
  '"MAPLE is already eligible because approval is pending."',
  '"At least two suppliers currently qualify."',
  '"OAK is currently eligible."',
].join("\n");

describe("Decision-state authority lock", () => {
  it("derives ELIGIBLE_SET={FLINT} and SELECT FLINT", () => {
    const d = buildDecisionCaseState(PACK)!;
    assert.deepEqual(d.eligibleSet, ["FLINT"]);
    assert.equal(d.recommendation.status, "SELECT");
    assert.equal(d.recommendation.selectedId, "FLINT");
    assert.equal(d.candidates.find((c) => c.displayName === "MAPLE")!.currentlyEligible, false);
    assert.equal(d.candidates.find((c) => c.displayName === "OAK")!.currentlyEligible, false);
  });

  it("pending≠eligible and count claims CONTRADICTED", () => {
    const can = buildCanonicalCaseState(PACK);
    assert.ok(can.decisionCase);
    assert.equal(
      assessClaimAgainstCanonical("MAPLE is already eligible because approval is pending.", can)
        .overall,
      "contradicted",
    );
    assert.equal(
      assessClaimAgainstCanonical("At least two suppliers currently qualify.", can).overall,
      "contradicted",
    );
    assert.equal(
      assessClaimAgainstCanonical("OAK is currently eligible.", can).overall,
      "contradicted",
    );
  });

  it("cross-section repair: detail FAIL + summary eligible + DO NOT SELECT", () => {
    const d = buildDecisionCaseState(PACK)!;
    const dirty = [
      "1. Snapshot",
      "FLINT passes all gates.",
      "2. Gate detail",
      "OAK delivery 93.5% → not eligible.",
      "3. Eligible set",
      "Eligible Suppliers: Flint and Oak.",
      "4. Claim audit",
      "MAPLE is already eligible because approval is pending.",
      "5. Recommendation",
      "DO NOT SELECT ANY YET.",
      "6. Closing",
      "Done.",
    ].join("\n");
    assert.equal(assessDecisionVisibilityConsistency(dirty, d).ok, false);
    const fixed = repairDecisionVisibility(dirty, d);
    assert.ok(!/Eligible Suppliers:.*\bOak\b/i.test(fixed));
    assert.ok(/SELECT FLINT/i.test(fixed));
    assert.ok(!/DO NOT SELECT ANY/i.test(fixed));
  });

  it("same-line peers and soft-correct inject DO NOT SELECT / SELECT", () => {
    const exact = buildDecisionCaseState(
      [
        "Rule: eligible if approval granted.",
        "ALPHA: approval granted PASS. BETA: approval PENDING FAIL.",
      ].join("\n"),
    )!;
    assert.deepEqual(exact.eligibleSet, ["ALPHA"]);
    const soft = repairDecisionVisibility(
      "1. Snapshot\nMaybe wait.\n2. Recommendation\nDefer for now.\n3. Closing\nOk.",
      exact,
    );
    assert.ok(/SELECT ALPHA/i.test(soft));

    const zero = buildDecisionCaseState(
      [
        "Rule: cost <= 300000; delivery >= 99%; approval granted.",
        "ASH: cost 360000 FAIL; delivery 96% FAIL; approval PENDING FAIL.",
        "ELM: cost 380000 FAIL; delivery 95% FAIL; approval PENDING FAIL.",
      ].join("\n"),
    )!;
    assert.equal(zero.recommendation.status, "DO_NOT_SELECT");
    const zfix = repairDecisionVisibility(
      "1. Snapshot\nBoth fail criteria.\n2. Recommendation\nConsider waiting.\n3. Closing\nOk.",
      zero,
    );
    assert.ok(/DO NOT SELECT ANY/i.test(zfix));
  });

  it("polish locks claim verdicts from decision case", () => {
    const draft = [
      "1. Snapshot",
      "Three suppliers considered.",
      "2. Gate detail",
      "OAK fails delivery.",
      "3. Eligible set",
      "Eligible Suppliers: Flint and Oak.",
      "4. Claim audit",
      "### Claim 1",
      "**Verdict:** Supported",
      '"MAPLE is already eligible because approval is pending."',
      "### Claim 2",
      "**Verdict:** Supported",
      '"At least two suppliers currently qualify."',
      "### Claim 3",
      "**Verdict:** Supported",
      '"OAK is currently eligible."',
      "5. Recommendation",
      "DO NOT SELECT ANY YET.",
      "6. Closing",
      "Done.",
    ].join("\n");
    const out = polishFinalVisibleAnswer(draft, PACK);
    assert.ok(/Contradict/i.test(out));
    assert.ok(!/Eligible Suppliers:\s*Flint and Oak/i.test(out));
  });
});
