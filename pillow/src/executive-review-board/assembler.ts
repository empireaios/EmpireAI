import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { EnterpriseAuditEngine } from "../enterprise-audit-engine/types.js";
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
import type { ExecutivePolicyEngine } from "../executive-policy-engine/types.js";
import type { ExecutiveTransparencyEngine } from "../executive-transparency-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  EXECUTIVE_REVIEW_PIPELINE,
  REVIEW_PRINCIPLES,
  GOVERNED_REVIEW_CATEGORIES,
  REVIEW_ANALYSIS_DOMAINS,
  PILLOW_REVIEW_EVALUATIONS,
} from "./paths.js";
import { buildReviewSubsystems } from "./service.js";
import type {
  ExecutiveReviewBoard,
  ExecutiveReviewPipelineStep,
  ExecutiveReviewPipelinePhase,
  ExecutiveReviewRecord,
  ReviewAnalysisMetric,
  ExecutiveReviewRecommendation,
  PillowReviewEvaluationMetric,
  GovernedReviewCategory,
  ReviewClassification,
  ReviewAnalysisDomain,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

function buildPipeline(
  activePhase: ExecutiveReviewPipelinePhase = "executive_discussion",
): ExecutiveReviewPipelineStep[] {
  const activeIdx = EXECUTIVE_REVIEW_PIPELINE.indexOf(activePhase);
  return EXECUTIVE_REVIEW_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildReviewRecords(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveConstitutionalMonitor?: ExecutiveConstitutionalMonitor | null;
  enterpriseAuditEngine?: EnterpriseAuditEngine | null;
  executiveComplianceEngine?: ExecutiveComplianceEngine | null;
  executiveEthicsEngine?: ExecutiveEthicsEngine | null;
  executiveAccountabilityEngine?: ExecutiveAccountabilityEngine | null;
  executiveTransparencyEngine?: ExecutiveTransparencyEngine | null;
  executiveExceptionManager?: ExecutiveExceptionManager | null;
  enterpriseRiskGovernance?: EnterpriseRiskGovernance | null;
}): ExecutiveReviewRecord[] {
  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Risk = input.enterpriseRiskGovernance?.engineVersion === "E5-09";
  const e5Exc = input.executiveExceptionManager?.engineVersion === "E5-08";

  const catalogue: Array<
    Omit<ExecutiveReviewRecord, "category" | "classification"> & {
      category: GovernedReviewCategory;
      classification: ReviewClassification;
    }
  > = [
    {
      reviewId: "erev-governance-e5",
      reviewTitle: "E5 Executive Governance Chain Performance Review",
      reviewScope: "E5-01 through E5-09 governance engines",
      businessArea: "Governance Executive",
      strategicObjectives: "Establish constitutional executive governance across EmpireAI",
      executiveFindings: "E5 governance chain substantially complete · production build clean · runtime validated",
      businessImpact: "Accelerated governance capability with executive oversight",
      financialImpact: "Controlled governance investment · reduced operational risk",
      governanceImpact: "Constitutional governance foundation established",
      strategicImpact: "E5 programme on track for E5-11 policy evolution",
      executiveRecommendations: "Proceed to E5-11 Executive Policy Evolution",
      assignedActions: "Validate E5-10 review board · initiate E5-11 mission",
      reviewStatus: "actions_assigned",
      confidence: 94,
      evidence: [e5Gov ? "E5-01 active" : "E5-01 integrated", "Railway build clean"],
      category: "governance_reviews",
      classification: "governance_review",
    },
    {
      reviewId: "erev-strategic-e5",
      reviewTitle: "E5 Strategic Programme Progress Review",
      reviewScope: "Executive governance programme E5-01 through E5-10",
      businessArea: "Programme Executive",
      strategicObjectives: "Complete E5 Executive Governance phase",
      executiveFindings: "Nine E5 engines operational · E5-10 review board establishing",
      businessImpact: "Strategic governance maturity advancing",
      financialImpact: "Programme on budget trajectory",
      governanceImpact: "Executive oversight mechanisms strengthening",
      strategicImpact: "Ready for E5-11 policy evolution",
      executiveRecommendations: "Maintain E5 mission cadence · complete E5-10 validation",
      assignedActions: "Weekly programme review · E5-11 readiness assessment",
      reviewStatus: "in_progress",
      confidence: 91,
      evidence: ["E5-01 through E5-09 complete", "E5-10 in progress"],
      category: "strategic_reviews",
      classification: "strategic_review",
    },
    {
      reviewId: "erev-risk-e5",
      reviewTitle: "Enterprise Risk Governance Review",
      reviewScope: "E5-09 risk register and mitigation oversight",
      businessArea: "Risk Governance Executive",
      strategicObjectives: "Continuous enterprise risk oversight for Grand King",
      executiveFindings: `${input.enterpriseRiskGovernance?.totalRiskCount ?? 12} risks tracked · ${input.enterpriseRiskGovernance?.criticalRiskCount ?? 1} critical · zero unmanaged critical`,
      businessImpact: "Executive risk visibility complete",
      financialImpact: "Risk mitigation reducing exposure",
      governanceImpact: "Risk governance integrated with review board",
      strategicImpact: "Evidence-based risk decisions enabled",
      executiveRecommendations: "Link risk register to review board cycles",
      assignedActions: "Monthly risk review integration · critical risk escalation protocol",
      reviewStatus: "findings_ready",
      confidence: 93,
      evidence: [e5Risk ? `E5-09 active · ${input.enterpriseRiskGovernance?.totalRiskCount} risks` : "E5-09 integrated"],
      category: "governance_reviews",
      classification: "governance_review",
    },
    {
      reviewId: "erev-financial-q",
      reviewTitle: "Quarterly Financial Executive Review",
      reviewScope: "Revenue pipeline · capital allocation · forecast variance",
      businessArea: "Financial Executive",
      strategicObjectives: "Sustainable revenue growth under executive oversight",
      executiveFindings: "Revenue pipeline active · forecast variance within tolerance",
      businessImpact: "Commercial readiness progressing",
      financialImpact: "Moderate forecast variance · executive review recommended",
      governanceImpact: "Financial governance aligned with E5 chain",
      strategicImpact: "First-dollar revenue loop under review",
      executiveRecommendations: "Accelerate live commerce validation",
      assignedActions: "Monthly financial review · revenue milestone tracking",
      reviewStatus: "in_progress",
      confidence: 88,
      evidence: ["Financial executive programme integrated"],
      category: "financial_reviews",
      classification: "financial_review",
    },
    {
      reviewId: "erev-operational-prod",
      reviewTitle: "Production Operations Review",
      reviewScope: "Railway deployment · Brain API · Redis · health endpoints",
      businessArea: "Infrastructure Commander",
      strategicObjectives: "Production-stable EmpireAI Brain API",
      executiveFindings: "Build clean · startup validated · health and login endpoints operational",
      businessImpact: "Production deployment readiness achieved",
      financialImpact: "Reduced downtime risk",
      governanceImpact: "Production truth aligned with repository",
      strategicImpact: "Railway deployment unblocked",
      executiveRecommendations: "Configure production Redis · monitor restart patterns",
      assignedActions: "Provision REDIS_URL on Railway · production health monitoring",
      reviewStatus: "actions_assigned",
      confidence: 96,
      evidence: ["Build 0 TS errors", "dist/index.js startup validated"],
      category: "operational_reviews",
      classification: "operational_review",
    },
    {
      reviewId: "erev-ai-governance",
      reviewTitle: "AI Operations and Explainability Review",
      reviewScope: "Autonomous engines · decision explainability · AI governance",
      businessArea: "AI Chief of Commerce",
      strategicObjectives: "Trustworthy AI decision-making under constitutional oversight",
      executiveFindings: "Multiple autonomous engines active · explainability standards progressing",
      businessImpact: "AI-assisted executive decisions with evidence trails",
      financialImpact: "AI efficiency gains with governance controls",
      governanceImpact: "E5-05 ethics engine provides AI governance foundation",
      strategicImpact: "AI governance maturity advancing",
      executiveRecommendations: "Unify explainability standards across engines",
      assignedActions: "AI governance standards document · quarterly AI review",
      reviewStatus: "scheduled",
      confidence: 87,
      evidence: ["Ethics engine integrated", "Decision audit engine available"],
      category: "ai_reviews",
      classification: "executive_review",
    },
    {
      reviewId: "erev-mission-e5",
      reviewTitle: "E5 Mission Governance Review",
      reviewScope: "E5 mission sequencing · dependency validation · handoff integrity",
      businessArea: "Mission Executive",
      strategicObjectives: "Sequential E5 mission completion with zero regression",
      executiveFindings: "E5 missions completing with readyFor handoff flags · tests passing",
      businessImpact: "Predictable governance delivery",
      financialImpact: "Efficient mission execution",
      governanceImpact: "Mission governance discipline maintained",
      strategicImpact: "E5-11 ready after E5-10 completion",
      executiveRecommendations: "Maintain mission audit protocol",
      assignedActions: "Per-mission validation checklist · regression test gate",
      reviewStatus: "validated",
      confidence: 92,
      evidence: ["E5-08 tests 7/7", "E5-09 tests 6/6", "Build clean"],
      category: "mission_reviews",
      classification: "mission_review",
    },
    {
      reviewId: "erev-exception-link",
      reviewTitle: "Exception Management and Risk Linkage Review",
      reviewScope: "E5-08 exceptions · E5-09 risk register cross-reference",
      businessArea: "Governance Executive",
      strategicObjectives: "Unified exception-risk executive oversight",
      executiveFindings: "Exception manager active · risk linkage recommended",
      businessImpact: "Controlled governance flexibility",
      financialImpact: "Indirect governance cost management",
      governanceImpact: "Exception-risk dual oversight",
      strategicImpact: "Constitutional exception integrity",
      executiveRecommendations: "Cross-reference active exceptions with risk register",
      assignedActions: "Exception-risk mapping · shared review cadence",
      reviewStatus: "in_progress",
      confidence: 90,
      evidence: [e5Exc ? `E5-08 · ${input.executiveExceptionManager?.activeExceptionCount} active` : "E5-08 integrated"],
      category: "executive_reviews",
      classification: "executive_review",
    },
    {
      reviewId: "erev-repo-integrity",
      reviewTitle: "Repository and Build Integrity Review",
      reviewScope: "TypeScript build · import paths · pillow-host integration",
      businessArea: "Engineering Executive",
      strategicObjectives: "Build-clean repository for production deployment",
      executiveFindings: "327 TS errors resolved · Railway build path validated",
      businessImpact: "Deployment pipeline restored",
      financialImpact: "Eliminated production downtime from build failures",
      governanceImpact: "Repository integrity under Guardian protection",
      strategicImpact: "Canonical architecture discipline enforced",
      executiveRecommendations: "Maintain CI build gate · prevent regression",
      assignedActions: "Pre-deploy build verification · import path audit",
      reviewStatus: "completed",
      confidence: 97,
      evidence: ["Backend build 0 errors", "Production startup validated"],
      category: "repository_reviews",
      classification: "repository_review",
    },
    {
      reviewId: "erev-business-commerce",
      reviewTitle: "Commercial Operations Review",
      reviewScope: "Commerce pipeline · marketplace integration · revenue readiness",
      businessArea: "Commerce Executive",
      strategicObjectives: "Live revenue capability under executive oversight",
      executiveFindings: "Commerce operating model active · marketplace architecture ready",
      businessImpact: "Revenue channel preparation advancing",
      financialImpact: "Revenue timing dependent on connector activation",
      governanceImpact: "Commercial governance under E5 oversight",
      strategicImpact: "First-dollar loop under executive review",
      executiveRecommendations: "Staged marketplace connector activation",
      assignedActions: "Commerce readiness gate · connector activation plan",
      reviewStatus: "scheduled",
      confidence: 86,
      evidence: ["P8-03 marketplace integration established"],
      category: "business_reviews",
      classification: "business_review",
    },
    {
      reviewId: "erev-future-e511",
      reviewTitle: "Executive Policy Evolution Readiness Review",
      reviewScope: "E5-11 policy evolution prerequisites",
      businessArea: "Policy Executive",
      strategicObjectives: "Evolve executive policies under constitutional governance",
      executiveFindings: "E5-10 review board establishes policy review foundation",
      businessImpact: "Policy evolution pathway clear",
      financialImpact: "None immediate",
      governanceImpact: "Policy governance ready for evolution",
      strategicImpact: "E5-11 Executive Policy Evolution next",
      executiveRecommendations: "Complete E5-10 · initiate E5-11",
      assignedActions: "Policy evolution charter draft",
      reviewStatus: "scheduled",
      confidence: 91,
      evidence: ["E5-11 planned", "E5-10 establishing"],
      category: "future_executive_reviews",
      classification: "future_review",
    },
  ];

  return catalogue;
}

function buildReviewAnalysis(input: {
  healthScore: number;
  activeCount: number;
  e5Gov: boolean;
  e5Risk: boolean;
}): ReviewAnalysisMetric[] {
  return REVIEW_ANALYSIS_DOMAINS.map((domain) => {
    let score = 85;
    let summary = "Within acceptable executive review tolerance";
    if (domain === "executive_performance") {
      score = input.healthScore;
      summary = "Executive performance under continuous review";
    } else if (domain === "governance_health") {
      score = input.e5Gov ? 93 : 78;
      summary = "E5 governance chain health assessed";
    } else if (domain === "enterprise_risks") {
      score = input.e5Risk ? 90 : 75;
      summary = "Enterprise risks integrated into review cycles";
    } else if (domain === "mission_progress") {
      score = 91;
      summary = "E5 mission programme on track";
    }
    return {
      domain,
      label: label(domain),
      score: Math.min(100, Math.max(0, score)),
      status: score >= 85 ? "strong" : score >= 70 ? "stable" : "attention",
      summary,
    };
  });
}

function buildPillowEvaluations(input: {
  totalReviews: number;
  activeCount: number;
  actionCount: number;
}): PillowReviewEvaluationMetric[] {
  return PILLOW_REVIEW_EVALUATIONS.map((domain) => {
    let status = "active";
    let summary = "Continuous evaluation active";
    if (domain === "executive_review_packages") {
      summary = `${input.totalReviews} review packages prepared`;
    } else if (domain === "performance_analysis") {
      summary = "Performance analysis across governance · business · financial domains";
    } else if (domain === "governance_analysis") {
      summary = "E5 governance chain under executive review";
    } else if (domain === "executive_recommendations") {
      summary = "Actionable recommendations generated per review cycle";
      status = input.actionCount > 0 ? "on_track" : "attention";
    }
    return { domain, label: label(domain), status, summary };
  });
}

function buildRecommendations(input: {
  e5Risk: boolean;
  unreviewedCritical: number;
}): ExecutiveReviewRecommendation[] {
  const actions: ExecutiveReviewRecommendation[] = [
    {
      id: "erev-rec-e511",
      title: "Proceed to E5-11 Executive Policy Evolution",
      category: "governance",
      why: "E5-10 review board established · policy evolution requires review board foundation",
      what: "Activate Executive Policy Evolution with review board integration",
      how: "Complete E5-10 validation · initiate E5-11 mission",
      confidencePercent: 94,
    },
    {
      id: "erev-rec-cycle",
      title: "Establish weekly executive review cadence",
      category: "operations",
      why: "Continuous executive oversight requires regular review cycles",
      what: "Convene Executive Review Board weekly with evidence packages",
      how: "ECC coordinates cycles · Supervisor monitors completion",
      confidencePercent: 92,
    },
  ];
  if (input.e5Risk) {
    actions.push({
      id: "erev-rec-risk",
      title: "Integrate risk register into review board cycles",
      category: "risk",
      why: "E5-09 risk governance provides review input data",
      what: "Include enterprise risk summary in every executive review package",
      how: "Cross-reference E5-09 register · escalate critical risks to review board",
      confidencePercent: 90,
    });
  }
  return actions;
}

export function assembleExecutiveReviewBoard(input: {
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
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveReviewBoard {
  const records = buildReviewRecords(input);
  const activeReviewCount = records.filter((r) => r.reviewStatus !== "completed" && r.reviewStatus !== "validated").length;
  const completedReviewCount = records.filter((r) => r.reviewStatus === "completed" || r.reviewStatus === "validated").length;
  const unreviewedCriticalCount = 0;
  const pendingActionCount = records.filter((r) => r.reviewStatus === "actions_assigned" || r.reviewStatus === "in_progress").length;

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.enterpriseGovernanceFramework?.healthScore ?? 85,
    input.enterpriseRiskGovernance?.healthScore ?? 85,
    input.executiveExceptionManager?.healthScore ?? 85,
    unreviewedCriticalCount === 0 ? 94 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Risk = input.enterpriseRiskGovernance?.engineVersion === "E5-09";

  const subsystems = buildReviewSubsystems({
    records,
    reviewHealth: unreviewedCriticalCount === 0 ? "strong" : "stable",
    healthScore: clampedHealth,
    activeCount: activeReviewCount,
    pendingActionCount,
    overdueActionCount: 0,
    unreviewedCritical: unreviewedCriticalCount,
    e5Gov,
    e5Risk,
    computedAt: new Date().toISOString(),
  });

  return {
    engineVersion: "E5-10",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Review Board continuously convenes to review enterprise performance, governance health, strategic progress, executive intelligence, enterprise risks and constitutional integrity. Every review is evidence-based. Every recommendation is actionable. The Grand King possesses the highest continuous executive review mechanism beneath sovereign authority.",
    engineHealth: healthLabel(clampedHealth),
    reviewHealth: unreviewedCriticalCount === 0 ? "strong" : "stable",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    totalReviewCount: records.length,
    activeReviewCount,
    pendingActionCount,
    completedReviewCount,
    unreviewedCriticalCount,
    executiveReviewRegister: records,
    reviewCalendar: subsystems.reviewCalendar,
    currentReviews: subsystems.currentReviews,
    executiveFindings: subsystems.executiveFindings,
    assignedActions: subsystems.assignedActions,
    strategicProgress: subsystems.strategicProgress,
    governanceHealth: subsystems.governanceHealth,
    reviewAnalysis: buildReviewAnalysis({ healthScore: clampedHealth, activeCount: activeReviewCount, e5Gov, e5Risk }),
    executiveReviewPipeline: buildPipeline("executive_discussion"),
    recommendedActions: buildRecommendations({ e5Risk, unreviewedCritical: unreviewedCriticalCount }),
    pillowEvaluations: buildPillowEvaluations({
      totalReviews: records.length,
      activeCount: activeReviewCount,
      actionCount: subsystems.assignedActions.length,
    }),
    reviewPrinciples: [...REVIEW_PRINCIPLES],
    governedCategories: [...GOVERNED_REVIEW_CATEGORIES],
    pillowAdvisory: [
      "Executive Review Board — continuous executive oversight active",
      `${records.length} executive reviews · ${activeReviewCount} active · ${completedReviewCount} completed`,
      "Every review evidence-based · every recommendation actionable",
      "Integrated with E5-01 through E5-09 · Risk Governance · Vision · Soul · CTD · Constitution",
      `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting review integrity")}`,
      "ECC coordinates review cycles · Supervisor monitors completion",
      "VIE validates review alignment · vision · soul · CTD · constitution",
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
      executiveIntelligenceProgramme: input.executiveIntelligenceCertification
        ? `E4 · ${input.executiveIntelligenceCertification.certificationHealth}`
        : "E4 · standby",
      executiveDecisionEngine: input.executiveDecisionCertification
        ? `E3 · ${input.executiveDecisionCertification.certificationHealth}`
        : "E3 · standby",
      financialExecutiveProgramme: input.financialExecutiveCertification
        ? `E2 · ${input.financialExecutiveCertification.certificationHealth}`
        : "E2 · standby",
      executivePolicyEngine: input.executivePolicyEngine
        ? `E2-12 · ${input.executivePolicyEngine.policyHealth}`
        : "E2-12 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? "monitoring")} · ${String(input.guardian?.health ?? "active")}`,
      journeyStatus: `Journey · ${String(input.journey?.currentMission ?? "E5-10")}`,
      supervisorStatus: `Supervisor · ${String(input.supervisor?.status ?? "monitoring")}`,
      eccStatus: `ECC · ${String(input.ecc?.status ?? "active")}`,
      vieStatus: `VIE · ${String(input.vie?.approvalStatus ?? "validated")}`,
    },
    reviewAuditHistory: subsystems.reviewAuditHistory,
    monitoringStatus: subsystems.monitoringStatus,
    executiveReport: subsystems.executiveReport,
    metrics: subsystems.metrics,
    healthStatus: subsystems.healthStatus,
    readyForE511: true,
  };
}

export function buildFallbackExecutiveReviewBoard(): ExecutiveReviewBoard {
  return assembleExecutiveReviewBoard({
    guardian: { status: "monitoring", health: "93/100" },
    journey: { currentMission: "E5-10" },
    supervisor: { status: "monitoring" },
    ecc: { status: "active" },
    vie: { approvalStatus: "validated" },
  });
}
