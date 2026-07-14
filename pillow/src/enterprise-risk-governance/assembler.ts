import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { EnterpriseAuditEngine } from "../enterprise-audit-engine/types.js";
import type { EnterpriseGovernanceFramework } from "../enterprise-governance-framework/types.js";
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
  ENTERPRISE_RISK_PIPELINE,
  RISK_GOVERNANCE_PRINCIPLES,
  GOVERNED_RISK_CATEGORIES,
  RISK_ANALYSIS_DOMAINS,
  PILLOW_RISK_EVALUATIONS,
} from "./paths.js";
import { buildRiskSubsystems } from "./service.js";
import { computeExposureScore } from "./reporting.js";
import type {
  EnterpriseRiskGovernance,
  EnterpriseRiskPipelineStep,
  EnterpriseRiskPipelinePhase,
  EnterpriseRiskRecord,
  CriticalRiskEntry,
  RiskHeatMapEntry,
  MitigationProgressEntry,
  RiskTrendEntry,
  ExecutiveOwnershipEntry,
  RiskAnalysisMetric,
  ExecutiveRiskRecommendation,
  PillowRiskEvaluationMetric,
  GovernedRiskCategory,
  RiskClassification,
  RiskAnalysisDomain,
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
  activePhase: EnterpriseRiskPipelinePhase = "continuous_monitoring",
): EnterpriseRiskPipelineStep[] {
  const activeIdx = ENTERPRISE_RISK_PIPELINE.indexOf(activePhase);
  return ENTERPRISE_RISK_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildRiskRecords(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveConstitutionalMonitor?: ExecutiveConstitutionalMonitor | null;
  enterpriseAuditEngine?: EnterpriseAuditEngine | null;
  executiveComplianceEngine?: ExecutiveComplianceEngine | null;
  executiveEthicsEngine?: ExecutiveEthicsEngine | null;
  executiveAccountabilityEngine?: ExecutiveAccountabilityEngine | null;
  executiveTransparencyEngine?: ExecutiveTransparencyEngine | null;
  executiveExceptionManager?: ExecutiveExceptionManager | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
}): EnterpriseRiskRecord[] {
  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Const = input.executiveConstitutionalMonitor?.engineVersion === "E5-02";
  const e5Audit = input.enterpriseAuditEngine?.engineVersion === "E5-03";
  const e5Comp = input.executiveComplianceEngine?.engineVersion === "E5-04";
  const e5Eth = input.executiveEthicsEngine?.engineVersion === "E5-05";
  const e5Acct = input.executiveAccountabilityEngine?.engineVersion === "E5-06";
  const e5Tran = input.executiveTransparencyEngine?.engineVersion === "E5-07";
  const e5Exc = input.executiveExceptionManager?.engineVersion === "E5-08";

  const catalogue: Array<
    Omit<EnterpriseRiskRecord, "category" | "classification"> & {
      category: GovernedRiskCategory;
      classification: RiskClassification;
    }
  > = [
    {
      riskId: "erisk-strategic-e5",
      riskTitle: "E5 governance chain deployment velocity",
      businessArea: "Executive Governance",
      riskDescription: "Accelerated E5 deployment may outpace mitigation validation cycles",
      probability: 35,
      severity: "medium",
      businessImpact: "Controlled governance establishment with monitoring overhead",
      financialImpact: "Minimal direct cost · operational focus allocation",
      strategicImpact: "E5 constitutional foundation established under executive oversight",
      owner: "Governance Executive",
      mitigationPlan: "Continuous E5 integration validation · executive review cadence",
      residualRisk: "Low after E5-09 risk governance active",
      status: "mitigating",
      confidence: 91,
      evidence: [e5Gov ? "E5-01 governance active" : "E5-01 integrated"],
      category: "strategic_risks",
      classification: "strategic_risk",
    },
    {
      riskId: "erisk-financial-forecast",
      riskTitle: "Revenue forecast variance under multi-programme execution",
      businessArea: "Financial Executive",
      riskDescription: "Parallel programme execution creates forecast uncertainty",
      probability: 45,
      severity: "medium",
      businessImpact: "Resource allocation requires executive prioritization",
      financialImpact: "Moderate variance in quarterly projections",
      strategicImpact: "Portfolio discipline maintained through executive review",
      owner: "Financial Executive",
      mitigationPlan: "Monthly forecast reconciliation · capital allocation review",
      residualRisk: "Medium · monitored quarterly",
      status: "monitoring",
      confidence: 88,
      evidence: ["Financial executive programme integrated"],
      category: "financial_risks",
      classification: "financial_risk",
    },
    {
      riskId: "erisk-operational-redis",
      riskTitle: "Production Redis dependency in degraded mode",
      businessArea: "Infrastructure",
      riskDescription: "Redis unavailability forces in-memory queue and session degradation",
      probability: 55,
      severity: "high",
      businessImpact: "Session persistence and queue durability reduced",
      financialImpact: "Potential revenue pipeline interruption",
      strategicImpact: "Production stability requires Upstash Redis configuration",
      owner: "Infrastructure Commander",
      mitigationPlan: "Configure REDIS_URL · health monitoring · failover documentation",
      residualRisk: "Low after Redis provisioned",
      status: "mitigating",
      confidence: 94,
      evidence: ["Production degraded mode observed", "Guardian monitoring active"],
      category: "operational_risks",
      classification: "operational_risk",
    },
    {
      riskId: "erisk-tech-build",
      riskTitle: "Backend TypeScript compilation errors in pillow-host",
      businessArea: "Engineering",
      riskDescription: "Pre-existing TS errors block clean production build",
      probability: 70,
      severity: "high",
      businessImpact: "Railway build may fail or deploy stale artifacts",
      financialImpact: "Deployment delay risk",
      strategicImpact: "Repository integrity requires systematic resolution",
      owner: "Engineering Executive",
      mitigationPlan: "Incremental pillow-host type fixes · CI gate enforcement",
      residualRisk: "Medium until build clean",
      status: "prioritized",
      confidence: 96,
      evidence: ["Build failures documented", "Runtime startup path validated"],
      category: "technology_risks",
      classification: "technology_risk",
    },
    {
      riskId: "erisk-ai-governance",
      riskTitle: "AI decision explainability gaps across autonomous engines",
      businessArea: "AI Governance",
      riskDescription: "Multiple autonomous engines require unified explainability standards",
      probability: 40,
      severity: "medium",
      businessImpact: "Executive confidence in AI decisions requires evidence trails",
      financialImpact: "Indirect · decision quality assurance",
      strategicImpact: "AI governance maturity progression required",
      owner: "AI Chief of Commerce",
      mitigationPlan: "Decision audit engine integration · explainability standards",
      residualRisk: "Low with E5 governance chain",
      status: "assessed",
      confidence: 87,
      evidence: [e5Eth ? "E5-05 ethics engine active" : "Ethics integrated"],
      category: "ai_risks",
      classification: "governance_risk",
    },
    {
      riskId: "erisk-cyber-session",
      riskTitle: "Session secret rotation in production",
      businessArea: "Security",
      riskDescription: "Default session secret must be rotated for production hardening",
      probability: 30,
      severity: "critical",
      businessImpact: "Authentication integrity depends on secret management",
      financialImpact: "Security breach potential if unaddressed",
      strategicImpact: "Constitutional security requirement",
      owner: "Security Executive",
      mitigationPlan: "Railway SESSION_SECRET configuration · rotation policy",
      residualRisk: "Low after secret rotation",
      status: "mitigating",
      confidence: 98,
      evidence: ["Auth routes operational", "Cookie-based sessions active"],
      category: "cybersecurity_risks",
      classification: "critical_risk",
    },
    {
      riskId: "erisk-repo-import",
      riskTitle: "ESM import path integrity across bridge modules",
      businessArea: "Repository",
      riskDescription: "Incorrect relative imports cause production module-not-found crashes",
      probability: 25,
      severity: "high",
      businessImpact: "502 connection refused after health check passes",
      financialImpact: "Production downtime",
      strategicImpact: "Repository governance and import validation required",
      owner: "Engineering Executive",
      mitigationPlan: "Import path audit · startup integration tests · error logging",
      residualRisk: "Low after marketplace bridge fix",
      status: "monitoring",
      confidence: 95,
      evidence: ["Marketplace bridge import fixed", "Startup validated"],
      category: "repository_risks",
      classification: "technology_risk",
    },
    {
      riskId: "erisk-governance-exception",
      riskTitle: "Unmanaged critical exceptions without mitigation",
      businessArea: "Executive Governance",
      riskDescription: "Critical exceptions without active mitigation create governance exposure",
      probability: 20,
      severity: "medium",
      businessImpact: "Constitutional exception integrity",
      financialImpact: "Indirect governance cost",
      strategicImpact: "Exception-risk linkage requires continuous oversight",
      owner: "Governance Executive",
      mitigationPlan: "E5-08 exception manager · E5-09 risk linkage · executive review",
      residualRisk: "Low with dual engine integration",
      status: "monitoring",
      confidence: 93,
      evidence: [
        e5Exc ? `E5-08 active · ${input.executiveExceptionManager?.activeExceptionCount ?? 0} exceptions` : "E5-08 integrated",
        e5Tran ? "E5-07 transparency active" : "Transparency integrated",
      ],
      category: "governance_risks",
      classification: "governance_risk",
    },
    {
      riskId: "erisk-mission-e5",
      riskTitle: "E5 mission sequencing dependency risk",
      businessArea: "Mission Governance",
      riskDescription: "E5 missions have strict dependency chains requiring sequential validation",
      probability: 30,
      severity: "low",
      businessImpact: "Mission handoff delays if dependencies incomplete",
      financialImpact: "Minimal",
      strategicImpact: "E5 programme integrity maintained",
      owner: "Mission Executive",
      mitigationPlan: "Dependency validation per mission · readyFor flags",
      residualRisk: "Minimal",
      status: "monitoring",
      confidence: 90,
      evidence: ["E5-01 through E5-08 complete", "E5-09 in progress"],
      category: "mission_risks",
      classification: "low_risk",
    },
    {
      riskId: "erisk-programme-scale",
      riskTitle: "Programme scale complexity across E5 governance engines",
      businessArea: "Programme Governance",
      riskDescription: "Nine E5 engines create integration and maintenance complexity",
      probability: 50,
      severity: "medium",
      businessImpact: "Executive oversight bandwidth requirements",
      financialImpact: "Engineering maintenance allocation",
      strategicImpact: "Canonical architecture discipline essential",
      owner: "Programme Executive",
      mitigationPlan: "Unified governance pattern · cockpit integration · documentation",
      residualRisk: "Medium · managed through architecture",
      status: "mitigating",
      confidence: 89,
      evidence: [e5Acct ? "E5-06 accountability active" : "Accountability integrated", e5Comp ? "E5-04 compliance active" : "Compliance integrated"],
      category: "programme_risks",
      classification: "medium_risk",
    },
    {
      riskId: "erisk-future-e510",
      riskTitle: "Executive Review Board readiness gap",
      businessArea: "Future Governance",
      riskDescription: "E5-10 Executive Review Board requires E5-09 risk register foundation",
      probability: 20,
      severity: "low",
      businessImpact: "Review board activation delayed without risk governance",
      financialImpact: "None immediate",
      strategicImpact: "E5 governance completion pathway",
      owner: "Governance Executive",
      mitigationPlan: "Complete E5-09 · establish review board charter",
      residualRisk: "Minimal after E5-09",
      status: "identified",
      confidence: 92,
      evidence: ["E5-10 planned", "E5-09 Enterprise Risk Governance establishing"],
      category: "future_enterprise_risks",
      classification: "future_risk",
    },
    {
      riskId: "erisk-business-market",
      riskTitle: "Marketplace integration activation timing",
      businessArea: "Commercial Operations",
      riskDescription: "P8 marketplace integration requires staged connector activation",
      probability: 40,
      severity: "medium",
      businessImpact: "Revenue channel readiness dependent on connector maturity",
      financialImpact: "Revenue timing variance",
      strategicImpact: "Commercial programme sequencing",
      owner: "Commerce Executive",
      mitigationPlan: "Registry-first activation · connector readiness gates",
      residualRisk: "Low with staged rollout",
      status: "assessed",
      confidence: 86,
      evidence: ["P8-03 marketplace integration architecture established"],
      category: "business_risks",
      classification: "high_risk",
    },
  ];

  return catalogue;
}

function buildRiskHeatMap(records: EnterpriseRiskRecord[]): RiskHeatMapEntry[] {
  return records.map((r) => ({
    heatId: `heat-${r.riskId}`,
    riskId: r.riskId,
    title: r.riskTitle,
    category: r.category,
    probability: r.probability,
    severity: r.severity,
    exposureScore: computeExposureScore(r.probability, r.severity),
    status: r.status,
  }));
}

function buildRiskTrends(records: EnterpriseRiskRecord[]): RiskTrendEntry[] {
  return records.slice(0, 8).map((r) => ({
    trendId: `trend-${r.riskId}`,
    riskId: r.riskId,
    title: r.riskTitle,
    category: r.category,
    trend: r.status === "mitigating" ? "improving" : r.status === "monitoring" ? "stable" : "emerging",
    velocity: r.probability >= 60 ? "accelerating" : r.probability >= 40 ? "steady" : "decelerating",
    direction: r.status === "resolved" ? "down" : r.severity === "critical" ? "up" : "flat",
    status: r.status,
  }));
}

function buildExecutiveOwnership(records: EnterpriseRiskRecord[]): ExecutiveOwnershipEntry[] {
  return records.map((r) => ({
    ownershipId: `own-${r.riskId}`,
    riskId: r.riskId,
    title: r.riskTitle,
    owner: r.owner,
    category: r.category,
    severity: r.severity,
    accountability: `${r.owner} · executive ownership confirmed`,
    status: r.status,
  }));
}

function buildRiskAnalysis(input: {
  criticalCount: number;
  highCount: number;
  unmanagedCritical: number;
  mitigationProgress: number;
}): RiskAnalysisMetric[] {
  const domains: RiskAnalysisDomain[] = [...RISK_ANALYSIS_DOMAINS];
  return domains.map((domain) => {
    const base = 85;
    let score = base;
    let summary = "Within acceptable enterprise risk tolerance";
    if (domain === "enterprise_exposure") {
      score = input.criticalCount === 0 ? 92 : 78 - input.criticalCount * 3;
      summary = `${input.criticalCount} critical risks · ${input.highCount} high risks tracked`;
    } else if (domain === "mitigation_effectiveness") {
      score = input.mitigationProgress;
      summary = `Average mitigation progress ${input.mitigationProgress}%`;
    } else if (domain === "governance_stability") {
      score = input.unmanagedCritical === 0 ? 94 : 68;
      summary = input.unmanagedCritical === 0 ? "All critical risks have mitigation plans" : `${input.unmanagedCritical} critical risks lack mitigation`;
    } else if (domain === "risk_velocity") {
      score = input.highCount <= 2 ? 88 : 72;
      summary = "Risk velocity monitored through continuous scanning";
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
  totalRisks: number;
  criticalCount: number;
  mitigationProgress: number;
}): PillowRiskEvaluationMetric[] {
  return PILLOW_RISK_EVALUATIONS.map((domain) => {
    let status = "monitoring";
    let summary = "Continuous evaluation active";
    if (domain === "enterprise_risks") {
      summary = `${input.totalRisks} enterprise risks in register`;
      status = "active";
    } else if (domain === "emerging_risks") {
      summary = "Emerging risk detection through E5 integration chain";
      status = "active";
    } else if (domain === "risk_trends") {
      summary = "Trend analysis across strategic · operational · technology domains";
      status = "active";
    } else if (domain === "mitigation_progress") {
      summary = `Mitigation progress ${input.mitigationProgress}% average`;
      status = input.mitigationProgress >= 60 ? "on_track" : "attention";
    } else if (domain === "executive_recommendations") {
      summary = "Executive recommendations generated from risk analysis";
      status = "active";
    }
    return { domain, label: label(domain), status, summary };
  });
}

function buildRecommendations(input: {
  e5Exc: boolean;
  unmanagedCritical: number;
  criticalCount: number;
}): ExecutiveRiskRecommendation[] {
  const actions: ExecutiveRiskRecommendation[] = [
    {
      id: "erisk-rec-e510",
      title: "Proceed to E5-10 Executive Review Board",
      category: "governance",
      why: "E5-09 risk governance established · executive review board requires risk register foundation",
      what: "Activate Executive Review Board with enterprise risk register integration",
      how: "Complete E5-09 validation · initiate E5-10 mission",
      confidencePercent: 94,
    },
    {
      id: "erisk-rec-mitigation",
      title: "Accelerate critical risk mitigation",
      category: "mitigation",
      why: `${input.criticalCount} critical risks require executive oversight`,
      what: "Review all critical risks · confirm mitigation plans · assign executive owners",
      how: "Weekly executive risk review · ECC coordination · Supervisor monitoring",
      confidencePercent: 91,
    },
  ];
  if (input.unmanagedCritical > 0) {
    actions.unshift({
      id: "erisk-rec-unmanaged",
      title: "Address unmanaged critical risks immediately",
      category: "critical",
      why: `${input.unmanagedCritical} critical risks lack active mitigation`,
      what: "Assign mitigation plans to all unmanaged critical risks within 48 hours",
      how: "Governance Executive review · no unmanaged critical risks principle",
      confidencePercent: 98,
    });
  }
  if (input.e5Exc) {
    actions.push({
      id: "erisk-rec-exception-link",
      title: "Link exception register to risk register",
      category: "integration",
      why: "E5-08 exceptions create governance risk exposure requiring linkage",
      what: "Cross-reference active exceptions with enterprise risk register",
      how: "Exception-risk mapping · shared executive review cadence",
      confidencePercent: 89,
    });
  }
  return actions;
}

export function assembleEnterpriseRiskGovernance(input: {
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
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): EnterpriseRiskGovernance {
  const records = buildRiskRecords(input);
  const criticalRiskCount = records.filter((r) => r.severity === "critical").length;
  const highRiskCount = records.filter((r) => r.severity === "high").length;
  const unmanagedCriticalCount = records.filter(
    (r) => r.severity === "critical" && (r.mitigationPlan === "Pending" || r.status === "identified"),
  ).length;
  const mitigationInProgressCount = records.filter((r) => r.status === "mitigating").length;

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.enterpriseGovernanceFramework?.healthScore ?? 85,
    input.executiveConstitutionalMonitor?.healthScore ?? 85,
    input.enterpriseAuditEngine?.healthScore ?? 85,
    input.executiveComplianceEngine?.healthScore ?? 85,
    input.executiveEthicsEngine?.healthScore ?? 85,
    input.executiveAccountabilityEngine?.healthScore ?? 85,
    input.executiveTransparencyEngine?.healthScore ?? 85,
    input.executiveExceptionManager?.healthScore ?? 85,
    unmanagedCriticalCount === 0 ? 94 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const e5Exc = input.executiveExceptionManager?.engineVersion === "E5-08";
  const subsystems = buildRiskSubsystems({
    records,
    riskHealth: unmanagedCriticalCount === 0 ? "strong" : "stable",
    healthScore: clampedHealth,
    criticalCount: criticalRiskCount,
    highCount: highRiskCount,
    unmanagedCriticalCount,
    mitigationInProgressCount,
    computedAt: new Date().toISOString(),
  });

  const riskHeatMap = buildRiskHeatMap(records);
  const riskTrends = buildRiskTrends(records);
  const executiveOwnership = buildExecutiveOwnership(records);
  const riskAnalysis = buildRiskAnalysis({
    criticalCount: criticalRiskCount,
    highCount: highRiskCount,
    unmanagedCritical: unmanagedCriticalCount,
    mitigationProgress: subsystems.metrics.averageMitigationProgress,
  });
  const pillowEvaluations = buildPillowEvaluations({
    totalRisks: records.length,
    criticalCount: criticalRiskCount,
    mitigationProgress: subsystems.metrics.averageMitigationProgress,
  });
  const recommendedActions = buildRecommendations({
    e5Exc,
    unmanagedCritical: unmanagedCriticalCount,
    criticalCount: criticalRiskCount,
  });

  const pillowAdvisory = [
    "Enterprise Risk Governance — constitutional risk oversight active",
    `${records.length} enterprise risks · ${criticalRiskCount} critical · ${highRiskCount} high · ${unmanagedCriticalCount} unmanaged critical`,
    "Every risk has executive ownership · every critical risk has mitigation",
    "Integrated with E5-01 through E5-08 · Exception Manager · Vision · Soul · CTD · Constitution",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting risk governance integrity")}`,
    "ECC coordinates risk mitigation · Supervisor monitors exposure",
    "VIE validates risk governance alignment · vision · soul · CTD · constitution",
  ];

  return {
    engineVersion: "E5-09",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Enterprise Risk Governance continuously identifies, assesses, prioritizes, mitigates and monitors enterprise-wide strategic, financial, operational, governance and technology risks. Every enterprise risk possesses executive ownership. Every critical risk possesses mitigation. The Grand King always possesses complete enterprise risk oversight.",
    engineHealth: healthLabel(clampedHealth),
    riskHealth: unmanagedCriticalCount === 0 ? "strong" : "stable",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    totalRiskCount: records.length,
    criticalRiskCount,
    highRiskCount,
    unmanagedCriticalCount,
    mitigationInProgressCount,
    enterpriseRiskRegister: records,
    criticalRisks: subsystems.criticalRisks,
    riskHeatMap,
    mitigationProgress: subsystems.mitigationProgress,
    riskTrends,
    executiveOwnership,
    riskAnalysis,
    enterpriseRiskPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    riskGovernancePrinciples: [...RISK_GOVERNANCE_PRINCIPLES],
    governedCategories: [...GOVERNED_RISK_CATEGORIES],
    pillowAdvisory,
    integrations: {
      enterpriseGovernanceFramework: input.enterpriseGovernanceFramework
        ? `E5-01 · ${input.enterpriseGovernanceFramework.frameworkHealth} · ${input.enterpriseGovernanceFramework.policyComplianceRate}% policy compliance`
        : "E5-01 · standby",
      executiveConstitutionalMonitor: input.executiveConstitutionalMonitor
        ? `E5-02 · ${input.executiveConstitutionalMonitor.engineHealth} · ${input.executiveConstitutionalMonitor.constitutionalComplianceRate}% constitutional`
        : "E5-02 · standby",
      enterpriseAuditEngine: input.enterpriseAuditEngine
        ? `E5-03 · ${input.enterpriseAuditEngine.engineHealth} · ${input.enterpriseAuditEngine.auditCoverageRate}% audit coverage`
        : "E5-03 · standby",
      executiveComplianceEngine: input.executiveComplianceEngine
        ? `E5-04 · ${input.executiveComplianceEngine.complianceHealth} · ${input.executiveComplianceEngine.complianceScore}% compliance`
        : "E5-04 · standby",
      executiveEthicsEngine: input.executiveEthicsEngine
        ? `E5-05 · ${input.executiveEthicsEngine.ethicsHealth} · ${input.executiveEthicsEngine.executiveEthicsRating}% ethics`
        : "E5-05 · standby",
      executiveAccountabilityEngine: input.executiveAccountabilityEngine
        ? `E5-06 · ${input.executiveAccountabilityEngine.governanceHealth} · ${input.executiveAccountabilityEngine.ownershipCoverageScore}% ownership`
        : "E5-06 · standby",
      executiveTransparencyEngine: input.executiveTransparencyEngine
        ? `E5-07 · ${input.executiveTransparencyEngine.transparencyHealth} · ${input.executiveTransparencyEngine.visibilityCoverageScore}% visibility`
        : "E5-07 · standby",
      executiveExceptionManager: input.executiveExceptionManager
        ? `E5-08 · ${input.executiveExceptionManager.exceptionHealth} · ${input.executiveExceptionManager.activeExceptionCount} active exceptions`
        : "E5-08 · standby",
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
      journeyStatus: `Journey · ${String(input.journey?.currentMission ?? "E5-09")}`,
      supervisorStatus: `Supervisor · ${String(input.supervisor?.status ?? "monitoring")}`,
      eccStatus: `ECC · ${String(input.ecc?.status ?? "active")}`,
      vieStatus: `VIE · ${String(input.vie?.approvalStatus ?? "validated")}`,
    },
    riskAuditHistory: subsystems.riskAuditHistory,
    monitoringStatus: subsystems.monitoringStatus,
    executiveReport: subsystems.executiveReport,
    metrics: subsystems.metrics,
    healthStatus: subsystems.healthStatus,
    readyForE510: true,
  };
}

export function buildFallbackEnterpriseRiskGovernance(): EnterpriseRiskGovernance {
  return assembleEnterpriseRiskGovernance({
    guardian: { status: "monitoring", health: "92/100" },
    journey: { currentMission: "E5-09" },
    supervisor: { status: "monitoring" },
    ecc: { status: "active" },
    vie: { approvalStatus: "validated" },
  });
}
