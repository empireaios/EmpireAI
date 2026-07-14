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
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleEnterpriseConstitutionalGuardian,
  buildFallbackEnterpriseConstitutionalGuardian,
  CONSTITUTIONAL_GUARDIAN_PIPELINE,
  GUARDIAN_PRINCIPLES,
  GOVERNED_PROTECTION_DOMAINS,
  CONSTITUTIONAL_ANALYSIS_DOMAINS,
  getGuardianConfiguration,
  resetGuardianServiceForTesting,
} from "../../enterprise-constitutional-guardian/index.js";

describe("E5-13 Enterprise Constitutional Guardian", () => {
  beforeEach(() => {
    resetGuardianServiceForTesting();
  });

  test("buildFallbackEnterpriseConstitutionalGuardian returns constitutional protection model", () => {
    const view = buildFallbackEnterpriseConstitutionalGuardian();
    assert.equal(view.engineVersion, "E5-13");
    assert.equal(view.constitutionalGuardianPipeline.length, CONSTITUTIONAL_GUARDIAN_PIPELINE.length);
    assert.deepEqual(view.guardianPrinciples, [...GUARDIAN_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_PROTECTION_DOMAINS.length);
    assert.ok(view.guardianProtectionRegister.length >= 10);
    assert.ok(view.constitutionHealthEntries.length >= 1);
    assert.ok(view.protectedAssets.length >= 10);
    assert.ok(view.repositoryIntegrity.length >= 1);
    assert.ok(view.architectureIntegrity.length >= 1);
    assert.ok(view.protectionEvents.length >= 10);
    assert.ok(view.constitutionalAnalysis.length >= CONSTITUTIONAL_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE514, true);
    assert.equal(view.unresolvedCriticalCount, 0);
    assert.ok(view.constitutionHealthScore >= 0 && view.constitutionHealthScore <= 100);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
    assert.ok(view.monitoringStatus);
    assert.ok(view.executiveReport);
    assert.ok(view.metrics);
    assert.ok(view.healthStatus);
  });

  test("assembleEnterpriseConstitutionalGuardian integrates E5-01 through E5-12", () => {
    const view = assembleEnterpriseConstitutionalGuardian({
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
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-13" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-13");
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
    assert.ok(view.guardianProtectionRegister.every((r) => r.guardianEventId && r.evidence.length >= 1));
    assert.equal(view.readyForE514, true);
  });

  test("every protection event has required guardian attributes", () => {
    const view = buildFallbackEnterpriseConstitutionalGuardian();
    assert.ok(
      view.guardianProtectionRegister.every(
        (r) =>
          r.protectedAsset &&
          r.detectedThreat &&
          r.recommendedProtection &&
          r.protectiveActionTaken &&
          r.confidence >= 0,
      ),
    );
  });

  test("guardian pipeline has active constitution validation phase", () => {
    const view = buildFallbackEnterpriseConstitutionalGuardian();
    const active = view.constitutionalGuardianPipeline.filter((s) => s.status === "active");
    assert.equal(active.length, 1);
    assert.equal(active[0]?.phase, "constitution_validation");
  });

  test("guardian configuration requires drift detection", () => {
    const config = getGuardianConfiguration();
    assert.equal(config.driftDetectionEnabled, true);
    assert.equal(config.immediateInterventionEnabled, true);
    assert.ok(config.minimumEvidenceCount >= 1);
  });

  test("cockpit panels populated from protection register", () => {
    const view = buildFallbackEnterpriseConstitutionalGuardian();
    assert.ok(view.protectedAssets.every((a) => a.assetName && a.status));
    assert.ok(view.repositoryIntegrity.every((r) => r.score >= 0 && r.score <= 100));
    assert.ok(view.architectureIntegrity.every((a) => a.canonicalCompliance));
  });
});
