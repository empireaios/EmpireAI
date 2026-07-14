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
import { buildFallbackExecutiveResilienceEngine } from "../../executive-resilience-engine/assembler.js";
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleGrandKingExecutiveCockpit,
  buildFallbackGrandKingExecutiveCockpit,
  EXECUTIVE_DASHBOARD_PIPELINE,
  EXECUTIVE_COCKPIT_PRINCIPLES,
  GOVERNED_EXECUTIVE_DISPLAY_DOMAINS,
  EXECUTIVE_ANALYSIS_DOMAINS,
  getCockpitConfiguration,
  resetCockpitServiceForTesting,
} from "../../grand-king-executive-cockpit/index.js";

describe("E5-15 Grand King Executive Cockpit", () => {
  beforeEach(() => {
    resetCockpitServiceForTesting();
  });

  test("buildFallbackGrandKingExecutiveCockpit returns unified command center model", () => {
    const view = buildFallbackGrandKingExecutiveCockpit();
    assert.equal(view.engineVersion, "E5-15");
    assert.equal(view.executiveDashboardPipeline.length, EXECUTIVE_DASHBOARD_PIPELINE.length);
    assert.deepEqual(view.executivePrinciples, [...EXECUTIVE_COCKPIT_PRINCIPLES]);
    assert.equal(view.governedDisplayDomains.length, GOVERNED_EXECUTIVE_DISPLAY_DOMAINS.length);
    assert.ok(view.executiveDashboardWidgets.length >= 10);
    assert.ok(view.governanceChain.length >= 14);
    assert.ok(view.executiveDashboardAnalysis.length >= EXECUTIVE_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE516, true);
    assert.ok(view.sovereignHealthScore >= 0 && view.sovereignHealthScore <= 100);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
    assert.ok(view.monitoringStatus);
    assert.ok(view.executiveReport);
    assert.ok(view.metrics);
    assert.ok(view.healthStatus);
  });

  test("assembleGrandKingExecutiveCockpit integrates E5-01 through E5-14", () => {
    const view = assembleGrandKingExecutiveCockpit({
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
      executiveResilienceEngine: buildFallbackExecutiveResilienceEngine(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-15" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-15");
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
    assert.ok(view.integrations.executiveResilienceEngine.includes("E5-14"));
    assert.ok(
      view.executiveDashboardWidgets.every(
        (w) => w.widgetId && w.widgetName && w.evidence.length >= 1 && w.confidence >= 0,
      ),
    );
    assert.equal(view.readyForE516, true);
  });

  test("every dashboard widget has required attributes", () => {
    const view = buildFallbackGrandKingExecutiveCockpit();
    assert.ok(
      view.executiveDashboardWidgets.every(
        (w) =>
          w.primaryMetric &&
          w.healthStatus &&
          w.businessImpact &&
          w.strategicImpact &&
          w.dataSource &&
          w.lastUpdated,
      ),
    );
  });

  test("executive dashboard pipeline has active executive visualization phase", () => {
    const view = buildFallbackGrandKingExecutiveCockpit();
    const active = view.executiveDashboardPipeline.filter((s) => s.status === "active");
    assert.equal(active.length, 1);
    assert.equal(active[0]?.phase, "executive_visualization");
  });

  test("cockpit configuration enforces single executive interface", () => {
    const config = getCockpitConfiguration();
    assert.equal(config.continuousRefreshEnabled, true);
    assert.equal(config.singleInterfaceEnforced, true);
    assert.ok(config.minimumEvidenceCount >= 1);
  });

  test("governance chain populated with E5 engine entries", () => {
    const view = buildFallbackGrandKingExecutiveCockpit();
    assert.ok(view.governanceChain.every((e) => e.missionId && e.engineName && e.route));
    assert.equal(view.governanceChain.length, 14);
  });
});
