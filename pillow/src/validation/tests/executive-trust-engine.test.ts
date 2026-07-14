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
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleExecutiveTrustEngine,
  buildFallbackExecutiveTrustEngine,
  EXECUTIVE_TRUST_PIPELINE,
  TRUST_PRINCIPLES,
  GOVERNED_TRUST_DOMAINS,
  TRUST_ANALYSIS_DOMAINS,
  getTrustConfiguration,
  resetTrustServiceForTesting,
} from "../../executive-trust-engine/index.js";

describe("E5-12 Executive Trust Engine", () => {
  beforeEach(() => {
    resetTrustServiceForTesting();
  });

  test("buildFallbackExecutiveTrustEngine returns constitutional trust model", () => {
    const view = buildFallbackExecutiveTrustEngine();
    assert.equal(view.engineVersion, "E5-12");
    assert.equal(view.executiveTrustPipeline.length, EXECUTIVE_TRUST_PIPELINE.length);
    assert.deepEqual(view.trustPrinciples, [...TRUST_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_TRUST_DOMAINS.length);
    assert.ok(view.trustAssessmentRegister.length >= 10);
    assert.ok(view.executiveTrustScores.length >= 1);
    assert.ok(view.governanceTrustScores.length >= 1);
    assert.ok(view.decisionConfidenceEntries.length >= 1);
    assert.ok(view.trustTrends.length >= 10);
    assert.ok(view.trustHistory.length >= 10);
    assert.ok(view.confidenceAnalysis.length >= TRUST_ANALYSIS_DOMAINS.length);
    assert.ok(view.trustAnalysis.length >= TRUST_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE513, true);
    assert.equal(view.unsupportedRatingCount, 0);
    assert.ok(view.executiveTrustScore >= 0 && view.executiveTrustScore <= 100);
    assert.ok(view.governanceTrustScore >= 0 && view.governanceTrustScore <= 100);
    assert.ok(view.decisionConfidence >= 0 && view.decisionConfidence <= 100);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
    assert.ok(view.monitoringStatus);
    assert.ok(view.executiveReport);
    assert.ok(view.metrics);
    assert.ok(view.healthStatus);
  });

  test("assembleExecutiveTrustEngine integrates E5-01 through E5-11", () => {
    const view = assembleExecutiveTrustEngine({
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
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-12" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-12");
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
    assert.ok(view.trustAssessmentRegister.every((r) => r.trustId && r.supportingEvidence.length >= 1));
    assert.equal(view.readyForE513, true);
  });

  test("every trust assessment has required attributes", () => {
    const view = buildFallbackExecutiveTrustEngine();
    assert.ok(
      view.trustAssessmentRegister.every(
        (r) =>
          r.subject &&
          r.trustScore >= 0 &&
          r.confidenceScore >= 0 &&
          r.supportingEvidence.length >= 1 &&
          r.recommendedActions,
      ),
    );
  });

  test("trust pipeline has active confidence assessment phase", () => {
    const view = buildFallbackExecutiveTrustEngine();
    const active = view.executiveTrustPipeline.filter((s) => s.status === "active");
    assert.equal(active.length, 1);
    assert.equal(active[0]?.phase, "confidence_assessment");
  });

  test("trust configuration blocks unsupported ratings", () => {
    const config = getTrustConfiguration();
    assert.equal(config.unsupportedRatingBlocked, true);
    assert.equal(config.explainabilityRequired, true);
    assert.ok(config.minimumEvidenceCount >= 1);
  });

  test("cockpit panels populated from trust register", () => {
    const view = buildFallbackExecutiveTrustEngine();
    assert.ok(view.executiveTrustScores.every((s) => s.trustScore >= 0 && s.trustScore <= 100));
    assert.ok(view.trustTrends.every((t) => t.currentScore >= 0));
    assert.ok(view.trustHistory.every((h) => h.trustId && h.timestamp));
  });
});
