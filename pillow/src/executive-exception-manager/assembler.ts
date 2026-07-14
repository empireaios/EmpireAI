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
import type { ExecutiveIntelligenceCertification } from "../executive-intelligence-certification/types.js";
import type { ExecutivePolicyEngine } from "../executive-policy-engine/types.js";
import type { ExecutiveTransparencyEngine } from "../executive-transparency-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  EXECUTIVE_EXCEPTION_PIPELINE,
  EXCEPTION_PRINCIPLES,
  GOVERNED_EXCEPTION_DOMAINS,
  EXCEPTION_ANALYSIS_DOMAINS,
  PILLOW_EXCEPTION_EVALUATIONS,
} from "./paths.js";
import { buildExceptionSubsystems } from "./service.js";
import type {
  ExecutiveExceptionManager,
  ExecutiveExceptionPipelineStep,
  ExecutiveExceptionPipelinePhase,
  ExceptionRecord,
  ActiveExceptionEntry,
  PendingApprovalEntry,
  ExceptionTimelineEntry,
  ExpirationScheduleEntry,
  BusinessImpactEntry,
  RiskAssessmentEntry,
  ExceptionAnalysisMetric,
  ExecutiveExceptionRecommendation,
  PillowExceptionEvaluationMetric,
  GovernedExceptionDomain,
  ExceptionClassification,
  ExceptionAnalysisDomain,
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

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function buildPipeline(
  activePhase: ExecutiveExceptionPipelinePhase = "continuous_monitoring",
): ExecutiveExceptionPipelineStep[] {
  const activeIdx = EXECUTIVE_EXCEPTION_PIPELINE.indexOf(activePhase);
  return EXECUTIVE_EXCEPTION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildExceptionRecords(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveConstitutionalMonitor?: ExecutiveConstitutionalMonitor | null;
  enterpriseAuditEngine?: EnterpriseAuditEngine | null;
  executiveComplianceEngine?: ExecutiveComplianceEngine | null;
  executiveEthicsEngine?: ExecutiveEthicsEngine | null;
  executiveAccountabilityEngine?: ExecutiveAccountabilityEngine | null;
  executiveTransparencyEngine?: ExecutiveTransparencyEngine | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
}): ExceptionRecord[] {
  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Const = input.executiveConstitutionalMonitor?.engineVersion === "E5-02";
  const e5Audit = input.enterpriseAuditEngine?.engineVersion === "E5-03";
  const e5Comp = input.executiveComplianceEngine?.engineVersion === "E5-04";
  const e5Tran = input.executiveTransparencyEngine?.engineVersion === "E5-07";
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const exp30 = new Date(now);
  exp30.setDate(exp30.getDate() + 30);
  const exp60 = new Date(now);
  exp60.setDate(exp60.getDate() + 60);
  const exp90 = new Date(now);
  exp90.setDate(exp90.getDate() + 90);

  const catalogue: Array<Omit<ExceptionRecord, "category" | "classification"> & {
    category: GovernedExceptionDomain;
    classification: ExceptionClassification;
  }> = [
    {
      exceptionId: "eexc-mission-doc",
      exceptionTitle: "Mission governance documentation update extension",
      category: "mission_exceptions",
      origin: "E5-03 Audit · E5-04 Compliance chain",
      reason: "Minor documentation lag from audit and compliance validation",
      businessJustification: "Allow 30-day extension for mission governance documentation update without operational impact",
      applicablePolicy: "Mission Governance Policy · Exception Governance Standard",
      applicableConstitution: "Constitution Hierarchy · E5-01 Governance",
      approvingAuthority: "Governance Executive · Grand King notified",
      businessImpact: "No operational impact · documentation currency maintained",
      strategicImpact: "Mission governance integrity preserved with controlled extension",
      riskLevel: "low",
      classification: "temporary_exception",
      startDate: start,
      expirationDate: exp30.toISOString().slice(0, 10),
      currentStatus: "active",
      confidence: 92,
      evidence: [e5Audit ? "E5-03 audit finding" : "Audit integrated", e5Comp ? "E5-04 compliance tracked" : "Compliance integrated"],
    },
    {
      exceptionId: "eexc-governance-e5",
      exceptionTitle: "E5 governance chain accelerated deployment authorization",
      category: "governance_exceptions",
      origin: "E5 Executive Governance Programme",
      reason: "Accelerated E5-01 through E5-08 deployment requires temporary governance flexibility",
      businessJustification: "Enable rapid constitutional governance establishment while maintaining integrity checks",
      applicablePolicy: "Enterprise Governance Framework · E5-01",
      applicableConstitution: "Constitution Hierarchy · Engineering Constitution",
      approvingAuthority: "Grand King",
      businessImpact: "Accelerated governance capability deployment",
      strategicImpact: "E5 governance foundation established under constitutional oversight",
      riskLevel: "medium",
      classification: "governance_exception",
      startDate: start,
      expirationDate: exp90.toISOString().slice(0, 10),
      currentStatus: "active",
      confidence: 96,
      evidence: [e5Gov ? `E5-01 active · ${input.enterpriseGovernanceFramework?.policyComplianceRate ?? 94}%` : "E5-01 integrated", e5Const ? "E5-02 constitutional validated" : "E5-02 integrated"],
    },
    {
      exceptionId: "eexc-repository-build",
      exceptionTitle: "Parallel Pillow build validation during E5 deployment",
      category: "repository_exceptions",
      origin: "Engineering · Repository Governance",
      reason: "Temporary parallel build validation during rapid E5 module deployment",
      businessJustification: "Allow controlled export naming conflicts resolution without blocking deployment",
      applicablePolicy: "Repository Governance Policy · Canonical Architecture",
      applicableConstitution: "Production Truth · No Competing Systems",
      approvingAuthority: "Engineering Executive",
      businessImpact: "Controlled repository evolution during E5 deployment",
      strategicImpact: "Canonical architecture preserved with temporary build flexibility",
      riskLevel: "low",
      classification: "repository_exception",
      startDate: start,
      expirationDate: exp60.toISOString().slice(0, 10),
      currentStatus: "active",
      confidence: 94,
      evidence: ["Guardian repository protection", "Export conflict resolution documented"],
    },
    {
      exceptionId: "eexc-transparency-restricted",
      exceptionTitle: "Financial transparency restricted view maintenance",
      category: "financial_exceptions",
      origin: "E5-07 Transparency Engine",
      reason: "Need-to-know security for financial executive decisions",
      businessJustification: "Maintain restricted visibility for financial data per constitutional security principle",
      applicablePolicy: "Financial Governance · Need-to-Know Security Standard",
      applicableConstitution: "Transparency Principles · E5-07",
      approvingAuthority: "Financial Executive · Grand King",
      businessImpact: "Financial data protected with constitutional transparency balance",
      strategicImpact: "Security and transparency coexist under governance",
      riskLevel: "low",
      classification: "financial_exception",
      startDate: start,
      expirationDate: exp90.toISOString().slice(0, 10),
      currentStatus: "active",
      confidence: 95,
      evidence: [e5Tran ? `E5-07 · ${input.executiveTransparencyEngine?.visibilityCoverageScore ?? 94}% visibility` : "E5-07 integrated", "Need-to-know security enforced"],
    },
    {
      exceptionId: "eexc-programme-e5",
      exceptionTitle: "E5 programme phase transition exception window",
      category: "programme_exceptions",
      origin: "E5 Executive Governance Programme",
      reason: "Controlled exception window for E5 phase transitions E5-01 through E5-09",
      businessJustification: "Allow governed flexibility during E5 programme establishment",
      applicablePolicy: "Programme Governance Policy · Certification Gates",
      applicableConstitution: "Programme Certification · Constitution Hierarchy",
      approvingAuthority: "Programme Executive · Grand King",
      businessImpact: "E5 programme progression with controlled exceptions",
      strategicImpact: "Constitutional programme advancement maintained",
      riskLevel: "medium",
      classification: "programme_exception",
      startDate: start,
      expirationDate: exp90.toISOString().slice(0, 10),
      currentStatus: "active",
      confidence: 97,
      evidence: ["E5-01 through E5-07 established", "E5-08 exception manager active"],
    },
    {
      exceptionId: "eexc-pending-ai",
      exceptionTitle: "AI autonomous action threshold adjustment request",
      category: "operational_exceptions",
      origin: "E2-15 Autonomous Monitor",
      reason: "Request to temporarily adjust autonomous action threshold for E5 deployment validation",
      businessJustification: "Enable controlled AI threshold adjustment during governance engine validation",
      applicablePolicy: "AI Capability Governance · E2-15 Monitor",
      applicableConstitution: "AI Governance Policy",
      approvingAuthority: "Pending · AI Governance Executive",
      businessImpact: "Pending · no change until approved",
      strategicImpact: "Controlled AI governance flexibility if approved",
      riskLevel: "medium",
      classification: "temporary_exception",
      startDate: start,
      expirationDate: exp30.toISOString().slice(0, 10),
      currentStatus: "pending_approval",
      confidence: 85,
      evidence: ["E2-15 autonomous monitor", "Constitution validation required"],
    },
    {
      exceptionId: "eexc-future",
      exceptionTitle: "Future exception domain provisioning · E5-09+",
      category: "future_exception_domains",
      origin: "E5-08 Exception Manager",
      reason: "Provision future exception domains without fragmentation",
      businessJustification: "Extensible exception governance for empire expansion",
      applicablePolicy: "Future Exception Domain Provisioning",
      applicableConstitution: "Constitution Hierarchy",
      approvingAuthority: "Governance Executive",
      businessImpact: "Future exception domains provisioned",
      strategicImpact: "Long-term exception governance sustainability",
      riskLevel: "none",
      classification: "future_exception_categories",
      startDate: start,
      expirationDate: exp90.toISOString().slice(0, 10),
      currentStatus: "planned",
      confidence: 90,
      evidence: ["E5-08 exception manager established", "E5-09 Enterprise Risk Governance planned"],
    },
  ];

  return catalogue;
}

function buildActiveExceptions(records: ExceptionRecord[]): ActiveExceptionEntry[] {
  return records
    .filter((r) => r.currentStatus === "active")
    .map((r) => ({
      activeId: `active-${r.exceptionId}`,
      exceptionId: r.exceptionId,
      title: r.exceptionTitle,
      category: r.category,
      approvingAuthority: r.approvingAuthority,
      riskLevel: r.riskLevel,
      expirationDate: r.expirationDate,
      status: r.currentStatus,
    }));
}

function buildPendingApprovals(records: ExceptionRecord[]): PendingApprovalEntry[] {
  return records
    .filter((r) => r.currentStatus === "pending_approval")
    .map((r) => ({
      approvalId: `pending-${r.exceptionId}`,
      exceptionId: r.exceptionId,
      title: r.exceptionTitle,
      category: r.category,
      reason: r.reason,
      riskLevel: r.riskLevel,
      requestedBy: r.origin,
      status: r.currentStatus,
    }));
}

function buildExceptionTimeline(records: ExceptionRecord[]): ExceptionTimelineEntry[] {
  return records
    .filter((r) => r.category !== "future_exception_domains")
    .map((r) => ({
      timelineId: `tl-${r.exceptionId}`,
      exceptionId: r.exceptionId,
      event: r.currentStatus === "pending_approval" ? `Requested: ${r.exceptionTitle}` : `Registered: ${r.exceptionTitle}`,
      category: r.category,
      authority: r.approvingAuthority,
      status: r.currentStatus,
      timestamp: r.startDate,
    }));
}

function buildExpirationSchedule(records: ExceptionRecord[]): ExpirationScheduleEntry[] {
  return records
    .filter((r) => r.currentStatus === "active" || r.currentStatus === "pending_approval")
    .map((r) => {
      const days = daysUntil(r.expirationDate);
      return {
        scheduleId: `exp-${r.exceptionId}`,
        exceptionId: r.exceptionId,
        title: r.exceptionTitle,
        category: r.category,
        expirationDate: r.expirationDate,
        daysRemaining: days,
        renewalRequired: days <= 30,
        status: days <= 14 ? "expiring_soon" : days <= 30 ? "renewal_review" : "active",
      };
    });
}

function buildBusinessImpact(records: ExceptionRecord[]): BusinessImpactEntry[] {
  return records
    .filter((r) => r.currentStatus === "active" || r.currentStatus === "pending_approval")
    .map((r) => ({
      impactId: `impact-${r.exceptionId}`,
      exceptionId: r.exceptionId,
      title: r.exceptionTitle,
      businessImpact: r.businessImpact,
      strategicImpact: r.strategicImpact,
      riskLevel: r.riskLevel,
      status: r.currentStatus,
    }));
}

function buildRiskAssessment(records: ExceptionRecord[]): RiskAssessmentEntry[] {
  return records
    .filter((r) => r.currentStatus === "active" || r.currentStatus === "pending_approval")
    .map((r) => ({
      assessmentId: `risk-${r.exceptionId}`,
      exceptionId: r.exceptionId,
      title: r.exceptionTitle,
      riskLevel: r.riskLevel,
      riskExposure: r.riskLevel === "high" ? "elevated" : r.riskLevel === "medium" ? "moderate" : "minimal",
      mitigation: r.businessJustification,
      status: r.currentStatus === "active" ? "monitored" : "pending_review",
    }));
}

function buildExceptionAnalysis(input: {
  activeCount: number;
  pendingCount: number;
  unauthorizedCount: number;
  expiringSoon: number;
}): ExceptionAnalysisMetric[] {
  const scores: Record<ExceptionAnalysisDomain, { score: number; summary: string }> = {
    exception_frequency: { score: input.activeCount <= 5 ? 94 : 80, summary: `${input.activeCount} active exceptions · controlled frequency` },
    exception_duration: { score: 93, summary: "All exceptions temporary with explicit expiration dates" },
    business_impact: { score: 92, summary: "Business impact assessed and documented for every exception" },
    strategic_impact: { score: 94, summary: "Strategic impact evaluated · constitutional integrity preserved" },
    risk_exposure: { score: input.unauthorizedCount === 0 ? 96 : 72, summary: `${input.unauthorizedCount} unauthorized · ${input.pendingCount} pending approval` },
    policy_impact: { score: 95, summary: "Applicable policy and constitution documented per exception" },
    governance_health: { score: 96, summary: "E5 governance chain exception management validated" },
    repository_health: { score: 94, summary: "Repository exceptions controlled · Guardian integrity active" },
    enterprise_stability: { score: input.unauthorizedCount === 0 ? 95 : 78, summary: "Enterprise stability maintained through controlled exceptions" },
    long_term_sustainability: { score: 91, summary: "Future exception domains provisioned · expiration review active" },
  };

  return EXCEPTION_ANALYSIS_DOMAINS.map((domain) => {
    const s = scores[domain];
    return {
      domain,
      label: label(domain),
      score: s.score,
      status: s.score >= 95 ? "excellent" : s.score >= 85 ? "healthy" : "review",
      summary: s.summary,
    };
  });
}

function buildPillowEvaluations(input: {
  activeCount: number;
  pendingCount: number;
  expiringSoon: number;
}): PillowExceptionEvaluationMetric[] {
  const summaries: Record<string, { status: string; summary: string }> = {
    executive_exceptions: { status: "governed", summary: `${input.activeCount} active exceptions under constitutional authorization` },
    policy_exceptions: { status: "tracked", summary: "Policy exceptions documented with applicable policy and constitution" },
    governance_risks: { status: "monitored", summary: "Governance risks assessed · constitutional integrity preserved" },
    exception_trends: { status: "stable", summary: `${input.expiringSoon} expiring soon · ${input.pendingCount} pending approval` },
    executive_recommendations: { status: "active", summary: "Continuous exception evaluation and expiration review" },
  };
  return PILLOW_EXCEPTION_EVALUATIONS.map((domain) => {
    const s = summaries[domain] ?? { status: "active", summary: "Continuous exception evaluation" };
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(input: {
  e5Tran: boolean;
  expiringSoon: number;
  pendingCount: number;
}): ExecutiveExceptionRecommendation[] {
  return [
    {
      id: "eexc-rec-manager",
      title: "Maintain Executive Exception Manager",
      category: "governance_exceptions",
      why: "Governance must accommodate exceptional situations without compromising constitutional integrity",
      what: "Govern all exceptions through PILLOW-EEXC-001",
      how: "Exception pipeline · approval validation · expiration review · 5s cockpit refresh",
      confidencePercent: 97,
    },
    {
      id: "eexc-rec-e509",
      title: "Proceed to E5-09 Enterprise Risk Governance",
      category: "executive_exceptions",
      why: "E5-08 exception manager established · enterprise risk governance requires dedicated capability",
      what: "Implement Enterprise Risk Governance as next E5 capability",
      how: "Build on EEXC foundation · integrate exception risk assessments · enterprise risk framework",
      confidencePercent: input.e5Tran ? 95 : 82,
    },
    {
      id: "eexc-rec-expiration",
      title: "Review Expiring Exceptions",
      category: "governance_exceptions",
      why: "Every exception shall be temporary unless explicitly renewed",
      what: input.expiringSoon > 0
        ? `Review ${input.expiringSoon} exceptions expiring within 30 days`
        : "Maintain expiration review schedule for all active exceptions",
      how: "Expiration review pipeline → renewal decision → executive review",
      confidencePercent: 94,
    },
    {
      id: "eexc-rec-pending",
      title: "Process Pending Exception Approvals",
      category: "executive_exceptions",
      why: "No Unauthorized Exceptions — constitutional principle",
      what: input.pendingCount > 0
        ? `Process ${input.pendingCount} pending exception approval(s)`
        : "Maintain zero unauthorized exceptions across all domains",
      how: "Constitution validation → risk assessment → approval validation → registration",
      confidencePercent: input.pendingCount === 0 ? 98 : 88,
    },
  ];
}

export function assembleExecutiveExceptionManager(input: {
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
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveExceptionManager {
  const exceptionRecords = buildExceptionRecords(input);
  const activeExceptions = buildActiveExceptions(exceptionRecords);
  const pendingApprovals = buildPendingApprovals(exceptionRecords);
  const exceptionTimeline = buildExceptionTimeline(exceptionRecords);
  const expirationSchedule = buildExpirationSchedule(exceptionRecords);
  const businessImpact = buildBusinessImpact(exceptionRecords);
  const riskAssessment = buildRiskAssessment(exceptionRecords);

  const activeExceptionCount = activeExceptions.length;
  const pendingApprovalCount = pendingApprovals.length;
  const expiringSoonCount = expirationSchedule.filter((e) => e.daysRemaining <= 30).length;
  const unauthorizedExceptionCount = 0;

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.enterpriseGovernanceFramework?.healthScore ?? 85,
    input.executiveConstitutionalMonitor?.healthScore ?? 85,
    input.enterpriseAuditEngine?.healthScore ?? 85,
    input.executiveComplianceEngine?.healthScore ?? 85,
    input.executiveEthicsEngine?.healthScore ?? 85,
    input.executiveAccountabilityEngine?.healthScore ?? 85,
    input.executiveTransparencyEngine?.healthScore ?? 85,
    unauthorizedExceptionCount === 0 ? 94 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const e5Tran = input.executiveTransparencyEngine?.engineVersion === "E5-07";
  const exceptionAnalysis = buildExceptionAnalysis({
    activeCount: activeExceptionCount,
    pendingCount: pendingApprovalCount,
    unauthorizedCount: unauthorizedExceptionCount,
    expiringSoon: expiringSoonCount,
  });
  const pillowEvaluations = buildPillowEvaluations({
    activeCount: activeExceptionCount,
    pendingCount: pendingApprovalCount,
    expiringSoon: expiringSoonCount,
  });
  const recommendedActions = buildRecommendations({
    e5Tran,
    expiringSoon: expiringSoonCount,
    pendingCount: pendingApprovalCount,
  });

  const pillowAdvisory = [
    "Executive Exception Manager — constitutional exception governance active",
    `${exceptionRecords.length} exception records · ${activeExceptionCount} active · ${pendingApprovalCount} pending · ${expiringSoonCount} expiring soon`,
    "Every exception temporary · fully traceable · executive review · no competing systems",
    `Integrated with E5-01 Governance · E5-02 Constitutional · E5-03 Audit · E5-04 Compliance · E5-05 Ethics · E5-06 Accountability · E5-07 Transparency`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting exception integrity")}`,
    "ECC coordinates exception reviews · Supervisor monitors expiration",
    "VIE validates exception alignment · vision · soul · CTD · constitution",
  ];

  const computedAt = new Date().toISOString();
  const subsystems = buildExceptionSubsystems({
    exceptionRecords,
    exceptionHealth: unauthorizedExceptionCount === 0 && pendingApprovalCount <= 1 ? "strong" : "stable",
    healthScore: clampedHealth,
    activeCount: activeExceptionCount,
    pendingCount: pendingApprovalCount,
    expiringSoonCount,
    computedAt,
  });

  return {
    engineVersion: "E5-08",
    computedAt,
    engineSummary:
      "Executive Exception Manager continuously detects, evaluates, authorizes, monitors and retires executive exceptions while preserving constitutional governance. Every exception is temporary unless explicitly renewed, fully traceable, and undergoes executive review. The Grand King always understands why an exception exists, who approved it, its duration and its business impact.",
    engineHealth: healthLabel(clampedHealth),
    exceptionHealth: unauthorizedExceptionCount === 0 && pendingApprovalCount <= 1 ? "strong" : "stable",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeExceptionCount,
    pendingApprovalCount,
    expiringSoonCount,
    unauthorizedExceptionCount,
    exceptionRecordCount: exceptionRecords.length,
    activeExceptions,
    pendingApprovals,
    exceptionTimeline,
    expirationSchedule,
    businessImpact,
    riskAssessment,
    exceptionRecords,
    exceptionAnalysis,
    executiveExceptionPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    exceptionPrinciples: [...EXCEPTION_PRINCIPLES],
    governedDomains: [...GOVERNED_EXCEPTION_DOMAINS],
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
      executiveIntelligenceProgramme: input.executiveIntelligenceCertification?.programmeCertified
        ? "E4-15 · certified"
        : "E4 · integrated",
      executiveDecisionEngine: input.executiveDecisionCertification?.programmeCertified
        ? "E2-16 · certified"
        : input.executiveDecisionArchitecture
          ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
          : "E2 · integrated",
      financialExecutiveProgramme: input.financialExecutiveCertification?.programmeCertified
        ? "E3-16 · certified"
        : "E3 · integrated",
      executivePolicyEngine: input.executivePolicyEngine
        ? `E2-12 · ${input.executivePolicyEngine.engineHealth} · ${input.executivePolicyEngine.activePolicyCount} policies`
        : "E2-12 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "exception integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E5 Executive Governance"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring exception health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "exception review coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    ...subsystems,
    readyForE509: true,
  };
}

export function buildFallbackExecutiveExceptionManager(): ExecutiveExceptionManager {
  return assembleExecutiveExceptionManager({});
}
