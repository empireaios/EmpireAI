import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackEnterpriseGovernanceFramework } from "../../enterprise-governance-framework/assembler.js";
import { buildFallbackExecutiveConstitutionalMonitor } from "../../executive-constitutional-monitor/assembler.js";
import { buildFallbackEnterpriseAuditEngine } from "../../enterprise-audit-engine/assembler.js";
import { buildFallbackExecutiveComplianceEngine } from "../../executive-compliance-engine/assembler.js";
import { buildFallbackExecutiveEthicsEngine } from "../../executive-ethics-engine/assembler.js";
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleExecutiveAccountabilityEngine,
  buildFallbackExecutiveAccountabilityEngine,
  EXECUTIVE_ACCOUNTABILITY_PIPELINE,
  ACCOUNTABILITY_PRINCIPLES,
  GOVERNED_ACCOUNTABILITY_DOMAINS,
  ACCOUNTABILITY_ANALYSIS_DOMAINS,
} from "../../executive-accountability-engine/index.js";

describe("E5-06 Executive Accountability Engine", () => {
  test("buildFallbackExecutiveAccountabilityEngine returns constitutional accountability model", () => {
    const view = buildFallbackExecutiveAccountabilityEngine();
    assert.equal(view.engineVersion, "E5-06");
    assert.equal(view.executiveAccountabilityPipeline.length, EXECUTIVE_ACCOUNTABILITY_PIPELINE.length);
    assert.deepEqual(view.accountabilityPrinciples, [...ACCOUNTABILITY_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_ACCOUNTABILITY_DOMAINS.length);
    assert.ok(view.executiveOwnership.length >= 10);
    assert.ok(view.decisionTraceability.length >= 9);
    assert.ok(view.authorityChain.length >= 9);
    assert.ok(view.responsibilityMatrix.length >= 10);
    assert.ok(view.accountabilityAnalysis.length >= ACCOUNTABILITY_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE507, true);
    assert.equal(view.ownerlessActionCount, 0);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
  });

  test("assembleExecutiveAccountabilityEngine integrates E5-01 E5-02 E5-03 E5-04 E5-05", () => {
    const view = assembleExecutiveAccountabilityEngine({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
      enterpriseAuditEngine: buildFallbackEnterpriseAuditEngine(),
      executiveComplianceEngine: buildFallbackExecutiveComplianceEngine(),
      executiveEthicsEngine: buildFallbackExecutiveEthicsEngine(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-06" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-06");
    assert.ok(view.integrations.enterpriseGovernanceFramework.includes("E5-01"));
    assert.ok(view.integrations.executiveConstitutionalMonitor.includes("E5-02"));
    assert.ok(view.integrations.enterpriseAuditEngine.includes("E5-03"));
    assert.ok(view.integrations.executiveComplianceEngine.includes("E5-04"));
    assert.ok(view.integrations.executiveEthicsEngine.includes("E5-05"));
    assert.ok(view.executiveOwnership.every((r) => r.accountabilityId && r.evidence.length >= 1));
    assert.equal(view.readyForE507, true);
  });
});
