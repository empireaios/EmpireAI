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
import { buildFallbackEnterpriseRiskGovernance } from "../../enterprise-risk-governance/assembler.js";
import { buildFallbackExecutiveReviewBoard } from "../../executive-review-board/assembler.js";
import { buildFallbackExecutivePolicyEvolution } from "../../executive-policy-evolution/assembler.js";
import { buildFallbackExecutiveTrustEngine } from "../../executive-trust-engine/assembler.js";
import { buildFallbackEnterpriseConstitutionalGuardian } from "../../enterprise-constitutional-guardian/assembler.js";
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleExecutiveResilienceEngine,
  buildFallbackExecutiveResilienceEngine,
  EXECUTIVE_RESILIENCE_PIPELINE,
  RESILIENCE_PRINCIPLES,
  GOVERNED_RESILIENCE_DOMAINS,
  RESILIENCE_ANALYSIS_DOMAINS,
  getResilienceConfiguration,
  resetResilienceServiceForTesting,
} from "../../executive-resilience-engine/index.js";

describe("E5-14 Executive Resilience Engine", () => {
  beforeEach(() => {
    resetResilienceServiceForTesting();
  });

  test("buildFallbackExecutiveResilienceEngine returns constitutional resilience model", () => {
    const view = buildFallbackExecutiveResilienceEngine();
    assert.equal(view.engineVersion, "E5-14");
    assert.equal(view.executiveResiliencePipeline.length, EXECUTIVE_RESILIENCE_PIPELINE.length);
    assert.deepEqual(view.resiliencePrinciples, [...RESILIENCE_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_RESILIENCE_DOMAINS.length);
    assert.ok(view.resilienceIncidentRegister.length >= 10);
    assert.ok(view.enterpriseHealth.length >= 1);
    assert.ok(view.continuityStatus.length >= 1);
    assert.ok(view.recoveryProgress.length >= 10);
    assert.ok(view.operationalReadiness.length >= 1);
    assert.ok(view.resilienceAnalysis.length >= RESILIENCE_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE515, true);
    assert.equal(view.unresolvedCriticalCount, 0);
    assert.ok(view.enterpriseHealthScore >= 0 && view.enterpriseHealthScore <= 100);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
    assert.ok(view.monitoringStatus);
    assert.ok(view.executiveReport);
    assert.ok(view.metrics);
    assert.ok(view.healthStatus);
  });

  test("assembleExecutiveResilienceEngine integrates E5-01 through E5-13", () => {
    const view = assembleExecutiveResilienceEngine({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
      enterpriseAuditEngine: buildFallbackEnterpriseAuditEngine(),
      executiveComplianceEngine: buildFallbackExecutiveComplianceEngine(),
      executiveEthicsEngine: buildFallbackExecutiveEthicsEngine(),
      executiveAccountabilityEngine: buildFallbackExecutiveAccountabilityEngine(),
      executiveTransparencyEngine: buildFallbackExecutiveTransparencyEngine(),
      executiveExceptionManager: buildFallbackExecutiveExceptionManager(),
      enterpriseRiskGovernance: buildFallbackEnterpriseRiskGovernance(),
      executiveReviewBoard: buildFallbackExecutiveReviewBoard(),
      executivePolicyEvolution: buildFallbackExecutivePolicyEvolution(),
      executiveTrustEngine: buildFallbackExecutiveTrustEngine(),
      enterpriseConstitutionalGuardian: buildFallbackEnterpriseConstitutionalGuardian(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-14" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-14");
    assert.ok(view.integrations.enterpriseGovernanceFramework.includes("E5-01"));
    assert.ok(view.integrations.executiveConstitutionalMonitor.includes("E5-02"));
    assert.ok(view.integrations.enterpriseAuditEngine.includes("E5-03"));
    assert.ok(view.integrations.executiveComplianceEngine.includes("E5-04"));
    assert.ok(view.integrations.executiveEthicsEngine.includes("E5-05"));
    assert.ok(view.integrations.executiveAccountabilityEngine.includes("E5-06"));
    assert.ok(view.integrations.executiveTransparencyEngine.includes("E5-07"));
    assert.ok(view.integrations.executiveExceptionManager.includes("E5-08"));
    assert.ok(view.integrations.enterpriseRiskGovernance.includes("E5-09"));
    assert.ok(view.integrations.executiveReviewBoard.includes("E5-10"));
    assert.ok(view.integrations.executivePolicyEvolution.includes("E5-11"));
    assert.ok(view.integrations.executiveTrustEngine.includes("E5-12"));
    assert.ok(view.integrations.enterpriseConstitutionalGuardian.includes("E5-13"));
    assert.ok(view.resilienceIncidentRegister.every((r) => r.resilienceId && r.evidence.length >= 1));
    assert.equal(view.readyForE515, true);
  });

  test("every resilience incident has required attributes", () => {
    const view = buildFallbackExecutiveResilienceEngine();
    assert.ok(
      view.resilienceIncidentRegister.every(
        (r) =>
          r.incidentTitle &&
          r.affectedSystems &&
          r.recoveryStrategy &&
          r.responsibleExecutive &&
          r.confidence >= 0,
      ),
    );
  });

  test("resilience pipeline has active continuity validation phase", () => {
    const view = buildFallbackExecutiveResilienceEngine();
    const active = view.executiveResiliencePipeline.filter((s) => s.status === "active");
    assert.equal(active.length, 1);
    assert.equal(active[0]?.phase, "continuity_validation");
  });

  test("resilience configuration enables automatic recovery", () => {
    const config = getResilienceConfiguration();
    assert.equal(config.automaticRecoveryEnabled, true);
    assert.equal(config.continuityValidationRequired, true);
    assert.ok(config.minimumEvidenceCount >= 1);
  });

  test("cockpit panels populated from incident register", () => {
    const view = buildFallbackExecutiveResilienceEngine();
    assert.ok(view.continuityStatus.every((c) => c.availability >= 0 && c.availability <= 100));
    assert.ok(view.recoveryProgress.every((p) => p.progress >= 0 && p.progress <= 100));
    assert.ok(view.operationalReadiness.every((o) => o.score >= 0));
  });
});
