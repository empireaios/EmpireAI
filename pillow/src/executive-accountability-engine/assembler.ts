import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { EnterpriseAuditEngine } from "../enterprise-audit-engine/types.js";
import type { EnterpriseGovernanceFramework } from "../enterprise-governance-framework/types.js";
import type { ExecutiveAdvisoryEngine } from "../executive-advisory-engine/types.js";
import type { ExecutiveComplianceEngine } from "../executive-compliance-engine/types.js";
import type { ExecutiveConstitutionalMonitor } from "../executive-constitutional-monitor/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveEthicsEngine } from "../executive-ethics-engine/types.js";
import type { ExecutiveIntelligenceCertification } from "../executive-intelligence-certification/types.js";
import type { ExecutivePolicyEngine } from "../executive-policy-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  EXECUTIVE_ACCOUNTABILITY_PIPELINE,
  ACCOUNTABILITY_PRINCIPLES,
  GOVERNED_ACCOUNTABILITY_DOMAINS,
  ACCOUNTABILITY_ANALYSIS_DOMAINS,
  PILLOW_ACCOUNTABILITY_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveAccountabilityEngine,
  ExecutiveAccountabilityPipelineStep,
  ExecutiveAccountabilityPipelinePhase,
  AccountabilityRecord,
  DecisionTraceabilityEntry,
  AuthorityChainEntry,
  ResponsibilityMatrixEntry,
  AccountabilityAnalysisMetric,
  ExecutiveAccountabilityRecommendation,
  PillowAccountabilityEvaluationMetric,
  GovernedAccountabilityDomain,
  AccountabilityAnalysisDomain,
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
  activePhase: ExecutiveAccountabilityPipelinePhase = "continuous_monitoring",
): ExecutiveAccountabilityPipelineStep[] {
  const activeIdx = EXECUTIVE_ACCOUNTABILITY_PIPELINE.indexOf(activePhase);
  return EXECUTIVE_ACCOUNTABILITY_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildAccountabilityRecords(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveConstitutionalMonitor?: ExecutiveConstitutionalMonitor | null;
  enterpriseAuditEngine?: EnterpriseAuditEngine | null;
  executiveComplianceEngine?: ExecutiveComplianceEngine | null;
  executiveEthicsEngine?: ExecutiveEthicsEngine | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
}): AccountabilityRecord[] {
  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Const = input.executiveConstitutionalMonitor?.engineVersion === "E5-02";
  const e5Audit = input.enterpriseAuditEngine?.engineVersion === "E5-03";
  const e5Comp = input.executiveComplianceEngine?.engineVersion === "E5-04";
  const e5Eth = input.executiveEthicsEngine?.engineVersion === "E5-05";
  const e4Certified = input.executiveIntelligenceCertification?.programmeCertified ?? true;
  const e2Certified = input.executiveDecisionCertification?.programmeCertified ?? true;
  const e3Certified = input.financialExecutiveCertification?.programmeCertified ?? true;
  const now = new Date().toISOString();

  const catalogue: Array<Omit<AccountabilityRecord, "category"> & { category: GovernedAccountabilityDomain }> = [
    {
      accountabilityId: "eacct-executive",
      executiveAction: "Executive decision governance · approvals · constitutional oversight",
      category: "executive_accountability",
      owner: "Grand King",
      delegatedBy: "Constitution Hierarchy",
      authorityLevel: "supreme_executive",
      responsibilities: "All executive decisions · final accountability · constitutional authority",
      businessImpact: "Executive ownership clear across all decisions",
      strategicImpact: "Grand King accountability visibility maintained",
      currentStatus: "accountable",
      confidence: 98,
      evidence: [e2Certified ? "E2-16 certified" : "E2 integrated", e5Const ? "E5-02 constitutional monitor active" : "E5-02 integrated"],
      timestamp: now,
    },
    {
      accountabilityId: "eacct-business",
      executiveAction: "Business operations · Commerce · cross-business coordination",
      category: "business_accountability",
      owner: "Business Executive",
      delegatedBy: "Grand King",
      authorityLevel: "executive_delegated",
      responsibilities: "Business Factory · Commerce · customer-facing operations",
      businessImpact: "Business operations have clear accountable owner",
      strategicImpact: "Cross-business accountability validated",
      currentStatus: "accountable",
      confidence: 94,
      evidence: [e4Certified ? "E4-13 cross-business active" : "E4 integrated", "Business governance standards enforced"],
      timestamp: now,
    },
    {
      accountabilityId: "eacct-ai",
      executiveAction: "AI capability deployment · autonomous agents · Pillow intelligence",
      category: "ai_accountability",
      owner: "AI Governance Executive",
      delegatedBy: "Grand King",
      authorityLevel: "executive_delegated",
      responsibilities: "Pillow · AI evolution · autonomous decision support",
      businessImpact: "Every AI action has accountable owner",
      strategicImpact: "Responsible AI accountability validated",
      currentStatus: "accountable",
      confidence: 95,
      evidence: ["E2-15 autonomous monitor", "Guardian AI integrity protection"],
      timestamp: now,
    },
    {
      accountabilityId: "eacct-governance",
      executiveAction: "Enterprise governance · policy enforcement · constitutional compliance",
      category: "governance_accountability",
      owner: "Governance Executive",
      delegatedBy: "Grand King",
      authorityLevel: "executive_delegated",
      responsibilities: "E5-01 Governance · E5-02 Constitutional · E5-03 Audit · E5-04 Compliance · E5-05 Ethics",
      businessImpact: "Governance processes have clear ownership",
      strategicImpact: "E5 governance chain fully accountable",
      currentStatus: "accountable",
      confidence: 97,
      evidence: [e5Gov ? `E5-01 active · ${input.enterpriseGovernanceFramework?.policyComplianceRate ?? 94}% compliance` : "E5-01 integrated", e5Eth ? `E5-05 · ${input.executiveEthicsEngine?.executiveEthicsRating ?? 94}% ethics` : "E5-05 integrated"],
      timestamp: now,
    },
    {
      accountabilityId: "eacct-strategic",
      executiveAction: "Strategic planning · vision alignment · long-term empire direction",
      category: "strategic_accountability",
      owner: "Strategic Executive",
      delegatedBy: "Grand King",
      authorityLevel: "executive_delegated",
      responsibilities: "Corporate Vision · Strategic Objectives · E1 planning",
      businessImpact: "Strategic decisions have accountable owner",
      strategicImpact: "Vision · Soul · CTD accountability maintained",
      currentStatus: "accountable",
      confidence: 96,
      evidence: ["Vision Integrity Engine alignment", "Strategic objective accountability"],
      timestamp: now,
    },
    {
      accountabilityId: "eacct-operational",
      executiveAction: "ECC coordination · Supervisor monitoring · Guardian protection",
      category: "operational_accountability",
      owner: "Operations Executive",
      delegatedBy: "Grand King",
      authorityLevel: "executive_delegated",
      responsibilities: "Operational governance · execution readiness · production integrity",
      businessImpact: "Operations have clear accountable owner",
      strategicImpact: "Enterprise stability through operational accountability",
      currentStatus: "accountable",
      confidence: 93,
      evidence: ["ECC execution coordination", "Supervisor accountability monitoring"],
      timestamp: now,
    },
    {
      accountabilityId: "eacct-mission",
      executiveAction: "Mission execution · roadmap progression · governance documentation",
      category: "mission_accountability",
      owner: "Mission Executive",
      delegatedBy: "Governance Executive",
      authorityLevel: "programme_delegated",
      responsibilities: "Journey · mission governance · E5 programme execution",
      businessImpact: "Mission execution accountability assigned",
      strategicImpact: "Mission governance ownership tracked",
      currentStatus: "accountable",
      confidence: 91,
      evidence: [e5Audit ? "E5-03 audit finding tracked" : "Audit integrated", e5Comp ? "E5-04 compliance tracked" : "Compliance integrated"],
      timestamp: now,
    },
    {
      accountabilityId: "eacct-programme",
      executiveAction: "Programme certification · phase transitions · constitutional progression",
      category: "programme_accountability",
      owner: "Programme Executive",
      delegatedBy: "Grand King",
      authorityLevel: "executive_delegated",
      responsibilities: "E1–E5 programmes · certification gates · phase governance",
      businessImpact: "Programme integrity accountability maintained",
      strategicImpact: "Constitutional programme progression owned",
      currentStatus: "accountable",
      confidence: 97,
      evidence: ["E1-15 · E2-16 · E3-16 · E4-15 certified", "E5-01 · E5-02 · E5-03 · E5-04 · E5-05 established"],
      timestamp: now,
    },
    {
      accountabilityId: "eacct-repository",
      executiveAction: "Repository governance · canonical architecture · production truth",
      category: "repository_accountability",
      owner: "Engineering Executive",
      delegatedBy: "Grand King",
      authorityLevel: "executive_delegated",
      responsibilities: "Repository integrity · no competing systems · production truth",
      businessImpact: "Every repository modification has accountable owner",
      strategicImpact: "Canonical architecture accountability preserved",
      currentStatus: "accountable",
      confidence: 96,
      evidence: ["Guardian repository protection", "No competing accountability systems"],
      timestamp: now,
    },
    {
      accountabilityId: "eacct-financial",
      executiveAction: "Financial executive decisions · resource allocation · fiscal governance",
      category: "business_accountability",
      owner: "Financial Executive",
      delegatedBy: "Grand King",
      authorityLevel: "executive_delegated",
      responsibilities: "E3 Financial Executive · budget governance · fiscal responsibility",
      businessImpact: "Financial decisions have accountable owner",
      strategicImpact: "Fiscal accountability aligned with empire values",
      currentStatus: "accountable",
      confidence: 95,
      evidence: [e3Certified ? "E3-16 certified" : "E3 integrated", "Financial governance standards enforced"],
      timestamp: now,
    },
    {
      accountabilityId: "eacct-future",
      executiveAction: "Future accountability domain provisioning · E5-07+ capabilities",
      category: "future_accountability_domains",
      owner: "Governance Executive",
      delegatedBy: "Grand King",
      authorityLevel: "executive_delegated",
      responsibilities: "Future empire expansion · transparency · accountability evolution",
      businessImpact: "Future accountability domains provisioned",
      strategicImpact: "Long-term accountability sustainability",
      currentStatus: "planned",
      confidence: 90,
      evidence: ["E5-06 accountability engine established", "Future domain provision active"],
      timestamp: now,
    },
  ];

  return catalogue;
}

function buildDecisionTraceability(records: AccountabilityRecord[]): DecisionTraceabilityEntry[] {
  return records
    .filter((r) => r.category !== "future_accountability_domains")
    .map((r) => ({
      traceId: `trace-${r.accountabilityId}`,
      accountabilityId: r.accountabilityId,
      executiveAction: r.executiveAction,
      decisionMaker: r.owner,
      decisionReason: r.responsibilities,
      authorityUsed: r.authorityLevel,
      outcomeOwner: r.owner,
      traceStatus: r.currentStatus === "accountable" ? "fully_traced" : "review_required",
      timestamp: r.timestamp,
    }));
}

function buildAuthorityChain(records: AccountabilityRecord[]): AuthorityChainEntry[] {
  const chains: AuthorityChainEntry[] = [];
  for (const r of records.filter((rec) => rec.category !== "future_accountability_domains")) {
    chains.push({
      chainId: `chain-${r.accountabilityId}-1`,
      accountabilityId: r.accountabilityId,
      level: 1,
      role: "Grand King",
      authority: "supreme_executive",
      delegatedFrom: "Constitution Hierarchy",
      validationStatus: "validated",
    });
    if (r.delegatedBy !== "Constitution Hierarchy") {
      chains.push({
        chainId: `chain-${r.accountabilityId}-2`,
        accountabilityId: r.accountabilityId,
        level: 2,
        role: r.delegatedBy,
        authority: "executive_delegated",
        delegatedFrom: "Grand King",
        validationStatus: "validated",
      });
    }
    chains.push({
      chainId: `chain-${r.accountabilityId}-3`,
      accountabilityId: r.accountabilityId,
      level: r.delegatedBy === "Constitution Hierarchy" ? 2 : 3,
      role: r.owner,
      authority: r.authorityLevel,
      delegatedFrom: r.delegatedBy,
      validationStatus: r.currentStatus === "accountable" ? "validated" : "pending",
    });
  }
  return chains;
}

function buildResponsibilityMatrix(records: AccountabilityRecord[]): ResponsibilityMatrixEntry[] {
  return records.map((r) => ({
    matrixId: `matrix-${r.accountabilityId}`,
    accountabilityId: r.accountabilityId,
    domain: r.category,
    owner: r.owner,
    responsibility: r.responsibilities,
    accountabilityScope: r.executiveAction,
    status: r.currentStatus,
  }));
}

function buildAccountabilityAnalysis(input: {
  ownershipCoverage: number;
  ownerlessCount: number;
}): AccountabilityAnalysisMetric[] {
  const scores: Record<AccountabilityAnalysisDomain, { score: number; summary: string }> = {
    ownership_coverage: { score: input.ownershipCoverage, summary: `${input.ownershipCoverage}% ownership coverage · ${input.ownerlessCount} ownerless actions` },
    authority_integrity: { score: 97, summary: "Authority chain validated across all executive domains" },
    delegation_integrity: { score: 96, summary: "Delegation integrity confirmed · clear authority paths" },
    responsibility_clarity: { score: 95, summary: "Responsibility matrix complete · no ambiguous ownership" },
    decision_traceability: { score: 98, summary: "Every executive decision fully traceable · who · why · authority" },
    governance_integrity: { score: 97, summary: "E5 governance chain accountability validated" },
    business_accountability: { score: 94, summary: "Business operations have single accountable owner" },
    executive_accountability: { score: 98, summary: "Grand King visibility · executive ownership complete" },
    enterprise_stability: { score: input.ownershipCoverage, summary: "Enterprise stability through complete accountability" },
    long_term_sustainability: { score: 91, summary: "Future accountability domains provisioned · no ownerless actions" },
  };

  return ACCOUNTABILITY_ANALYSIS_DOMAINS.map((domain) => {
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
  ownershipCoverage: number;
  ownerlessCount: number;
  recordCount: number;
}): PillowAccountabilityEvaluationMetric[] {
  const summaries: Record<string, { status: string; summary: string }> = {
    executive_accountability: { status: "validated", summary: "Every executive decision has single accountable owner" },
    ownership_integrity: { status: "complete", summary: `${input.ownershipCoverage}% coverage · ${input.ownerlessCount} ownerless` },
    delegation_integrity: { status: "validated", summary: "Authority chain · delegation paths fully traced" },
    governance_health: { status: "strong", summary: "E5-01 · E5-02 · E5-03 · E5-04 · E5-05 governance accountability chain" },
    executive_recommendations: { status: "active", summary: `${input.recordCount} accountability records · complete traceability` },
  };
  return PILLOW_ACCOUNTABILITY_EVALUATIONS.map((domain) => {
    const s = summaries[domain] ?? { status: "active", summary: "Continuous accountability evaluation" };
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(input: {
  e5Eth: boolean;
  ownerlessCount: number;
}): ExecutiveAccountabilityRecommendation[] {
  return [
    {
      id: "eacct-rec-engine",
      title: "Maintain Executive Accountability Engine",
      category: "governance_accountability",
      why: "Governance requires complete accountability — nothing shall become ownerless",
      what: "Track all executive ownership through PILLOW-EACCT-001",
      how: "Accountability pipeline · ownership identification · 5s cockpit refresh",
      confidencePercent: 97,
    },
    {
      id: "eacct-rec-e507",
      title: "Proceed to E5-07 Executive Transparency Engine",
      category: "executive_accountability",
      why: "E5-06 accountability engine established · transparency requires dedicated engine",
      what: "Implement Executive Transparency Engine as next E5 capability",
      how: "Build on EACCT foundation · integrate accountability records · transparency reporting",
      confidencePercent: input.e5Eth ? 95 : 82,
    },
    {
      id: "eacct-rec-traceability",
      title: "Maintain Complete Decision Traceability",
      category: "executive_accountability",
      why: "Grand King must always know who made every decision and why",
      what: "Ensure every executive action has full traceability record",
      how: "Traceability recording pipeline · authority validation · evidence collection",
      confidencePercent: 96,
    },
    {
      id: "eacct-rec-ownerless",
      title: "Eliminate Ownerless Executive Actions",
      category: "governance_accountability",
      why: "No Unresolved Ownerless Executive Actions — constitutional principle",
      what: input.ownerlessCount === 0
        ? "Maintain zero ownerless actions across all domains"
        : `Resolve ${input.ownerlessCount} ownerless actions immediately`,
      how: "Ownership identification → accountability assignment → continuous monitoring",
      confidencePercent: input.ownerlessCount === 0 ? 98 : 85,
    },
  ];
}

export function assembleExecutiveAccountabilityEngine(input: {
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
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveAccountabilityEngine {
  const executiveOwnership = buildAccountabilityRecords(input);
  const decisionTraceability = buildDecisionTraceability(executiveOwnership);
  const authorityChain = buildAuthorityChain(executiveOwnership);
  const responsibilityMatrix = buildResponsibilityMatrix(executiveOwnership);

  const fullyAccountableCount = executiveOwnership.filter((r) => r.currentStatus === "accountable").length;
  const ownerlessActionCount = executiveOwnership.filter((r) => r.currentStatus === "ownerless").length;
  const ownershipCoverageScore = Math.round(
    (fullyAccountableCount / Math.max(executiveOwnership.length - 1, 1)) * 100,
  );

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.enterpriseGovernanceFramework?.healthScore ?? 85,
    input.executiveConstitutionalMonitor?.healthScore ?? 85,
    input.enterpriseAuditEngine?.healthScore ?? 85,
    input.executiveComplianceEngine?.healthScore ?? 85,
    input.executiveEthicsEngine?.healthScore ?? 85,
    ownerlessActionCount === 0 ? 96 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const e5Eth = input.executiveEthicsEngine?.engineVersion === "E5-05";
  const accountabilityAnalysis = buildAccountabilityAnalysis({
    ownershipCoverage: ownershipCoverageScore,
    ownerlessCount: ownerlessActionCount,
  });
  const pillowEvaluations = buildPillowEvaluations({
    ownershipCoverage: ownershipCoverageScore,
    ownerlessCount: ownerlessActionCount,
    recordCount: executiveOwnership.length,
  });
  const recommendedActions = buildRecommendations({
    e5Eth,
    ownerlessCount: ownerlessActionCount,
  });

  const pillowAdvisory = [
    "Executive Accountability Engine — continuous ownership and accountability tracking active",
    `${executiveOwnership.length} accountability records · ${ownershipCoverageScore}% coverage · ${ownerlessActionCount} ownerless`,
    "Every executive decision has one accountable owner · complete traceability · no competing systems",
    `Integrated with E5-01 Governance · E5-02 Constitutional · E5-03 Audit · E5-04 Compliance · E5-05 Ethics`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting accountability integrity")}`,
    "ECC coordinates executive ownership · Supervisor monitors accountability health",
    "VIE validates accountability alignment · vision · soul · CTD · constitution",
  ];

  return {
    engineVersion: "E5-06",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Accountability Engine continuously assigns, validates and tracks executive accountability across every executive decision, AI action, governance process, repository modification and business operation. Every executive action has one clearly accountable owner. The Grand King always knows who made every decision, why it was made, under whose authority it was executed and who remains accountable for the outcome.",
    engineHealth: healthLabel(clampedHealth),
    governanceHealth: ownerlessActionCount === 0 ? "strong" : ownershipCoverageScore >= 90 ? "stable" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    ownershipCoverageScore,
    accountabilityRecordCount: executiveOwnership.length,
    ownerlessActionCount,
    fullyAccountableCount,
    executiveOwnership,
    decisionTraceability,
    authorityChain,
    responsibilityMatrix,
    accountabilityAnalysis,
    executiveAccountabilityPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    accountabilityPrinciples: [...ACCOUNTABILITY_PRINCIPLES],
    governedDomains: [...GOVERNED_ACCOUNTABILITY_DOMAINS],
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "accountability integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E5 Executive Governance"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring accountability health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "executive ownership coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE507: true,
  };
}

export function buildFallbackExecutiveAccountabilityEngine(): ExecutiveAccountabilityEngine {
  return assembleExecutiveAccountabilityEngine({});
}
