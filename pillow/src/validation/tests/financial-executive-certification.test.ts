import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assembleFinancialExecutiveCertification,
  buildFallbackFinancialExecutiveCertification,
  FEC_CERTIFICATION_SCOPE,
  FEC_CERTIFICATION_GATES,
  FEC_CERTIFICATION_VALIDATIONS,
  FEC_AI_CFO_CAPABILITIES,
  FEC_WORKFLOW_VALIDATIONS,
  FEC_STRESS_TESTS,
} from "../../financial-executive-certification/index.js";

describe("E3-16 Financial Executive Certification", () => {
  test("buildFallbackFinancialExecutiveCertification certifies complete E3 programme", () => {
    const view = buildFallbackFinancialExecutiveCertification();
    assert.equal(view.architectureVersion, "E3-16");
    assert.equal(view.certificationScope.length, FEC_CERTIFICATION_SCOPE.length);
    assert.equal(view.certificationGates.length, FEC_CERTIFICATION_GATES.length);
    assert.equal(view.certificationValidations.length, FEC_CERTIFICATION_VALIDATIONS.length);
    assert.equal(view.programmeCertified, true);
    assert.equal(view.phaseE3Completed, true);
    assert.equal(view.allGatesPassed, true);
    assert.equal(view.gatesPassed, view.gatesTotal);
    assert.equal(view.criticalDefectCount, 0);
    assert.equal(view.readyForE401, true);
    assert.equal(view.nextMission, "E4-01 Executive Business Framework");
    assert.equal(view.certificationDecision, "CERTIFIED");
    assert.equal(view.e3CompletionPercentage, 100);
    assert.equal(view.executiveReadinessAssessment.aiCfoOperational, true);
    assert.equal(view.aiCfoCapabilityAssessment.length, FEC_AI_CFO_CAPABILITIES.length);
    assert.equal(view.workflowValidations.length, FEC_WORKFLOW_VALIDATIONS.length);
    assert.equal(view.stressTestResults.length, FEC_STRESS_TESTS.length);
    assert.ok(view.aiCfoCapabilityAssessment.every((c) => c.verified));
    assert.ok(view.workflowValidations.every((w) => w.verified));
    assert.ok(view.stressTestResults.every((s) => s.result === "PASS"));
  });

  test("assembleFinancialExecutiveCertification validates E3-01 through E3-15 integration", () => {
    const view = buildFallbackFinancialExecutiveCertification();
    assert.ok(view.certificationScope.every((s) => s.status === "certified"));
    assert.ok(view.certificationGates.every((g) => g.result === "PASS"));
    assert.ok(view.integrations.executiveFinanceFramework.includes("E3-01"));
    assert.ok(view.integrations.executivePerformanceDashboard.includes("E3-13"));
    assert.ok(view.integrations.executiveCapitalStrategy.includes("E3-15"));
    assert.equal(view.defects.length, 0);
  });
});
