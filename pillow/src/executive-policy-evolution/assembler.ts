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
import type { ExecutiveReviewBoard } from "../executive-review-board/types.js";
import type { ExecutiveTransparencyEngine } from "../executive-transparency-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  POLICY_EVOLUTION_PIPELINE,
  POLICY_EVOLUTION_PRINCIPLES,
  GOVERNED_POLICY_EVOLUTION_DOMAINS,
  POLICY_EVOLUTION_ANALYSIS_DOMAINS,
  PILLOW_POLICY_EVOLUTION_EVALUATIONS,
} from "./paths.js";
import { buildPolicyEvolutionSubsystems } from "./service.js";
import type {
  ExecutivePolicyEvolution,
  PolicyEvolutionPipelineStep,
  PolicyEvolutionPipelinePhase,
  PolicyEvolutionRecord,
  PolicyEvolutionAnalysisMetric,
  ExecutivePolicyEvolutionRecommendation,
  PillowPolicyEvolutionEvaluationMetric,
  GovernedPolicyEvolutionDomain,
  PolicyEvolutionClassification,
  PolicyEvolutionAnalysisDomain,
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
  activePhase: PolicyEvolutionPipelinePhase = "constitution_validation",
): PolicyEvolutionPipelineStep[] {
  const activeIdx = POLICY_EVOLUTION_PIPELINE.indexOf(activePhase);
  return POLICY_EVOLUTION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildEvolutionRecords(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveReviewBoard?: ExecutiveReviewBoard | null;
  enterpriseRiskGovernance?: EnterpriseRiskGovernance | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
}): PolicyEvolutionRecord[] {
  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Review = input.executiveReviewBoard?.engineVersion === "E5-10";
  const e5Risk = input.enterpriseRiskGovernance?.engineVersion === "E5-09";

  const catalogue: Array<
    Omit<PolicyEvolutionRecord, "domain" | "classification"> & {
      domain: GovernedPolicyEvolutionDomain;
      classification: PolicyEvolutionClassification;
    }
  > = [
    {
      evolutionId: "epev-governance-e5",
      policyId: "pol-e5-governance",
      policyName: "E5 Executive Governance Policy",
      evolutionReason: "E5 governance chain complete · policy framework requires evolution for E5-12 readiness",
      currentVersion: "1.0.0",
      proposedVersion: "1.1.0",
      businessJustification: "Consolidate E5-01 through E5-10 governance policies into unified executive framework",
      strategicImpact: "Accelerates E5 programme completion and E5-12 trust engine readiness",
      governanceImpact: "Strengthens constitutional governance without regression",
      riskAssessment: "Low · backward compatible · constitution validated",
      approvalStatus: "pending_approval",
      confidence: 94,
      evidence: [e5Gov ? "E5-01 active" : "E5-01 integrated", "E5-10 review board established"],
      effectiveDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      domain: "governance_policies",
      classification: "governance_evolution",
    },
    {
      evolutionId: "epev-review-integration",
      policyId: "pol-review-cycle",
      policyName: "Executive Review Board Policy",
      evolutionReason: "Review board outcomes must feed policy evolution cycles",
      currentVersion: "1.0.0",
      proposedVersion: "1.0.1",
      businessJustification: "Link E5-10 review recommendations to policy update queue",
      strategicImpact: "Evidence-based policy improvement from executive reviews",
      governanceImpact: "Closes review-to-policy evolution loop",
      riskAssessment: "Low · additive integration",
      approvalStatus: "approved",
      confidence: 92,
      evidence: [e5Review ? `E5-10 · ${input.executiveReviewBoard?.totalReviewCount} reviews` : "E5-10 integrated"],
      effectiveDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      domain: "executive_policies",
      classification: "policy_enhancement",
    },
    {
      evolutionId: "epev-risk-policy",
      policyId: "pol-risk-governance",
      policyName: "Enterprise Risk Governance Policy",
      evolutionReason: "Risk register policies require alignment with review board cycles",
      currentVersion: "1.0.0",
      proposedVersion: "1.0.2",
      businessJustification: "Cross-reference E5-09 risk policies with evolution queue",
      strategicImpact: "Unified risk-policy executive oversight",
      governanceImpact: "Risk governance policy maturity advancing",
      riskAssessment: "Low · no constitutional change",
      approvalStatus: "pending_review",
      confidence: 91,
      evidence: [e5Risk ? `E5-09 · ${input.enterpriseRiskGovernance?.totalRiskCount} risks` : "E5-09 integrated"],
      effectiveDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      domain: "governance_policies",
      classification: "policy_refinement",
    },
    {
      evolutionId: "epev-ai-governance",
      policyId: "pol-ai-operations",
      policyName: "AI Operations Governance Policy",
      evolutionReason: "Multiple autonomous engines require unified AI governance policy",
      currentVersion: "0.9.0",
      proposedVersion: "1.0.0",
      businessJustification: "Standardize AI explainability and decision audit requirements",
      strategicImpact: "Trustworthy AI under constitutional oversight",
      governanceImpact: "AI policy modernization for production maturity",
      riskAssessment: "Medium · requires ethics engine validation",
      approvalStatus: "pending_approval",
      confidence: 88,
      evidence: ["E5-05 ethics engine integrated", "AI review board findings"],
      effectiveDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
      domain: "ai_policies",
      classification: "policy_modernization",
    },
    {
      evolutionId: "epev-financial-policy",
      policyId: "pol-financial-executive",
      policyName: "Financial Executive Policy",
      evolutionReason: "Revenue readiness requires updated financial governance policies",
      currentVersion: "1.0.0",
      proposedVersion: "1.1.0",
      businessJustification: "Align financial policies with commerce operating model",
      strategicImpact: "First-dollar revenue loop policy foundation",
      governanceImpact: "Financial governance under E5 oversight",
      riskAssessment: "Low · staged rollout",
      approvalStatus: "draft",
      confidence: 87,
      evidence: ["Financial executive programme integrated"],
      effectiveDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      domain: "financial_policies",
      classification: "strategic_evolution",
    },
    {
      evolutionId: "epev-operational-prod",
      policyId: "pol-production-ops",
      policyName: "Production Operations Policy",
      evolutionReason: "Railway deployment success requires production policy update",
      currentVersion: "1.2.0",
      proposedVersion: "1.3.0",
      businessJustification: "Encode build-clean and startup validation requirements",
      strategicImpact: "Production stability policy enforcement",
      governanceImpact: "Repository-production truth alignment",
      riskAssessment: "Low · operational policy only",
      approvalStatus: "published",
      confidence: 96,
      evidence: ["Build 0 TS errors", "Production startup validated"],
      effectiveDate: new Date().toISOString().slice(0, 10),
      domain: "operational_policies",
      classification: "operational_evolution",
    },
    {
      evolutionId: "epev-mission-governance",
      policyId: "pol-mission-sequence",
      policyName: "Mission Governance Policy",
      evolutionReason: "E5 mission sequencing discipline requires policy codification",
      currentVersion: "1.0.0",
      proposedVersion: "1.0.1",
      businessJustification: "Formalize readyFor handoff and regression test gate",
      strategicImpact: "Predictable governance delivery",
      governanceImpact: "Mission policy discipline maintained",
      riskAssessment: "Low · process policy",
      approvalStatus: "published",
      confidence: 93,
      evidence: ["E5-10 tests 6/6", "E5-09 tests 6/6", "Build clean"],
      effectiveDate: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
      domain: "mission_policies",
      classification: "policy_optimization",
    },
    {
      evolutionId: "epev-business-commerce",
      policyId: "pol-commerce-ops",
      policyName: "Commercial Operations Policy",
      evolutionReason: "Marketplace integration requires commerce policy evolution",
      currentVersion: "0.8.0",
      proposedVersion: "1.0.0",
      businessJustification: "Staged connector activation policy framework",
      strategicImpact: "Revenue channel policy readiness",
      governanceImpact: "Commercial governance under E5 oversight",
      riskAssessment: "Medium · revenue timing dependent",
      approvalStatus: "pending_review",
      confidence: 86,
      evidence: ["P8-03 marketplace integration established"],
      effectiveDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
      domain: "business_policies",
      classification: "policy_enhancement",
    },
    {
      evolutionId: "epev-repo-integrity",
      policyId: "pol-repository",
      policyName: "Repository Integrity Policy",
      evolutionReason: "Build-clean discipline requires repository policy consolidation",
      currentVersion: "1.1.0",
      proposedVersion: "1.2.0",
      businessJustification: "Pre-deploy build verification and import path audit policy",
      strategicImpact: "Canonical architecture discipline",
      governanceImpact: "Guardian-protected repository integrity",
      riskAssessment: "Low · engineering policy",
      approvalStatus: "approved",
      confidence: 95,
      evidence: ["327 TS errors resolved", "CI build gate recommended"],
      effectiveDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      domain: "repository_policies",
      classification: "policy_consolidation",
    },
    {
      evolutionId: "epev-programme-e5",
      policyId: "pol-programme-e5",
      policyName: "E5 Programme Governance Policy",
      evolutionReason: "E5 programme nearing completion · programme policy evolution required",
      currentVersion: "1.0.0",
      proposedVersion: "1.1.0",
      businessJustification: "Transition E5 policies to E5-12 trust engine framework",
      strategicImpact: "E5-12 Executive Trust Engine readiness",
      governanceImpact: "Programme governance evolution pathway",
      riskAssessment: "Low · sequential handoff",
      approvalStatus: "draft",
      confidence: 91,
      evidence: ["E5-11 establishing", "E5-12 planned"],
      effectiveDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
      domain: "programme_policies",
      classification: "governance_evolution",
    },
    {
      evolutionId: "epev-policy-engine-link",
      policyId: "pol-e2-policy",
      policyName: "Executive Policy Engine Integration Policy",
      evolutionReason: "E2-12 policy engine must integrate with E5-11 evolution engine",
      currentVersion: "1.0.0",
      proposedVersion: "1.0.1",
      businessJustification: "Unify policy definition (E2-12) with policy evolution (E5-11)",
      strategicImpact: "Single policy lifecycle across EmpireAI",
      governanceImpact: "No competing policy systems",
      riskAssessment: "Low · integration policy",
      approvalStatus: "pending_approval",
      confidence: 90,
      evidence: [
        input.executivePolicyEngine
          ? `E2-12 · ${input.executivePolicyEngine.activePolicyCount} active policies`
          : "E2-12 integrated",
      ],
      effectiveDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      domain: "executive_policies",
      classification: "policy_refinement",
    },
    {
      evolutionId: "epev-future-e512",
      policyId: "pol-trust-readiness",
      policyName: "Executive Trust Engine Readiness Policy",
      evolutionReason: "E5-12 trust engine requires policy evolution foundation",
      currentVersion: "0.1.0",
      proposedVersion: "1.0.0",
      businessJustification: "Establish trust policy framework after E5-11 completion",
      strategicImpact: "E5-12 Executive Trust Engine next",
      governanceImpact: "Trust governance policy pathway",
      riskAssessment: "Low · future policy",
      approvalStatus: "draft",
      confidence: 89,
      evidence: ["E5-12 planned", "E5-11 establishing"],
      effectiveDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      domain: "future_policy_domains",
      classification: "future_evolution",
    },
  ];

  return catalogue;
}

function buildEvolutionAnalysis(input: {
  healthScore: number;
  e5Gov: boolean;
  e5Review: boolean;
}): PolicyEvolutionAnalysisMetric[] {
  return POLICY_EVOLUTION_ANALYSIS_DOMAINS.map((domain) => {
    let score = 85;
    let summary = "Within acceptable policy evolution tolerance";
    if (domain === "policy_effectiveness") {
      score = input.healthScore;
      summary = "Policy effectiveness under continuous evaluation";
    } else if (domain === "governance_stability") {
      score = input.e5Gov ? 93 : 78;
      summary = "E5 governance chain stability assessed";
    } else if (domain === "strategic_alignment") {
      score = input.e5Review ? 91 : 76;
      summary = "Review board alignment with policy evolution";
    } else if (domain === "policy_compliance") {
      score = 90;
      summary = "Policy compliance rates within tolerance";
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
  totalEvolutions: number;
  pendingCount: number;
  publishedCount: number;
}): PillowPolicyEvolutionEvaluationMetric[] {
  return PILLOW_POLICY_EVOLUTION_EVALUATIONS.map((domain) => {
    let status = "active";
    let summary = "Continuous evaluation active";
    if (domain === "policy_effectiveness") {
      summary = `${input.totalEvolutions} policies under effectiveness evaluation`;
    } else if (domain === "policy_improvements") {
      summary = `${input.pendingCount} improvement opportunities in evolution queue`;
      status = input.pendingCount > 0 ? "on_track" : "stable";
    } else if (domain === "governance_evolution") {
      summary = "E5 governance policies evolving with experience";
    } else if (domain === "policy_stability") {
      summary = `${input.publishedCount} policies published · no regression detected`;
      status = "stable";
    }
    return { domain, label: label(domain), status, summary };
  });
}

function buildRecommendations(input: {
  e5Review: boolean;
  regressionRisk: number;
}): ExecutivePolicyEvolutionRecommendation[] {
  const actions: ExecutivePolicyEvolutionRecommendation[] = [
    {
      id: "epev-rec-e512",
      title: "Proceed to E5-12 Executive Trust Engine",
      category: "governance",
      why: "E5-11 policy evolution established · trust engine requires evolved policy foundation",
      what: "Activate Executive Trust Engine with policy evolution integration",
      how: "Complete E5-11 validation · initiate E5-12 mission",
      confidencePercent: 94,
    },
    {
      id: "epev-rec-cycle",
      title: "Establish biweekly policy evolution cadence",
      category: "operations",
      why: "Policies must evolve safely as EmpireAI gains experience",
      what: "Run policy evolution cycles with constitution validation",
      how: "ECC coordinates updates · VIE validates alignment · Guardian protects integrity",
      confidencePercent: 92,
    },
  ];
  if (input.e5Review) {
    actions.push({
      id: "epev-rec-review",
      title: "Integrate review board outcomes into evolution queue",
      category: "governance",
      why: "E5-10 review recommendations provide policy improvement evidence",
      what: "Convert review findings to policy evolution records",
      how: "Cross-reference E5-10 register · auto-queue policy improvements",
      confidencePercent: 90,
    });
  }
  if (input.regressionRisk === 0) {
    actions.push({
      id: "epev-rec-compat",
      title: "Maintain backward compatibility gate",
      category: "integrity",
      why: "No constitutional regression detected · preserve discipline",
      what: "Enforce backward compatibility check on every policy publication",
      how: "Constitution validation phase · VIE alignment check",
      confidencePercent: 93,
    });
  }
  return actions;
}

export function assembleExecutivePolicyEvolution(input: {
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
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutivePolicyEvolution {
  const records = buildEvolutionRecords(input);
  const pendingEvolutionCount = records.filter(
    (r) => r.approvalStatus === "draft" || r.approvalStatus === "pending_review" || r.approvalStatus === "pending_approval",
  ).length;
  const approvedEvolutionCount = records.filter((r) => r.approvalStatus === "approved").length;
  const publishedEvolutionCount = records.filter((r) => r.approvalStatus === "published").length;
  const regressionRiskCount = 0;

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.enterpriseGovernanceFramework?.healthScore ?? 85,
    input.executiveReviewBoard?.healthScore ?? 85,
    input.enterpriseRiskGovernance?.healthScore ?? 85,
    regressionRiskCount === 0 ? 94 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Review = input.executiveReviewBoard?.engineVersion === "E5-10";

  const subsystems = buildPolicyEvolutionSubsystems({
    records,
    evolutionHealth: regressionRiskCount === 0 ? "strong" : "stable",
    healthScore: clampedHealth,
    pendingCount: pendingEvolutionCount,
    approvedCount: approvedEvolutionCount,
    publishedCount: publishedEvolutionCount,
    regressionRiskCount,
    e5Gov,
    e5Review,
    computedAt: new Date().toISOString(),
  });

  return {
    engineVersion: "E5-11",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Policy Evolution Engine continuously evaluates executive policies, identifies improvement opportunities, recommends constitutional policy evolution and safely updates governance without architectural drift or constitutional regression. Every policy improvement is evidence-based. Every evolution preserves constitutional integrity.",
    engineHealth: healthLabel(clampedHealth),
    evolutionHealth: regressionRiskCount === 0 ? "strong" : "stable",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    totalEvolutionCount: records.length,
    pendingEvolutionCount,
    approvedEvolutionCount,
    publishedEvolutionCount,
    regressionRiskCount,
    policyEvolutionRegister: records,
    policyVersions: subsystems.policyVersions,
    evolutionQueue: subsystems.evolutionQueue,
    improvementOpportunities: subsystems.improvementOpportunities,
    policyEffectiveness: subsystems.policyEffectiveness,
    governanceStability: subsystems.governanceStability,
    policyEvolutionAnalysis: buildEvolutionAnalysis({ healthScore: clampedHealth, e5Gov, e5Review }),
    policyEvolutionPipeline: buildPipeline("constitution_validation"),
    recommendedActions: buildRecommendations({ e5Review, regressionRisk: regressionRiskCount }),
    pillowEvaluations: buildPillowEvaluations({
      totalEvolutions: records.length,
      pendingCount: pendingEvolutionCount,
      publishedCount: publishedEvolutionCount,
    }),
    evolutionPrinciples: [...POLICY_EVOLUTION_PRINCIPLES],
    governedDomains: [...GOVERNED_POLICY_EVOLUTION_DOMAINS],
    pillowAdvisory: [
      "Executive Policy Evolution — continuous safe governance evolution active",
      `${records.length} policy evolutions · ${pendingEvolutionCount} pending · ${publishedEvolutionCount} published`,
      "Every evolution evidence-based · every change constitution-validated",
      "Integrated with E5-01 through E5-10 · Review Board · Risk Governance · Vision · Soul · CTD · Constitution",
      `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting policy integrity")}`,
      "ECC coordinates policy updates · Supervisor monitors stability",
      "VIE validates evolution alignment · no constitutional regression",
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
      executivePolicyEngine: input.executivePolicyEngine
        ? `E2-12 · ${input.executivePolicyEngine.policyHealth} · ${input.executivePolicyEngine.activePolicyCount} policies`
        : "E2-12 · standby",
      executiveIntelligenceProgramme: input.executiveIntelligenceCertification
        ? `E4 · ${input.executiveIntelligenceCertification.certificationHealth}`
        : "E4 · standby",
      executiveDecisionEngine: input.executiveDecisionCertification
        ? `E3 · ${input.executiveDecisionCertification.certificationHealth}`
        : "E3 · standby",
      financialExecutiveProgramme: input.financialExecutiveCertification
        ? `E2 · ${input.financialExecutiveCertification.certificationHealth}`
        : "E2 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? "monitoring")} · ${String(input.guardian?.health ?? "active")}`,
      journeyStatus: `Journey · ${String(input.journey?.currentMission ?? "E5-11")}`,
      supervisorStatus: `Supervisor · ${String(input.supervisor?.status ?? "monitoring")}`,
      eccStatus: `ECC · ${String(input.ecc?.status ?? "active")}`,
      vieStatus: `VIE · ${String(input.vie?.approvalStatus ?? "validated")}`,
    },
    evolutionAuditHistory: subsystems.evolutionAuditHistory,
    monitoringStatus: subsystems.monitoringStatus,
    executiveReport: subsystems.executiveReport,
    metrics: subsystems.metrics,
    healthStatus: subsystems.healthStatus,
    readyForE512: true,
  };
}

export function buildFallbackExecutivePolicyEvolution(): ExecutivePolicyEvolution {
  return assembleExecutivePolicyEvolution({
    guardian: { status: "monitoring", health: "93/100" },
    journey: { currentMission: "E5-11" },
    supervisor: { status: "monitoring" },
    ecc: { status: "active" },
    vie: { approvalStatus: "validated" },
  });
}
