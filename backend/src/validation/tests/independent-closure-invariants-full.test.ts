/**
 * FULL CERTIFICATION GATE — interaction matrix + scale floors + change-impact automation.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INDEPENDENT_CLOSURE_INVARIANTS,
  CRITICAL_INVARIANT_PAIRS,
  buildCriticalInteractionMatrix,
  describeChangeImpact,
  requiredRegressionsForPaths,
  RAW_VARIANTS_PER_INVARIANT_MIN,
  CROSS_INVARIANT_CASES_MIN,
  PAIRWISE_INTERACTION_CASES_MIN,
} from "../../orchestration/pillow-host/independent-closure-invariants.js";

const SEMANTIC_TOUCHPOINTS = [
  "executive-canonical-state.ts",
  "executive-claim-proposition.ts",
  "executive-causal-state.ts",
  "executive-conclusion-ledger.ts",
  "executive-memory-relevance.ts",
  "executive-response-polish.ts",
  "executive-final-release.ts",
  "executive-task-contract.ts",
  "executive-scoped-reasoning.ts",
  "executive-decision-gate.ts",
];

describe("FULL CERTIFICATION GATE — scale floors", () => {
  it("mission scale constants are met by catalogue design", () => {
    assert.ok(INDEPENDENT_CLOSURE_INVARIANTS.length >= 25);
    assert.ok(RAW_VARIANTS_PER_INVARIANT_MIN >= 5);
    assert.ok(CROSS_INVARIANT_CASES_MIN >= 100);
    assert.ok(PAIRWISE_INTERACTION_CASES_MIN >= 100);
    assert.ok(CRITICAL_INVARIANT_PAIRS.length >= 20);
  });
});

describe("FULL CERTIFICATION GATE — interaction matrix", () => {
  it("critical pairs produce FIX_A_BREAKS_B matrix rows", () => {
    const results = new Map<string, boolean>();
    for (const [a, b] of CRITICAL_INVARIANT_PAIRS) {
      results.set(`${a}+${b}`, true);
    }
    const matrix = buildCriticalInteractionMatrix(results);
    assert.equal(matrix.length, CRITICAL_INVARIANT_PAIRS.length);
    for (const row of matrix) {
      assert.equal(row.testExists, true);
      assert.equal(row.pass, true);
      assert.match(row.failureClass, /^FIX_/);
    }
  });
});

describe("FULL CERTIFICATION GATE — change-impact automation", () => {
  it("every semantic touchpoint maps to required regressions", () => {
    for (const p of SEMANTIC_TOUCHPOINTS) {
      const row = describeChangeImpact(p);
      assert.ok(
        row.possibleAffected.length >= 1,
        `unmapped touchpoint: ${p}`,
      );
      assert.ok(row.requiredRegressions.length >= 1);
    }
    const union = requiredRegressionsForPaths(SEMANTIC_TOUCHPOINTS);
    assert.ok(union.includes("IC-03"));
    assert.ok(union.includes("IC-05"));
    assert.ok(union.includes("IC-20"));
  });
});
