import assert from "node:assert/strict";
import { describe, test, beforeEach } from "node:test";

import { buildFallbackEnterpriseGovernanceFramework } from "../../enterprise-governance-framework/assembler.js";
import { buildFallbackExecutiveConstitutionalMonitor } from "../../executive-constitutional-monitor/assembler.js";
import { buildFallbackEnterpriseAuditEngine } from "../../enterprise-audit-engine/assembler.js";
import { buildFallbackExecutiveComplianceEngine } from "../../executive-compliance-engine/assembler.js";
import { buildFallbackExecutiveEthicsEngine } from "../../executive-ethics-engine/assembler.js";
import { buildFallbackExecutiveAccountabilityEngine } from "../../executive-accountability-engine/assembler.js";
import { buildFallbackExecutiveTransparencyEngine } from "../../executive-transparency-engine/assembler.js";
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleExecutiveExceptionManager,
  buildFallbackExecutiveExceptionManager,
  EXECUTIVE_EXCEPTION_PIPELINE,
  EXCEPTION_PRINCIPLES,
  GOVERNED_EXCEPTION_DOMAINS,
  EXCEPTION_ANALYSIS_DOMAINS,
  runExceptionRegistration,
  runExceptionApproval,
  runExceptionResolution,
  getExceptionPolicyRegistry,
  getExceptionAuditHistory,
  resetExceptionServiceForTesting,
} from "../../executive-exception-manager/index.js";
import { resetExceptionAuditForTesting } from "../../executive-exception-manager/audit-logging.js";

describe("E5-08 Executive Exception Manager", () => {
  beforeEach(() => {
    resetExceptionServiceForTesting();
    resetExceptionAuditForTesting();
  });

  test("buildFallbackExecutiveExceptionManager returns constitutional exception model", () => {
    const view = buildFallbackExecutiveExceptionManager();
    assert.equal(view.engineVersion, "E5-08");
    assert.equal(view.executiveExceptionPipeline.length, EXECUTIVE_EXCEPTION_PIPELINE.length);
    assert.deepEqual(view.exceptionPrinciples, [...EXCEPTION_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_EXCEPTION_DOMAINS.length);
    assert.ok(view.exceptionRecords.length >= 5);
    assert.ok(view.activeExceptions.length >= 1);
    assert.ok(view.exceptionTimeline.length >= 4);
    assert.ok(view.expirationSchedule.length >= 1);
    assert.ok(view.exceptionAnalysis.length >= EXCEPTION_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE509, true);
    assert.equal(view.unauthorizedExceptionCount, 0);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
    assert.ok(view.exceptionPolicies.length >= 5);
    assert.ok(view.escalationWorkflows.length >= 1);
    assert.ok(view.recoveryWorkflows.length >= 1);
    assert.ok(view.monitoringStatus);
    assert.ok(view.executiveReport);
    assert.ok(view.metrics);
    assert.ok(view.healthStatus);
  });

  test("assembleExecutiveExceptionManager integrates E5-01 through E5-07", () => {
    const view = assembleExecutiveExceptionManager({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
      enterpriseAuditEngine: buildFallbackEnterpriseAuditEngine(),
      executiveComplianceEngine: buildFallbackExecutiveComplianceEngine(),
      executiveEthicsEngine: buildFallbackExecutiveEthicsEngine(),
      executiveAccountabilityEngine: buildFallbackExecutiveAccountabilityEngine(),
      executiveTransparencyEngine: buildFallbackExecutiveTransparencyEngine(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-08" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-08");
    assert.ok(view.integrations.enterpriseGovernanceFramework.includes("E5-01"));
    assert.ok(view.integrations.executiveConstitutionalMonitor.includes("E5-02"));
    assert.ok(view.integrations.enterpriseAuditEngine.includes("E5-03"));
    assert.ok(view.integrations.executiveComplianceEngine.includes("E5-04"));
    assert.ok(view.integrations.executiveEthicsEngine.includes("E5-05"));
    assert.ok(view.integrations.executiveAccountabilityEngine.includes("E5-06"));
    assert.ok(view.integrations.executiveTransparencyEngine.includes("E5-07"));
    assert.ok(view.exceptionRecords.every((r) => r.exceptionId && r.evidence.length >= 1));
    assert.equal(view.readyForE509, true);
  });

  test("exception policy registry supports configurable policies", () => {
    const policies = getExceptionPolicyRegistry();
    assert.ok(policies.length >= 5);
    assert.ok(policies.every((p) => p.policyId && p.maxDurationDays >= 1));
    assert.ok(policies.some((p) => p.requiresExecutiveApproval));
  });

  test("exception registration creates pending or active exception", () => {
    const reg = runExceptionRegistration({
      title: "Test governance exception",
      category: "governance_exceptions",
      reason: "Temporary governance flexibility",
      businessJustification: "E5 deployment acceleration",
      requestedBy: "Governance Executive",
      durationDays: 14,
    });
    assert.ok(reg.exceptionId);
    assert.ok(reg.expirationDate);
    assert.equal(reg.requiresApproval, true);
    assert.equal(reg.status, "pending_approval");
  });

  test("exception approval workflow updates status", () => {
    const reg = runExceptionRegistration({
      title: "Approval test",
      category: "mission_exceptions",
      reason: "Documentation extension",
      businessJustification: "Minor lag",
      requestedBy: "Mission Executive",
    });
    const approved = runExceptionApproval({
      exceptionId: reg.exceptionId,
      approvedBy: "Governance Executive",
      approved: true,
    });
    assert.ok(approved);
    assert.equal(approved?.currentStatus, "active");
  });

  test("exception resolution records audit history", () => {
    const reg = runExceptionRegistration({
      title: "Resolve test",
      category: "repository_exceptions",
      reason: "Build flexibility",
      businessJustification: "Controlled evolution",
      requestedBy: "Engineering Executive",
      durationDays: 7,
    });
    runExceptionApproval({
      exceptionId: reg.exceptionId,
      approvedBy: "Engineering Executive",
      approved: true,
    });
    const resolved = runExceptionResolution(reg.exceptionId, "Engineering Executive");
    assert.ok(resolved);
    assert.equal(resolved?.currentStatus, "resolved");
    const history = getExceptionAuditHistory();
    assert.ok(history.some((e) => e.newStatus === "resolved"));
  });

  test("escalation workflows generated for active exceptions", () => {
    const view = buildFallbackExecutiveExceptionManager();
    assert.ok(view.escalationWorkflows.length >= 1);
    assert.ok(view.escalationWorkflows.every((e) => e.level && e.assignedTo));
  });
});
