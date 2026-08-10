import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GRAND_KING_WORKSPACE_ID } from "../../grand-king/constants.js";
import { buildPortfolioControlPlaneSnapshot } from "../../orchestration/pillow-commissioning/portfolio-control-plane.js";
import { assessPostLaunchCommercialDeviations } from "../../orchestration/pillow-commissioning/post-launch-commercial-deviation.js";

describe("Mission 007 portfolio control plane", () => {
  it("builds exception-driven snapshot without inventing LIVE monitoring cost", () => {
    const snap = buildPortfolioControlPlaneSnapshot(GRAND_KING_WORKSPACE_ID);
    assert.equal(snap.architecture, "EXCEPTION_DRIVEN_CONTROL_PLANE");
    assert.equal(snap.corridor.supplier, "CJdropshipping");
    assert.equal(snap.corridor.marketplace, "Amazon US");
    assert.ok(snap.monitoringTiers.UNKNOWN);
    assert.match(snap.staleDataPolicy, /never be labelled healthy|MONITORING UNKNOWN/i);
    assert.equal(snap.costMeasurement.status, "UNKNOWN");
    assert.ok(Array.isArray(snap.aggregatedExceptions));
  });

  it("post-launch deviation assessment does not hard-code price cuts", () => {
    const assessment = assessPostLaunchCommercialDeviations(GRAND_KING_WORKSPACE_ID);
    assert.ok(assessment.forbiddenHardCodedAdvice.some((a) => /lower price/i.test(a)));
    assert.ok(assessment.diagnosisChecklist.includes("BUYABLE status"));
    assert.ok(assessment.allowedOutcomes.includes("continue observing"));
    assert.ok(assessment.allowedOutcomes.includes("escalate to Grand King"));
    if (assessment.publishedListings === 0) {
      assert.equal(assessment.deviations.length, 0);
    }
  });
});
