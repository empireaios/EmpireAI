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
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleExecutivePolicyEvolution,
  buildFallbackExecutivePolicyEvolution,
  POLICY_EVOLUTION_PIPELINE,
  POLICY_EVOLUTION_PRINCIPLES,
  GOVERNED_POLICY_EVOLUTION_DOMAINS,
  POLICY_EVOLUTION_ANALYSIS_DOMAINS,
  getPolicyEvolutionConfiguration,
  resetPolicyEvolutionServiceForTesting,
} from "../../executive-policy-evolution/index.js";

describe("E5-11 Executive Policy Evolution", () => {
  beforeEach(() => {
    resetPolicyEvolutionServiceForTesting();
  });

  test("buildFallbackExecutivePolicyEvolution returns constitutional evolution model", () => {
    const view = buildFallbackExecutivePolicyEvolution();
    assert.equal(view.engineVersion, "E5-11");
    assert.equal(view.policyEvolutionPipeline.length, POLICY_EVOLUTION_PIPELINE.length);
    assert.deepEqual(view.evolutionPrinciples, [...POLICY_EVOLUTION_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_POLICY_EVOLUTION_DOMAINS.length);
    assert.ok(view.policyEvolutionRegister.length >= 10);
    assert.ok(view.policyVersions.length >= 10);
    assert.ok(view.evolutionQueue.length >= 1);
    assert.ok(view.improvementOpportunities.length >= 1);
    assert.ok(view.policyEffectiveness.length >= 10);
    assert.ok(view.governanceStability.length >= 1);
    assert.ok(view.policyEvolutionAnalysis.length >= POLICY_EVOLUTION_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE512, true);
    assert.equal(view.regressionRiskCount, 0);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
    assert.ok(view.monitoringStatus);
    assert.ok(view.executiveReport);
    assert.ok(view.metrics);
    assert.ok(view.healthStatus);
  });

  test("assembleExecutivePolicyEvolution integrates E5-01 through E5-10", () => {
    const view = assembleExecutivePolicyEvolution({
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
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-11" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-11");
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
    assert.ok(view.policyEvolutionRegister.every((r) => r.evolutionId && r.evidence.length >= 1));
    assert.equal(view.readyForE512, true);
  });

  test("every policy evolution has required attributes", () => {
    const view = buildFallbackExecutivePolicyEvolution();
    assert.ok(
      view.policyEvolutionRegister.every(
        (r) =>
          r.policyName &&
          r.evolutionReason &&
          r.businessJustification &&
          r.currentVersion &&
          r.proposedVersion &&
          r.confidence >= 0,
      ),
    );
  });

  test("evolution pipeline has active constitution validation phase", () => {
    const view = buildFallbackExecutivePolicyEvolution();
    const active = view.policyEvolutionPipeline.filter((s) => s.status === "active");
    assert.equal(active.length, 1);
    assert.equal(active[0]?.phase, "constitution_validation");
  });

  test("policy evolution configuration requires constitution validation", () => {
    const config = getPolicyEvolutionConfiguration();
    assert.equal(config.constitutionValidationRequired, true);
    assert.equal(config.backwardCompatibilityRequired, true);
  });

  test("cockpit panels populated from evolution register", () => {
    const view = buildFallbackExecutivePolicyEvolution();
    assert.ok(view.policyVersions.every((v) => v.policyId && v.version));
    assert.ok(view.evolutionQueue.every((q) => q.evolutionId && q.scheduledDate));
    assert.ok(view.governanceStability.every((g) => g.score >= 0 && g.score <= 100));
  });
});
