import assert from "node:assert/strict";
import { describe, test, beforeEach } from "node:test";

import { buildFallbackEnterpriseGovernanceFramework } from "../../enterprise-governance-framework/assembler.js";
import { buildFallbackExecutiveConstitutionalMonitor } from "../../executive-constitutional-monitor/assembler.js";
import { buildFallbackEnterpriseAuditEngine } from "../../enterprise-audit-engine/assembler.js";
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleExecutiveComplianceEngine,
  buildFallbackExecutiveComplianceEngine,
  EXECUTIVE_COMPLIANCE_PIPELINE,
  COMPLIANCE_PRINCIPLES,
  GOVERNED_COMPLIANCE_DOMAINS,
  COMPLIANCE_ANALYSIS_DOMAINS,
  COMPLIANCE_POLICY_CATEGORIES,
  runComplianceEvaluation,
  getCompliancePolicyRegistry,
  getComplianceConfiguration,
  getViolationHistory,
  resetComplianceServiceForTesting,
} from "../../executive-compliance-engine/index.js";
import { resolveEnforcement } from "../../executive-compliance-engine/enforcement.js";
import { resetComplianceLogsForTesting } from "../../executive-compliance-engine/logging.js";

describe("E5-04 Executive Compliance Engine", () => {
  beforeEach(() => {
    resetComplianceServiceForTesting();
    resetComplianceLogsForTesting();
  });

  test("buildFallbackExecutiveComplianceEngine returns constitutional compliance model", () => {
    const view = buildFallbackExecutiveComplianceEngine();
    assert.equal(view.engineVersion, "E5-04");
    assert.equal(view.executiveCompliancePipeline.length, EXECUTIVE_COMPLIANCE_PIPELINE.length);
    assert.deepEqual(view.compliancePrinciples, [...COMPLIANCE_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_COMPLIANCE_DOMAINS.length);
    assert.ok(view.complianceRecords.length >= 10);
    assert.ok(view.complianceTrends.length >= GOVERNED_COMPLIANCE_DOMAINS.length);
    assert.ok(view.complianceAnalysis.length >= COMPLIANCE_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE505, true);
    assert.equal(view.criticalViolationCount, 0);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
    assert.ok(view.policyRegistry.length >= COMPLIANCE_POLICY_CATEGORIES.length);
    assert.ok(view.monitoringStatus);
    assert.ok(view.executiveReport);
    assert.ok(view.complianceScorecard);
    assert.ok(view.healthStatus);
    assert.ok(view.metrics);
  });

  test("assembleExecutiveComplianceEngine integrates E5-01 E5-02 E5-03", () => {
    const view = assembleExecutiveComplianceEngine({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
      enterpriseAuditEngine: buildFallbackEnterpriseAuditEngine(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-04" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-04");
    assert.ok(view.integrations.enterpriseGovernanceFramework.includes("E5-01"));
    assert.ok(view.integrations.executiveConstitutionalMonitor.includes("E5-02"));
    assert.ok(view.integrations.enterpriseAuditEngine.includes("E5-03"));
    assert.ok(view.complianceRecords.every((r) => r.complianceId && r.evidence.length >= 1));
    assert.equal(view.readyForE505, true);
  });

  test("compliance policy registry supports versioning enable disable and categories", () => {
    const policies = getCompliancePolicyRegistry();
    assert.ok(policies.length >= 10);
    assert.ok(policies.every((p) => p.policyId && p.version && p.owner));
    assert.ok(policies.some((p) => p.enabled));
    assert.ok(policies.some((p) => !p.enabled));
    const categories = new Set(policies.map((p) => p.category));
    assert.ok(categories.size >= COMPLIANCE_POLICY_CATEGORIES.length - 1);
  });

  test("evaluation engine returns PASS for compliant actions", () => {
    const result = runComplianceEvaluation({
      actor: "Grand King",
      action: "Approve governance framework update",
      actionType: "executive_action",
      context: { constitutional: true },
    });
    assert.equal(result.result, "PASS");
    assert.equal(result.violatedPolicyIds.length, 0);
    assert.ok(result.evaluationId);
    assert.ok(result.enforcement.allowed);
  });

  test("evaluation engine detects CRITICAL constitutional violations", () => {
    const result = runComplianceEvaluation({
      actor: "Unknown",
      action: "unconstitutional bypass_constitution override",
      actionType: "executive_action",
      context: { bypass_constitution: true },
    });
    assert.equal(result.result, "CRITICAL");
    assert.ok(result.violatedPolicyIds.includes("cpol-constitution-hierarchy"));
    assert.ok(result.enforcement.blocked || result.enforcement.effectiveMode === "hard_block");
  });

  test("enforcement modes escalate for critical violations", () => {
    const decision = resolveEnforcement("CRITICAL", "advisory");
    assert.equal(decision.effectiveMode, "hard_block");
    assert.equal(decision.blocked, true);
  });

  test("violation history captures non-compliant evaluations", () => {
    runComplianceEvaluation({
      actor: "Test",
      action: "create competing system duplicate_engine",
      actionType: "api_request",
      context: { duplicate_engine: true },
    });
    const history = getViolationHistory();
    assert.ok(history.length >= 1);
    assert.ok(history.some((h) => h.result === "VIOLATION" || h.result === "CRITICAL"));
  });

  test("configuration supports enforcement levels and scan frequency", () => {
    const config = getComplianceConfiguration();
    assert.ok(config.scanFrequencyMinutes >= 1);
    assert.ok(config.policyGroups.length >= 1);
    assert.equal(config.realTimeValidationEnabled, true);
  });
});
