import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assembleExecutiveIntelligenceCertification,
  buildFallbackExecutiveIntelligenceCertification,
  EIC_CERTIFICATION_SCOPE,
  EIC_CERTIFICATION_GATES,
  EIC_CERTIFICATION_VALIDATIONS,
  EIC_EXECUTIVE_CAPABILITIES,
} from "../../executive-intelligence-certification/index.js";

describe("E4-15 Executive Intelligence Certification", () => {
  test("buildFallbackExecutiveIntelligenceCertification returns constitutional certification model", () => {
    const view = buildFallbackExecutiveIntelligenceCertification();
    assert.equal(view.architectureVersion, "E4-15");
    assert.equal(view.certificationScope.length, EIC_CERTIFICATION_SCOPE.length);
    assert.equal(view.certificationGates.length, EIC_CERTIFICATION_GATES.length);
    assert.equal(view.certificationValidations.length, EIC_CERTIFICATION_VALIDATIONS.length);
    assert.ok(view.certificationScope.filter((s) => s.status === "certified").length >= 14);
    assert.equal(view.gatesTotal, 16);
    assert.equal(view.programmeCertified, true);
    assert.equal(view.phaseE4Completed, true);
    assert.equal(view.allGatesPassed, true);
    assert.equal(view.criticalDefectCount, 0);
    assert.equal(view.readyForE501, true);
    assert.equal(view.nextMission, "E5-01 Executive Governance Framework");
    assert.equal(view.executiveCapabilityAssessment.length, EIC_EXECUTIVE_CAPABILITIES.length);
    assert.ok(view.executiveCapabilityAssessment.every((c) => c.verified));
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
  });

  test("assembleExecutiveIntelligenceCertification integrates E4-01 through E4-14", () => {
    const view = buildFallbackExecutiveIntelligenceCertification();
    assert.ok(view.certificationScope.every((s) => s.status === "certified"));
    assert.ok(view.certificationGates.every((g) => g.result === "PASS"));
    assert.ok(view.integrations.marketIntelligenceEngine.includes("E4-01"));
    assert.ok(view.integrations.executiveIntelligenceDashboard.includes("E4-14"));
    assert.equal(view.defects.length, 0);
    assert.equal(assembleExecutiveIntelligenceCertification({}).gatesTotal, 16);
  });
});
