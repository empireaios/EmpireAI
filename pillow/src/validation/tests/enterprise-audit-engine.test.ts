import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackEnterpriseGovernanceFramework } from "../../enterprise-governance-framework/assembler.js";
import { buildFallbackExecutiveConstitutionalMonitor } from "../../executive-constitutional-monitor/assembler.js";
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleEnterpriseAuditEngine,
  buildFallbackEnterpriseAuditEngine,
  ENTERPRISE_AUDIT_PIPELINE,
  AUDIT_PRINCIPLES,
  GOVERNED_AUDIT_DOMAINS,
  AUDIT_ANALYSIS_DOMAINS,
} from "../../enterprise-audit-engine/index.js";

describe("E5-03 Enterprise Audit Engine", () => {
  test("buildFallbackEnterpriseAuditEngine returns constitutional audit model", () => {
    const view = buildFallbackEnterpriseAuditEngine();
    assert.equal(view.engineVersion, "E5-03");
    assert.equal(view.enterpriseAuditPipeline.length, ENTERPRISE_AUDIT_PIPELINE.length);
    assert.deepEqual(view.auditPrinciples, [...AUDIT_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_AUDIT_DOMAINS.length);
    assert.ok(view.auditRecords.length >= 10);
    assert.ok(view.auditSchedule.length >= 5);
    assert.ok(view.auditCoverage.length >= GOVERNED_AUDIT_DOMAINS.length);
    assert.ok(view.auditAnalysis.length >= AUDIT_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE504, true);
    assert.equal(view.criticalFindingCount, 0);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
  });

  test("assembleEnterpriseAuditEngine integrates E5-01 and E5-02", () => {
    const view = assembleEnterpriseAuditEngine({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-03" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-03");
    assert.ok(view.integrations.enterpriseGovernanceFramework.includes("E5-01"));
    assert.ok(view.integrations.executiveConstitutionalMonitor.includes("E5-02"));
    assert.ok(view.integrations.decisionAuditEngine.includes("E2-13"));
    assert.ok(view.auditRecords.every((a) => a.auditId && a.auditName && a.evidence.length >= 1));
    assert.equal(view.readyForE504, true);
  });
});
