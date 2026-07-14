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
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleExecutiveReviewBoard,
  buildFallbackExecutiveReviewBoard,
  EXECUTIVE_REVIEW_PIPELINE,
  REVIEW_PRINCIPLES,
  GOVERNED_REVIEW_CATEGORIES,
  REVIEW_ANALYSIS_DOMAINS,
  getReviewConfiguration,
  resetReviewServiceForTesting,
} from "../../executive-review-board/index.js";

describe("E5-10 Executive Review Board", () => {
  beforeEach(() => {
    resetReviewServiceForTesting();
  });

  test("buildFallbackExecutiveReviewBoard returns constitutional review model", () => {
    const view = buildFallbackExecutiveReviewBoard();
    assert.equal(view.engineVersion, "E5-10");
    assert.equal(view.executiveReviewPipeline.length, EXECUTIVE_REVIEW_PIPELINE.length);
    assert.deepEqual(view.reviewPrinciples, [...REVIEW_PRINCIPLES]);
    assert.equal(view.governedCategories.length, GOVERNED_REVIEW_CATEGORIES.length);
    assert.ok(view.executiveReviewRegister.length >= 10);
    assert.ok(view.reviewCalendar.length >= 10);
    assert.ok(view.currentReviews.length >= 1);
    assert.ok(view.executiveFindings.length >= 10);
    assert.ok(view.assignedActions.length >= 1);
    assert.ok(view.strategicProgress.length >= 1);
    assert.ok(view.governanceHealth.length >= 1);
    assert.ok(view.reviewAnalysis.length >= REVIEW_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE511, true);
    assert.equal(view.unreviewedCriticalCount, 0);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
    assert.ok(view.monitoringStatus);
    assert.ok(view.executiveReport);
    assert.ok(view.metrics);
    assert.ok(view.healthStatus);
  });

  test("assembleExecutiveReviewBoard integrates E5-01 through E5-09", () => {
    const view = assembleExecutiveReviewBoard({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
      enterpriseAuditEngine: buildFallbackEnterpriseAuditEngine(),
      executiveComplianceEngine: buildFallbackExecutiveComplianceEngine(),
      executiveEthicsEngine: buildFallbackExecutiveEthicsEngine(),
      executiveAccountabilityEngine: buildFallbackExecutiveAccountabilityEngine(),
      executiveTransparencyEngine: buildFallbackExecutiveTransparencyEngine(),
      executiveExceptionManager: buildFallbackExecutiveExceptionManager(),
      enterpriseRiskGovernance: buildFallbackEnterpriseRiskGovernance(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-10" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-10");
    assert.ok(view.integrations.enterpriseGovernanceFramework.includes("E5-01"));
    assert.ok(view.integrations.executiveConstitutionalMonitor.includes("E5-02"));
    assert.ok(view.integrations.enterpriseAuditEngine.includes("E5-03"));
    assert.ok(view.integrations.executiveComplianceEngine.includes("E5-04"));
    assert.ok(view.integrations.executiveEthicsEngine.includes("E5-05"));
    assert.ok(view.integrations.executiveAccountabilityEngine.includes("E5-06"));
    assert.ok(view.integrations.executiveTransparencyEngine.includes("E5-07"));
    assert.ok(view.integrations.executiveExceptionManager.includes("E5-08"));
    assert.ok(view.integrations.enterpriseRiskGovernance.includes("E5-09"));
    assert.ok(view.executiveReviewRegister.every((r) => r.reviewId && r.evidence.length >= 1));
    assert.equal(view.readyForE511, true);
  });

  test("every executive review has required attributes", () => {
    const view = buildFallbackExecutiveReviewBoard();
    assert.ok(
      view.executiveReviewRegister.every(
        (r) =>
          r.reviewTitle &&
          r.executiveFindings &&
          r.executiveRecommendations &&
          r.assignedActions &&
          r.confidence >= 0,
      ),
    );
  });

  test("review pipeline has active phase", () => {
    const view = buildFallbackExecutiveReviewBoard();
    const active = view.executiveReviewPipeline.filter((s) => s.status === "active");
    assert.equal(active.length, 1);
    assert.equal(active[0]?.phase, "executive_discussion");
  });

  test("review configuration supports governance settings", () => {
    const config = getReviewConfiguration();
    assert.equal(config.criticalAreaReviewRequired, true);
    assert.ok(config.executiveReviewIntervalDays >= 1);
  });

  test("cockpit panels populated from review register", () => {
    const view = buildFallbackExecutiveReviewBoard();
    assert.ok(view.reviewCalendar.every((c) => c.reviewId && c.scheduledDate));
    assert.ok(view.assignedActions.every((a) => a.action && a.owner));
    assert.ok(view.governanceHealth.every((g) => g.score >= 0 && g.score <= 100));
  });
});
