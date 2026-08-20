/**
 * Decision-gate propagation — atomic (≥100) + paired/multi.
 * CLEARING ONE BLOCKER ≠ DECISION UNLOCK. ELIGIBLE ≠ BEST.
 * Does not encode sealed examination content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyConstraintSupersession,
  assessScaleEligibility,
  buildActionEligibilityStates,
  evaluateEvidenceGateImpact,
  extractMaterialConstraints,
  synthesizeNextEvidenceDecisionImpact,
  synthesizeReversalConditions,
  ensureRecommendationConstraintConsistency,
} from "../../orchestration/pillow-host/executive-decision-constraints.js";
import { buildCanonicalCaseState } from "../../orchestration/pillow-host/executive-canonical-state.js";

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

const GATE_SNIPPETS = [
  { cls: "PERFORMANCE_THRESHOLD", fail: "performance is below the threshold", clear: "performance now meets the threshold" },
  { cls: "EXPENDITURE_CEILING", fail: "expenditure exceeds the approved ceiling", clear: "expenditure now within the approved ceiling" },
  { cls: "AUTHORITY_RESTRICTION", fail: "safety authorization missing", clear: "safety authorization obtained" },
  { cls: "CASH_CONSTRAINT", fail: "budget compatibility fails", clear: "expenditure now within the approved ceiling" },
  { cls: "INSUFFICIENT_EVIDENCE", fail: "insufficient operating evidence", clear: "sufficient operating evidence verified" },
  { cls: "NEGATIVE_UNIT_ECONOMICS", fail: "negative unit economics", clear: "contribution is now positive after verified repair" },
  { cls: "CAPACITY_LIMIT", fail: "capacity limited to 90 transactions/week", clear: "Verified capacity expansion resolved the limit." },
  { cls: "INVESTMENT_JUSTIFICATION", fail: "expansion requires additional fixed investment", clear: "ROI of the investment is verified acceptable." },
] as const;

describe("Decision-gate propagation — atomic 100/100", () => {
  it("randomized multi-gate matrix 100/100", () => {
    let pass = 0;
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(9000 + i);
      const mode = i % 11;
      let ok = false;

      if (mode === 0) {
        // 1 gate / 1 fail
        const g = pick(rng, GATE_SNIPPETS);
        const c = extractMaterialConstraints(`Synthetic: ${g.fail}.`);
        const el = assessScaleEligibility(c);
        ok = el.blockedBy.length === 1 && el.scaleEligible === false;
      } else if (mode === 1) {
        // 2 gates / 1 fail (one already cleared language)
        const a = GATE_SNIPPETS[0]!;
        const b = GATE_SNIPPETS[1]!;
        let c = extractMaterialConstraints(`Synthetic: ${a.fail}; ${b.fail}.`);
        c = applyConstraintSupersession(c, a.clear);
        const el = assessScaleEligibility(c);
        ok =
          el.scaleEligible === false &&
          el.cleared.some((x) => x.id === "performance") &&
          el.blockedBy.some((x) => x.id === "expenditure");
      } else if (mode === 2) {
        // 2 gates / 2 fails
        const c = extractMaterialConstraints(
          "Synthetic: performance is below the threshold; expenditure exceeds the approved ceiling.",
        );
        const el = assessScaleEligibility(c);
        ok = el.blockedBy.length >= 2 && el.scaleEligible === false;
      } else if (mode === 3) {
        // 3 gates / combinations
        const bits = [
          pick(rng, GATE_SNIPPETS).fail,
          pick(rng, GATE_SNIPPETS).fail,
          pick(rng, GATE_SNIPPETS).fail,
        ];
        const c = extractMaterialConstraints(`Synthetic: ${[...new Set(bits)].join("; ")}.`);
        const el = assessScaleEligibility(c);
        ok = el.blockedBy.length >= 1 && el.scaleEligible === false;
      } else if (mode === 4) {
        // one new evidence clears only one of two blockers
        const baseAsk =
          "Candidate B requires: performance >= threshold; expenditure <= approved ceiling. Both currently fail.";
        let c = extractMaterialConstraints(baseAsk);
        c = applyConstraintSupersession(c, "performance now meets the threshold");
        const el = assessScaleEligibility(c);
        const primary = buildActionEligibilityStates(baseAsk)[0]!;
        const impact = evaluateEvidenceGateImpact(
          primary,
          "verify improved performance meeting the threshold",
        );
        ok =
          el.scaleEligible === false &&
          el.blockedBy.some((g) => g.id === "expenditure") &&
          impact.wouldChangeDecisionEligibility === false &&
          impact.gatesRemaining.some((g) => g.id === "expenditure");
      } else if (mode === 5) {
        // one evidence clears final blocker
        let c = extractMaterialConstraints(
          "Synthetic: performance is below the threshold; expenditure exceeds the approved ceiling.",
        );
        c = applyConstraintSupersession(c, "performance now meets the threshold");
        c = applyConstraintSupersession(c, "expenditure now within the approved ceiling");
        const el = assessScaleEligibility(c);
        ok = el.scaleEligible === true && el.blockedBy.length === 0;
      } else if (mode === 6) {
        // all gates pass but not comparatively best
        const pack = [
          "Candidate C: safety authorization obtained; budget compatibility cleared; sufficient operating evidence verified.",
          "Even if eligible, comparative evidence does not justify Candidate C.",
          "What would make you reverse toward Candidate C?",
        ].join("\n");
        const actions = buildActionEligibilityStates(pack);
        const c = actions.find((a) => a.actionId === "candidate_c") ?? actions[0]!;
        const rev = synthesizeReversalConditions(c);
        ok =
          /\bELIGIBILITY|comparatively|preferable|PASS\b/i.test(rev) &&
          (c.comparativelyPreferred === false || /ELIGIBLE ≠ BEST|comparative/i.test(rev));
      } else if (mode === 7) {
        // authority + financial
        const c = extractMaterialConstraints(
          "Synthetic: safety authorization missing; expenditure exceeds the approved ceiling.",
        );
        const el = assessScaleEligibility(c);
        ok =
          el.blockedBy.some((g) => g.id === "authority") &&
          el.blockedBy.some((g) => g.id === "expenditure" || g.id === "cash");
      } else if (mode === 8) {
        // performance + budget
        const c = extractMaterialConstraints(
          "Synthetic: performance is below the threshold; budget compatibility fails.",
        );
        const el = assessScaleEligibility(c);
        ok =
          el.blockedBy.some((g) => g.id === "performance") &&
          el.blockedBy.some((g) => g.id === "cash" || g.id === "expenditure");
      } else if (mode === 9) {
        // capacity + safety + economics
        const c = extractMaterialConstraints(
          "Synthetic: capacity limited to 80/week; safety authorization missing; negative unit economics.",
        );
        const el = assessScaleEligibility(c);
        ok = el.blockedBy.length >= 3;
      } else {
        // next-evidence synthesizer names remaining gates
        const ask = [
          "Candidate B requires: performance >= threshold; expenditure <= approved ceiling.",
          "Both currently fail.",
          "What new evidence could CHANGE the recommendation?",
        ].join(" ");
        const actions = buildActionEligibilityStates(ask);
        const primary = actions[0]!;
        const ans = synthesizeNextEvidenceDecisionImpact(primary, ask);
        ok =
          /CLEARING ONE BLOCKER|No single evidence|REMAINING_GATES|still remain/i.test(ans) &&
          /performance/i.test(ans) &&
          /expenditure/i.test(ans) &&
          primary.currentlyEligible === false;
      }

      if (ok) pass += 1;
      else assert.fail(`atomic seed=${i} mode=${mode} failed`);
    }
    assert.equal(pass, 100);
  });

  it("canonical state carries decisionActions", () => {
    const pack = [
      "Candidate B requires: performance >= threshold; expenditure <= approved ceiling.",
      "Both currently fail.",
      "What new evidence could CHANGE the recommendation?",
    ].join("\n");
    const state = buildCanonicalCaseState(pack);
    assert.ok(state.decisionActions.length >= 1);
    const b = state.decisionActions.find((a) => a.actionId === "candidate_b") ?? state.decisionActions[0]!;
    assert.equal(b.currentlyEligible, false);
    assert.ok(b.requiredGates.filter((g) => g.status !== "PASS").length >= 2);
  });

  it("single-gate unlock draft is repaired on decision-change ask", () => {
    const ask = [
      "Candidate B requires: performance >= threshold; expenditure <= approved ceiling.",
      "Both currently fail.",
      "What new evidence could CHANGE the recommendation?",
    ].join("\n");
    const draft =
      "### Recommendation\nVerify improved performance — that would change the recommendation toward Candidate B.";
    const c = extractMaterialConstraints(ask);
    const fixed = ensureRecommendationConstraintConsistency(draft, c, ask);
    assert.equal(fixed.repaired, true);
    assert.match(fixed.message, /CLEARING ONE BLOCKER|REMAINING_GATES|still remain|expenditure/i);
  });
});

describe("Decision-gate propagation — paired / multi-variable", () => {
  it("paired: financial + multi-gate next evidence", () => {
    const ask = [
      "Synthetic finance analysis.",
      "Negative unit economics; capacity limited to 100/week.",
      "Forecast $4000; realised $600.",
      "What new evidence could CHANGE the recommendation to scale?",
    ].join("\n");
    const actions = buildActionEligibilityStates(ask);
    const ans = synthesizeNextEvidenceDecisionImpact(actions[0]!, ask);
    assert.match(ans, /CLEARING ONE BLOCKER|No single evidence|REMAINING_GATES|still remain/i);
    assert.equal(actions[0]!.currentlyEligible, false);
  });

  it("multi: authority + budget + operating evidence reversal", () => {
    const ask = [
      "Candidate C requires: safety authorization; budget compatibility; sufficient operating evidence.",
      "Authorization missing; budget compatibility fails; operating evidence insufficient.",
      "What would make you reverse toward Candidate C?",
    ].join("\n");
    const actions = buildActionEligibilityStates(ask);
    const c = actions.find((a) => a.actionId === "candidate_c") ?? actions[0]!;
    const rev = synthesizeReversalConditions(c);
    assert.match(rev, /authority|safety/i);
    assert.match(rev, /cash|budget|expenditure|evidence/i);
    assert.match(rev, /comparatively|ELIGIBILITY|preferable/i);
    assert.ok(c.requiredGates.filter((g) => g.status !== "PASS").length >= 2);
  });

  it("eligibility distinct from preference when all gates clear", () => {
    const ask = [
      "Candidate A: performance now meets the threshold; expenditure now within the approved ceiling.",
      "Even if eligible, comparative evidence does not justify Candidate A as best.",
    ].join("\n");
    const actions = buildActionEligibilityStates(ask);
    const a = actions.find((x) => x.actionId === "candidate_a") ?? actions[0]!;
    // May be eligible if supersession applied via extract on positive language only —
    // preference note must still separate ELIGIBLE from BEST.
    const note = a.preferenceNote ?? "";
    assert.match(
      `${note} ${synthesizeReversalConditions(a)}`,
      /ELIGIBLE|comparative|preferable|BEST/i,
    );
  });
});
