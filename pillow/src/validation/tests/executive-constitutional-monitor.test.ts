import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackEnterpriseGovernanceFramework } from "../../enterprise-governance-framework/assembler.js";
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleExecutiveConstitutionalMonitor,
  buildFallbackExecutiveConstitutionalMonitor,
  CONSTITUTIONAL_VALIDATION_PIPELINE,
  CONSTITUTIONAL_PRINCIPLES,
  GOVERNED_CONSTITUTIONAL_DOMAINS,
  CONSTITUTIONAL_ANALYSIS_DOMAINS,
} from "../../executive-constitutional-monitor/index.js";

describe("E5-02 Executive Constitutional Monitor", () => {
  test("buildFallbackExecutiveConstitutionalMonitor returns constitutional monitor model", () => {
    const view = buildFallbackExecutiveConstitutionalMonitor();
    assert.equal(view.engineVersion, "E5-02");
    assert.equal(view.constitutionalValidationPipeline.length, CONSTITUTIONAL_VALIDATION_PIPELINE.length);
    assert.deepEqual(view.constitutionalPrinciples, [...CONSTITUTIONAL_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_CONSTITUTIONAL_DOMAINS.length);
    assert.ok(view.constitutionalValidations.length >= 10);
    assert.ok(view.constitutionHealth.length >= GOVERNED_CONSTITUTIONAL_DOMAINS.length);
    assert.ok(view.executiveCompliance.length >= 1);
    assert.ok(view.constitutionStatus.length >= 5);
    assert.ok(view.constitutionalAnalysis.length >= CONSTITUTIONAL_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE503, true);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
  });

  test("assembleExecutiveConstitutionalMonitor integrates E5-01 governance framework", () => {
    const view = assembleExecutiveConstitutionalMonitor({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-02" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-02");
    assert.ok(view.integrations.enterpriseGovernanceFramework.includes("E5-01"));
    assert.ok(view.integrations.executiveIntelligenceProgramme.includes("E4"));
    assert.ok(view.integrations.executiveDecisionEngine.includes("E2"));
    assert.ok(view.constitutionalValidations.every((v) => v.validationId && v.executiveAction && v.evidence.length >= 1));
    assert.equal(view.readyForE503, true);
  });
});
