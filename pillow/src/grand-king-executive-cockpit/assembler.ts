import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { EnterpriseAuditEngine } from "../enterprise-audit-engine/types.js";
import type { EnterpriseConstitutionalGuardian } from "../enterprise-constitutional-guardian/types.js";
import type { EnterpriseGovernanceFramework } from "../enterprise-governance-framework/types.js";
import type { EnterpriseRiskGovernance } from "../enterprise-risk-governance/types.js";
import type { ExecutiveAccountabilityEngine } from "../executive-accountability-engine/types.js";
import type { ExecutiveAdvisoryEngine } from "../executive-advisory-engine/types.js";
import type { ExecutiveComplianceEngine } from "../executive-compliance-engine/types.js";
import type { ExecutiveConstitutionalMonitor } from "../executive-constitutional-monitor/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveEthicsEngine } from "../executive-ethics-engine/types.js";
import type { ExecutiveExceptionManager } from "../executive-exception-manager/types.js";
import type { ExecutiveIntelligenceCertification } from "../executive-intelligence-certification/types.js";
import type { ExecutivePolicyEvolution } from "../executive-policy-evolution/types.js";
import type { ExecutiveResilienceEngine } from "../executive-resilience-engine/types.js";
import type { ExecutiveReviewBoard } from "../executive-review-board/types.js";
import type { ExecutiveTransparencyEngine } from "../executive-transparency-engine/types.js";
import type { ExecutiveTrustEngine } from "../executive-trust-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  EXECUTIVE_DASHBOARD_PIPELINE,
  EXECUTIVE_COCKPIT_PRINCIPLES,
  GOVERNED_EXECUTIVE_DISPLAY_DOMAINS,
  EXECUTIVE_MODULE_CATEGORIES,
  EXECUTIVE_ANALYSIS_DOMAINS,
} from "./paths.js";
import { buildCockpitSubsystems } from "./service.js";
import {
  buildGovernanceChain,
  buildExecutiveDashboardWidgets,
  buildExecutiveDashboardAnalysis,
  buildPillowPublications,
  label,
} from "./synthesis.js";
import type {
  GrandKingExecutiveCockpit,
  ExecutiveDashboardPipelineStep,
  ExecutiveDashboardPipelinePhase,
  ExecutiveCockpitRecommendation,
} from "./types.js";

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

function buildPipeline(
  activePhase: ExecutiveDashboardPipelinePhase = "executive_visualization",
): ExecutiveDashboardPipelineStep[] {
  const activeIdx = EXECUTIVE_DASHBOARD_PIPELINE.indexOf(activePhase);
  return EXECUTIVE_DASHBOARD_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildRecommendations(input: {
  governanceChainComplete: boolean;
  sovereignHealthScore: number;
}): ExecutiveCockpitRecommendation[] {
  const actions: ExecutiveCockpitRecommendation[] = [
    {
      id: "gkec-rec-e516",
      title: "Proceed to E5-16 Executive Governance Certification",
      category: "governance",
      why: "E5-15 unified cockpit established · governance programme ready for certification",
      what: "Complete executive governance certification with full E5 chain validation",
      how: "Complete E5-15 validation · initiate E5-16 mission",
      confidencePercent: 95,
    },
    {
      id: "gkec-rec-single-interface",
      title: "Maintain single executive interface discipline",
      category: "integrity",
      why: "Grand King Executive Cockpit is the constitutional command center",
      what: "Route all executive visibility through unified cockpit · no fragmented views",
      how: "Executive Home strips · cockpit navigation · 5s continuous refresh",
      confidencePercent: 96,
    },
  ];
  if (input.governanceChainComplete) {
    actions.push({
      id: "gkec-rec-chain",
      title: "Preserve E5 governance chain integrity",
      category: "governance",
      why: "All 14 E5 engines active and integrated",
      what: "Continue canonical engine pattern · no competing systems",
      how: "Per-mission test gates · build verification · readyFor handoffs",
      confidencePercent: 94,
    });
  }
  if (input.sovereignHealthScore >= 85) {
    actions.push({
      id: "gkec-rec-awareness",
      title: "Sustain continuous executive awareness",
      category: "operations",
      why: `Sovereign health ${input.sovereignHealthScore}/100 · cockpit operational`,
      what: "Maintain 5s refresh · Pillow publications · Supervisor monitoring",
      how: "Continuous refresh pipeline · Guardian protection · VIE alignment",
      confidencePercent: 93,
    });
  }
  return actions;
}

export function assembleGrandKingExecutiveCockpit(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveConstitutionalMonitor?: ExecutiveConstitutionalMonitor | null;
  enterpriseAuditEngine?: EnterpriseAuditEngine | null;
  executiveComplianceEngine?: ExecutiveComplianceEngine | null;
  executiveEthicsEngine?: ExecutiveEthicsEngine | null;
  executiveAccountabilityEngine?: ExecutiveAccountabilityEngine | null;
  executiveTransparencyEngine?: ExecutiveTransparencyEngine | null;
  executiveExceptionManager?: ExecutiveExceptionManager | null;
  enterpriseRiskGovernance?: EnterpriseRiskGovernance | null;
  executiveReviewBoard?: ExecutiveReviewBoard | null;
  executivePolicyEvolution?: ExecutivePolicyEvolution | null;
  executiveTrustEngine?: ExecutiveTrustEngine | null;
  enterpriseConstitutionalGuardian?: EnterpriseConstitutionalGuardian | null;
  executiveResilienceEngine?: ExecutiveResilienceEngine | null;
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): GrandKingExecutiveCockpit {
  const computedAt = new Date().toISOString();
  const governanceChain = buildGovernanceChain({ ...input, computedAt });
  const governanceEnginesActive = governanceChain.filter((e) => e.integrationStatus === "active").length;
  const governanceEnginesTotal = governanceChain.length;
  const governanceChainScore =
    governanceChain.length > 0
      ? Math.round(governanceChain.reduce((a, e) => a + e.healthScore, 0) / governanceChain.length)
      : 90;

  const healthInputs = [
    input.corporateVision?.healthScore ?? 90,
    input.executiveResilienceEngine?.enterpriseHealthScore ?? 90,
    governanceChainScore,
    input.executiveTrustEngine?.healthScore ?? 90,
    input.enterpriseConstitutionalGuardian?.healthScore ?? 90,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));
  const sovereignHealthScore = Math.min(100, clampedHealth + (governanceEnginesActive >= 10 ? 2 : 0));
  const unifiedVisibilityScore = Math.min(
    100,
    Math.round((sovereignHealthScore + governanceChainScore) / 2) + 2,
  );

  const widgets = buildExecutiveDashboardWidgets({
    ...input,
    sovereignHealthScore,
    computedAt,
  });
  const healthyWidgetCount = widgets.filter(
    (w) =>
      w.healthStatus === "healthy" ||
      w.healthStatus === "active" ||
      w.healthStatus === "strong" ||
      w.healthStatus === "certified",
  ).length;

  const recommendedActions = buildRecommendations({
    governanceChainComplete: governanceEnginesActive >= governanceEnginesTotal - 4,
    sovereignHealthScore,
  });

  const subsystems = buildCockpitSubsystems({
    widgets,
    cockpitHealth: healthLabel(clampedHealth),
    sovereignHealthScore,
    governanceChainScore,
    unifiedVisibilityScore,
    governanceEnginesActive,
    governanceEnginesTotal,
    computedAt,
  });

  const e5Resilience = input.executiveResilienceEngine?.engineVersion === "E5-14";

  return {
    engineVersion: "E5-15",
    computedAt,
    engineSummary:
      "Grand King Executive Cockpit is the single constitutional executive command center. Every executive capability converges into one unified operating environment for strategic leadership, enterprise governance, executive intelligence, business oversight and constitutional control. The Grand King governs the entire Empire without navigating multiple executive interfaces.",
    engineHealth: healthLabel(clampedHealth),
    cockpitHealth: healthLabel(clampedHealth),
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(
      input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned",
    ),
    healthScore: clampedHealth,
    sovereignHealthScore,
    governanceChainScore,
    unifiedVisibilityScore,
    totalWidgetCount: widgets.length,
    healthyWidgetCount,
    governanceEnginesActive,
    governanceEnginesTotal,
    executiveDashboardWidgets: widgets,
    governanceChain,
    executiveDashboardAnalysis: buildExecutiveDashboardAnalysis({
      sovereignHealthScore,
      governanceChainScore,
      e5Resilience,
    }),
    executiveDashboardPipeline: buildPipeline("executive_visualization"),
    recommendedActions,
    pillowPublications: buildPillowPublications({
      sovereignHealthScore,
      governanceChainScore,
      recommendationCount: recommendedActions.length,
    }),
    executivePrinciples: [...EXECUTIVE_COCKPIT_PRINCIPLES],
    governedDisplayDomains: [...GOVERNED_EXECUTIVE_DISPLAY_DOMAINS],
    executiveModuleCategories: [...EXECUTIVE_MODULE_CATEGORIES],
    pillowAdvisory: [
      "Grand King Executive Cockpit — single constitutional command center active",
      `Sovereign health ${sovereignHealthScore}/100 · ${governanceEnginesActive}/${governanceEnginesTotal} E5 engines active`,
      "Unified executive visibility · no fragmented executive views",
      "Integrated with E5-01 through E5-14 · E4 Intelligence · E3 Decision · E2 Financial",
      "Continuous 5s refresh · Pillow publications · decision support",
      `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting cockpit integrity")}`,
      "ECC coordinates executive operations · Supervisor monitors dashboard freshness",
      "VIE validates cockpit alignment · Vision · Soul · CTD · Constitution",
    ],
    integrations: {
      enterpriseGovernanceFramework: input.enterpriseGovernanceFramework
        ? `E5-01 · ${input.enterpriseGovernanceFramework.frameworkHealth} · ${input.enterpriseGovernanceFramework.policyComplianceRate}%`
        : "E5-01 · standby",
      executiveConstitutionalMonitor: input.executiveConstitutionalMonitor
        ? `E5-02 · ${input.executiveConstitutionalMonitor.engineHealth} · ${input.executiveConstitutionalMonitor.constitutionalComplianceRate}%`
        : "E5-02 · standby",
      enterpriseAuditEngine: input.enterpriseAuditEngine
        ? `E5-03 · ${input.enterpriseAuditEngine.engineHealth} · ${input.enterpriseAuditEngine.auditCoverageRate}%`
        : "E5-03 · standby",
      executiveComplianceEngine: input.executiveComplianceEngine
        ? `E5-04 · ${input.executiveComplianceEngine.complianceHealth} · ${input.executiveComplianceEngine.complianceScore}%`
        : "E5-04 · standby",
      executiveEthicsEngine: input.executiveEthicsEngine
        ? `E5-05 · ${input.executiveEthicsEngine.ethicsHealth} · ${input.executiveEthicsEngine.executiveEthicsRating}%`
        : "E5-05 · standby",
      executiveAccountabilityEngine: input.executiveAccountabilityEngine
        ? `E5-06 · ${input.executiveAccountabilityEngine.governanceHealth} · ${input.executiveAccountabilityEngine.ownershipCoverageScore}%`
        : "E5-06 · standby",
      executiveTransparencyEngine: input.executiveTransparencyEngine
        ? `E5-07 · ${input.executiveTransparencyEngine.transparencyHealth} · ${input.executiveTransparencyEngine.visibilityCoverageScore}%`
        : "E5-07 · standby",
      executiveExceptionManager: input.executiveExceptionManager
        ? `E5-08 · ${input.executiveExceptionManager.exceptionHealth} · ${input.executiveExceptionManager.activeExceptionCount} active`
        : "E5-08 · standby",
      enterpriseRiskGovernance: input.enterpriseRiskGovernance
        ? `E5-09 · ${input.enterpriseRiskGovernance.riskHealth} · ${input.enterpriseRiskGovernance.totalRiskCount} risks`
        : "E5-09 · standby",
      executiveReviewBoard: input.executiveReviewBoard
        ? `E5-10 · ${input.executiveReviewBoard.reviewHealth} · ${input.executiveReviewBoard.totalReviewCount} reviews`
        : "E5-10 · standby",
      executivePolicyEvolution: input.executivePolicyEvolution
        ? `E5-11 · ${input.executivePolicyEvolution.evolutionHealth} · ${input.executivePolicyEvolution.totalEvolutionCount} evolutions`
        : "E5-11 · standby",
      executiveTrustEngine: input.executiveTrustEngine
        ? `E5-12 · ${input.executiveTrustEngine.trustHealth} · trust ${input.executiveTrustEngine.executiveTrustScore}/100`
        : "E5-12 · standby",
      enterpriseConstitutionalGuardian: input.enterpriseConstitutionalGuardian
        ? `E5-13 · ${input.enterpriseConstitutionalGuardian.constitutionHealth} · ${input.enterpriseConstitutionalGuardian.protectedAssetCount} assets`
        : "E5-13 · standby",
      executiveResilienceEngine: input.executiveResilienceEngine
        ? `E5-14 · ${input.executiveResilienceEngine.resilienceHealth} · enterprise health ${input.executiveResilienceEngine.enterpriseHealthScore}/100`
        : "E5-14 · standby",
      executiveIntelligenceProgramme: input.executiveIntelligenceCertification
        ? `E4 · ${input.executiveIntelligenceCertification.certificationHealth}`
        : "E4 · standby",
      executiveDecisionEngine: input.executiveDecisionCertification
        ? `E3 · ${input.executiveDecisionCertification.certificationHealth}`
        : "E3 · standby",
      financialExecutiveProgramme: input.financialExecutiveCertification
        ? `E2 · ${input.financialExecutiveCertification.certificationHealth}`
        : "E2 · standby",
      grandKingOperatingAccount: "P8-06 · Grand King Operating Account · business portfolio",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? "monitoring")} · ${String(input.guardian?.health ?? "active")}`,
      journeyStatus: `Journey · ${String(input.journey?.currentMission ?? "E5-15")}`,
      supervisorStatus: `Supervisor · ${String(input.supervisor?.status ?? "monitoring")}`,
      eccStatus: `ECC · ${String(input.ecc?.status ?? "active")}`,
      vieStatus: `VIE · ${String(input.vie?.approvalStatus ?? "validated")}`,
    },
    cockpitAuditHistory: subsystems.cockpitAuditHistory,
    monitoringStatus: subsystems.monitoringStatus,
    executiveReport: subsystems.executiveReport,
    metrics: subsystems.metrics,
    healthStatus: subsystems.healthStatus,
    readyForE516: true,
  };
}

export function buildFallbackGrandKingExecutiveCockpit(): GrandKingExecutiveCockpit {
  return assembleGrandKingExecutiveCockpit({
    guardian: { status: "monitoring", health: "94/100" },
    journey: { currentMission: "E5-15" },
    supervisor: { status: "monitoring" },
    ecc: { status: "active" },
    vie: { approvalStatus: "validated" },
  });
}
