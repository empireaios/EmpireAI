import assert from "node:assert/strict";
import { describe, test, beforeEach } from "node:test";

import { buildFallbackEnterpriseGovernanceFramework } from "../../enterprise-governance-framework/assembler.js";
import { buildFallbackExecutiveConstitutionalMonitor } from "../../executive-constitutional-monitor/assembler.js";
import { buildFallbackEnterpriseAuditEngine } from "../../enterprise-audit-engine/assembler.js";
import { buildFallbackExecutiveComplianceEngine } from "../../executive-compliance-engine/assembler.js";
import { buildFallbackExecutiveEthicsEngine } from "../../executive-ethics-engine/assembler.js";
import { buildFallbackExecutiveAccountabilityEngine } from "../../executive-accountability-engine/assembler.js";
import { buildFallbackExecutiveTransparencyEngine } from "../../executive-transparency-engine/assembler.js";
import { buildFallbackExecutiveExceptionManager } from "../../executive-exception-manager/assembler.js";
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleEnterpriseRiskGovernance,
  buildFallbackEnterpriseRiskGovernance,
  ENTERPRISE_RISK_PIPELINE,
  RISK_GOVERNANCE_PRINCIPLES,
  GOVERNED_RISK_CATEGORIES,
  RISK_ANALYSIS_DOMAINS,
  getRiskConfiguration,
  resetRiskServiceForTesting,
} from "../../enterprise-risk-governance/index.js";

describe("E5-09 Enterprise Risk Governance", () => {
  beforeEach(() => {
    resetRiskServiceForTesting();
  });

  test("buildFallbackEnterpriseRiskGovernance returns constitutional risk model", () => {
    const view = buildFallbackEnterpriseRiskGovernance();
    assert.equal(view.engineVersion, "E5-09");
    assert.equal(view.enterpriseRiskPipeline.length, ENTERPRISE_RISK_PIPELINE.length);
    assert.deepEqual(view.riskGovernancePrinciples, [...RISK_GOVERNANCE_PRINCIPLES]);
    assert.equal(view.governedCategories.length, GOVERNED_RISK_CATEGORIES.length);
    assert.ok(view.enterpriseRiskRegister.length >= 10);
    assert.ok(view.criticalRisks.length >= 1);
    assert.ok(view.riskHeatMap.length >= 10);
    assert.ok(view.mitigationProgress.length >= 1);
    assert.ok(view.riskTrends.length >= 4);
    assert.ok(view.executiveOwnership.length >= 10);
    assert.ok(view.riskAnalysis.length >= RISK_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE510, true);
    assert.equal(view.unmanagedCriticalCount, 0);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
    assert.ok(view.monitoringStatus);
    assert.ok(view.executiveReport);
    assert.ok(view.metrics);
    assert.ok(view.healthStatus);
  });

  test("assembleEnterpriseRiskGovernance integrates E5-01 through E5-08", () => {
    const view = assembleEnterpriseRiskGovernance({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
      enterpriseAuditEngine: buildFallbackEnterpriseAuditEngine(),
      executiveComplianceEngine: buildFallbackExecutiveComplianceEngine(),
      executiveEthicsEngine: buildFallbackExecutiveEthicsEngine(),
      executiveAccountabilityEngine: buildFallbackExecutiveAccountabilityEngine(),
      executiveTransparencyEngine: buildFallbackExecutiveTransparencyEngine(),
      executiveExceptionManager: buildFallbackExecutiveExceptionManager(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-09" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-09");
    assert.ok(view.integrations.enterpriseGovernanceFramework.includes("E5-01"));
    assert.ok(view.integrations.executiveConstitutionalMonitor.includes("E5-02"));
    assert.ok(view.integrations.enterpriseAuditEngine.includes("E5-03"));
    assert.ok(view.integrations.executiveComplianceEngine.includes("E5-04"));
    assert.ok(view.integrations.executiveEthicsEngine.includes("E5-05"));
    assert.ok(view.integrations.executiveAccountabilityEngine.includes("E5-06"));
    assert.ok(view.integrations.executiveTransparencyEngine.includes("E5-07"));
    assert.ok(view.integrations.executiveExceptionManager.includes("E5-08"));
    assert.ok(view.enterpriseRiskRegister.every((r) => r.riskId && r.evidence.length >= 1));
    assert.equal(view.readyForE510, true);
  });

  test("every enterprise risk has executive ownership and mitigation", () => {
    const view = buildFallbackEnterpriseRiskGovernance();
    assert.ok(view.enterpriseRiskRegister.every((r) => r.owner && r.mitigationPlan));
    assert.ok(view.executiveOwnership.every((o) => o.owner));
  });

  test("critical risks have mitigation plans", () => {
    const view = buildFallbackEnterpriseRiskGovernance();
    const critical = view.enterpriseRiskRegister.filter((r) => r.severity === "critical");
    assert.ok(critical.every((r) => r.mitigationPlan.length > 0));
    assert.equal(view.unmanagedCriticalCount, 0);
  });

  test("risk configuration supports governance settings", () => {
    const config = getRiskConfiguration();
    assert.equal(config.criticalMitigationRequired, true);
    assert.ok(config.executiveReviewIntervalDays >= 1);
  });

  test("risk heat map computes exposure scores", () => {
    const view = buildFallbackEnterpriseRiskGovernance();
    assert.ok(view.riskHeatMap.every((h) => h.exposureScore >= 0 && h.exposureScore <= 100));
  });
});
