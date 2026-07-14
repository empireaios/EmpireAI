import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackEnterpriseGovernanceFramework } from "../../enterprise-governance-framework/assembler.js";
import { buildFallbackExecutiveConstitutionalMonitor } from "../../executive-constitutional-monitor/assembler.js";
import { buildFallbackEnterpriseAuditEngine } from "../../enterprise-audit-engine/assembler.js";
import { buildFallbackExecutiveComplianceEngine } from "../../executive-compliance-engine/assembler.js";
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleExecutiveEthicsEngine,
  buildFallbackExecutiveEthicsEngine,
  EXECUTIVE_ETHICS_PIPELINE,
  ETHICS_PRINCIPLES,
  GOVERNED_ETHICS_DOMAINS,
  ETHICS_ANALYSIS_DOMAINS,
} from "../../executive-ethics-engine/index.js";

describe("E5-05 Executive Ethics Engine", () => {
  test("buildFallbackExecutiveEthicsEngine returns constitutional ethics model", () => {
    const view = buildFallbackExecutiveEthicsEngine();
    assert.equal(view.engineVersion, "E5-05");
    assert.equal(view.executiveEthicsPipeline.length, EXECUTIVE_ETHICS_PIPELINE.length);
    assert.deepEqual(view.ethicsPrinciples, [...ETHICS_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_ETHICS_DOMAINS.length);
    assert.ok(view.ethicalAssessments.length >= 10);
    assert.ok(view.ethicsTrends.length >= GOVERNED_ETHICS_DOMAINS.length);
    assert.ok(view.ethicsAnalysis.length >= ETHICS_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE506, true);
    assert.equal(view.criticalEthicalRiskCount, 0);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
  });

  test("assembleExecutiveEthicsEngine integrates E5-01 E5-02 E5-03 E5-04", () => {
    const view = assembleExecutiveEthicsEngine({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
      enterpriseAuditEngine: buildFallbackEnterpriseAuditEngine(),
      executiveComplianceEngine: buildFallbackExecutiveComplianceEngine(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-05" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-05");
    assert.ok(view.integrations.enterpriseGovernanceFramework.includes("E5-01"));
    assert.ok(view.integrations.executiveConstitutionalMonitor.includes("E5-02"));
    assert.ok(view.integrations.enterpriseAuditEngine.includes("E5-03"));
    assert.ok(view.integrations.executiveComplianceEngine.includes("E5-04"));
    assert.ok(view.ethicalAssessments.every((a) => a.assessmentId && a.evidence.length >= 1));
    assert.equal(view.readyForE506, true);
  });
});
