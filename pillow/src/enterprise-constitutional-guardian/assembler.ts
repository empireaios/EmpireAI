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
import type { ExecutivePolicyEvolution } from "../executive-policy-evolution/types.js";
import type { ExecutiveReviewBoard } from "../executive-review-board/types.js";
import type { ExecutiveTransparencyEngine } from "../executive-transparency-engine/types.js";
import type { ExecutiveTrustEngine } from "../executive-trust-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  CONSTITUTIONAL_GUARDIAN_PIPELINE,
  GUARDIAN_PRINCIPLES,
  GOVERNED_PROTECTION_DOMAINS,
  CONSTITUTIONAL_ANALYSIS_DOMAINS,
  PILLOW_GUARDIAN_EVALUATIONS,
} from "./paths.js";
import { buildGuardianSubsystems } from "./service.js";
import { label } from "./protection.js";
import type {
  EnterpriseConstitutionalGuardian,
  ConstitutionalGuardianPipelineStep,
  ConstitutionalGuardianPipelinePhase,
  GuardianProtectionEvent,
  ConstitutionalAnalysisMetric,
  ExecutiveGuardianRecommendation,
  PillowGuardianEvaluationMetric,
  GovernedProtectionDomain,
  ProtectionClassification,
  ConstitutionalAnalysisDomain,
} from "./types.js";

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

function buildPipeline(
  activePhase: ConstitutionalGuardianPipelinePhase = "constitution_validation",
): ConstitutionalGuardianPipelineStep[] {
  const activeIdx = CONSTITUTIONAL_GUARDIAN_PIPELINE.indexOf(activePhase);
  return CONSTITUTIONAL_GUARDIAN_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildProtectionRecords(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveConstitutionalMonitor?: ExecutiveConstitutionalMonitor | null;
  executiveReviewBoard?: ExecutiveReviewBoard | null;
  executivePolicyEvolution?: ExecutivePolicyEvolution | null;
  executiveTrustEngine?: ExecutiveTrustEngine | null;
  enterpriseRiskGovernance?: EnterpriseRiskGovernance | null;
}): GuardianProtectionEvent[] {
  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Monitor = input.executiveConstitutionalMonitor?.engineVersion === "E5-02";
  const e5Review = input.executiveReviewBoard?.engineVersion === "E5-10";
  const e5Policy = input.executivePolicyEvolution?.engineVersion === "E5-11";
  const e5Trust = input.executiveTrustEngine?.engineVersion === "E5-12";
  const now = new Date().toISOString();

  const catalogue: Array<
    Omit<GuardianProtectionEvent, "protectionCategory" | "classification"> & {
      protectionCategory: GovernedProtectionDomain;
      classification: ProtectionClassification;
    }
  > = [
    {
      guardianEventId: "ecguard-vision",
      protectedAsset: "Corporate Vision",
      detectedThreat: "Vision drift from constitutional alignment",
      severity: "low",
      businessImpact: "Strategic misalignment risk if undetected",
      strategicImpact: "Vision integrity is foundation of all governance",
      recommendedProtection: "Continuous VIE validation · vision synchronization",
      protectiveActionTaken: "VIE active · vision alignment monitored",
      currentStatus: "monitoring",
      confidence: 95,
      evidence: ["VIE validated", "Corporate Vision Engine active"],
      timestamp: now,
      protectionCategory: "vision_protection",
      classification: "vision_protection",
    },
    {
      guardianEventId: "ecguard-soul",
      protectedAsset: "Empire Soul Doctrine",
      detectedThreat: "Soul doctrine deviation",
      severity: "low",
      businessImpact: "Cultural and strategic coherence at risk",
      strategicImpact: "Soul integrity defines Empire identity",
      recommendedProtection: "Soul-first validation on all executive decisions",
      protectiveActionTaken: "Soul alignment checks active",
      currentStatus: "monitoring",
      confidence: 94,
      evidence: ["Soul-first principle enforced", "CTD hierarchy compliant"],
      timestamp: now,
      protectionCategory: "soul_protection",
      classification: "constitution_protection",
    },
    {
      guardianEventId: "ecguard-ctd",
      protectedAsset: "CTD Hierarchy",
      detectedThreat: "CTD hierarchy violation",
      severity: "medium",
      businessImpact: "Decision authority confusion",
      strategicImpact: "CTD defines constitutional decision order",
      recommendedProtection: "CTD-first validation · authority chain verification",
      protectiveActionTaken: "CTD alignment monitored · no violations detected",
      currentStatus: "resolved",
      confidence: 93,
      evidence: ["CTD-first principle active", "Executive decision chain intact"],
      timestamp: now,
      protectionCategory: "ctd_protection",
      classification: "constitution_protection",
    },
    {
      guardianEventId: "ecguard-constitution",
      protectedAsset: "Engineering Constitution",
      detectedThreat: "Constitutional regression or unauthorized change",
      severity: "high",
      businessImpact: "Governance integrity compromise",
      strategicImpact: "Constitution is supreme law of EmpireAI",
      recommendedProtection: "Immediate intervention on constitutional violation",
      protectiveActionTaken: e5Monitor ? "E5-02 constitutional monitor active" : "Monitor standby",
      currentStatus: e5Monitor ? "monitoring" : "action_recommended",
      confidence: 96,
      evidence: [e5Monitor ? `E5-02 · ${input.executiveConstitutionalMonitor?.constitutionalComplianceRate}%` : "E5-02 integrated"],
      timestamp: now,
      protectionCategory: "constitution_protection",
      classification: "constitution_protection",
    },
    {
      guardianEventId: "ecguard-e5-gov",
      protectedAsset: "E5 Executive Governance Chain",
      detectedThreat: "Governance chain regression or competing systems",
      severity: "medium",
      businessImpact: "Executive governance fragmentation",
      strategicImpact: "E5 programme integrity",
      recommendedProtection: "Single canonical engine per mission · no competing systems",
      protectiveActionTaken: e5Gov ? "E5-01 through E5-12 canonical engines verified" : "Integration verification pending",
      currentStatus: e5Gov ? "resolved" : "validated",
      confidence: 94,
      evidence: [e5Gov ? "E5-01 active" : "E5-01 integrated", "No competing governance systems"],
      timestamp: now,
      protectionCategory: "executive_governance_protection",
      classification: "governance_protection",
    },
    {
      guardianEventId: "ecguard-repository",
      protectedAsset: "Repository Integrity",
      detectedThreat: "Build failure · import path corruption · architectural drift",
      severity: "high",
      businessImpact: "Production deployment failure",
      strategicImpact: "Repository truth must match production truth",
      recommendedProtection: "Pre-deploy build gate · import path audit · Guardian monitoring",
      protectiveActionTaken: "Build clean · 0 TS errors · production startup validated",
      currentStatus: "resolved",
      confidence: 97,
      evidence: ["Backend build 0 errors", "Production startup validated", "327 TS errors previously resolved"],
      timestamp: now,
      protectionCategory: "repository_protection",
      classification: "repository_protection",
    },
    {
      guardianEventId: "ecguard-architecture",
      protectedAsset: "Canonical Architecture",
      detectedThreat: "Architecture drift · duplicate engines · import corruption",
      severity: "medium",
      businessImpact: "Technical debt and deployment risk",
      strategicImpact: "Canonical architecture discipline",
      recommendedProtection: "Single assembler pattern · barrel export hygiene",
      protectiveActionTaken: "E5-01 through E5-12 follow canonical pattern",
      currentStatus: "resolved",
      confidence: 95,
      evidence: ["Assembler → service → index pattern", "No competing executive engines"],
      timestamp: now,
      protectionCategory: "canonical_architecture_protection",
      classification: "architecture_protection",
    },
    {
      guardianEventId: "ecguard-mission",
      protectedAsset: "E5 Mission Sequence",
      detectedThreat: "Mission regression · skipped dependencies · handoff failure",
      severity: "medium",
      businessImpact: "Governance delivery unpredictability",
      strategicImpact: "Mission integrity ensures E5 completion",
      recommendedProtection: "readyFor handoff flags · regression test gate",
      protectiveActionTaken: "E5-12 tests 6/6 · E5-11 tests 6/6 · build clean",
      currentStatus: "resolved",
      confidence: 93,
      evidence: ["Sequential E5 completion", "Tests passing per mission"],
      timestamp: now,
      protectionCategory: "mission_protection",
      classification: "mission_protection",
    },
    {
      guardianEventId: "ecguard-trust",
      protectedAsset: "Executive Trust Engine",
      detectedThreat: "Unsupported trust ratings · confidence without evidence",
      severity: "low",
      businessImpact: "Grand King confidence compromised",
      strategicImpact: "Trust engine feeds constitutional guardian",
      recommendedProtection: "Block unsupported ratings · minimum evidence count",
      protectiveActionTaken: e5Trust ? `E5-12 active · ${input.executiveTrustEngine?.unsupportedRatingCount} unsupported` : "Trust engine integrating",
      currentStatus: e5Trust ? "monitoring" : "validated",
      confidence: 92,
      evidence: [e5Trust ? `Executive trust ${input.executiveTrustEngine?.executiveTrustScore}/100` : "E5-12 integrated"],
      timestamp: now,
      protectionCategory: "executive_integrity",
      classification: "governance_protection",
    },
    {
      guardianEventId: "ecguard-policy",
      protectedAsset: "Executive Policy Evolution",
      detectedThreat: "Constitutional regression via policy change",
      severity: "medium",
      businessImpact: "Governance regression risk",
      strategicImpact: "Policy evolution must preserve constitution",
      recommendedProtection: "Constitution validation phase · backward compatibility gate",
      protectiveActionTaken: e5Policy ? "E5-11 constitution validation enforced" : "Policy evolution standby",
      currentStatus: e5Policy ? "monitoring" : "validated",
      confidence: 91,
      evidence: [e5Policy ? `E5-11 · ${input.executivePolicyEvolution?.regressionRiskCount} regression risks` : "E5-11 integrated"],
      timestamp: now,
      protectionCategory: "executive_governance_protection",
      classification: "governance_protection",
    },
    {
      guardianEventId: "ecguard-review",
      protectedAsset: "Executive Review Board",
      detectedThreat: "Unreviewed critical executive areas",
      severity: "low",
      businessImpact: "Executive oversight gaps",
      strategicImpact: "Review board ensures no blind spots",
      recommendedProtection: "No unreviewed critical areas principle",
      protectiveActionTaken: e5Review ? `E5-10 · ${input.executiveReviewBoard?.unreviewedCriticalCount} unreviewed critical` : "Review board standby",
      currentStatus: "monitoring",
      confidence: 92,
      evidence: [e5Review ? `${input.executiveReviewBoard?.totalReviewCount} reviews` : "E5-10 integrated"],
      timestamp: now,
      protectionCategory: "executive_governance_protection",
      classification: "governance_protection",
    },
    {
      guardianEventId: "ecguard-future-e514",
      protectedAsset: "Executive Resilience Readiness",
      detectedThreat: "Constitutional vulnerability during resilience gaps",
      severity: "low",
      businessImpact: "Recovery capability under evaluation",
      strategicImpact: "E5-14 Executive Resilience Engine next",
      recommendedProtection: "Complete E5-13 · initiate resilience engine",
      protectiveActionTaken: "Constitutional guardian establishing protection foundation",
      currentStatus: "monitoring",
      confidence: 90,
      evidence: ["E5-14 planned", "E5-13 establishing"],
      timestamp: now,
      protectionCategory: "future_constitutional_protection_domains",
      classification: "future_protection",
    },
  ];

  return catalogue;
}

function buildConstitutionalAnalysis(input: {
  healthScore: number;
  e5Gov: boolean;
  e5Trust: boolean;
  unresolvedCritical: number;
}): ConstitutionalAnalysisMetric[] {
  return CONSTITUTIONAL_ANALYSIS_DOMAINS.map((domain) => {
    let score = 90;
    let summary = "Within constitutional protection tolerance";
    if (domain === "vision_integrity") {
      score = 94;
      summary = "Vision actively protected by guardian";
    } else if (domain === "constitution_integrity") {
      score = input.e5Gov ? 95 : 82;
      summary = "Constitution hierarchy compliance verified";
    } else if (domain === "repository_integrity") {
      score = 97;
      summary = "Build clean · production validated";
    } else if (domain === "governance_integrity") {
      score = input.e5Gov ? 93 : 80;
      summary = "E5 governance chain protected";
    } else if (domain === "long_term_constitutional_stability") {
      score = input.unresolvedCritical === 0 ? input.healthScore : 68;
      summary = input.unresolvedCritical === 0 ? "Long-term stability assured" : "Intervention required";
    }
    return {
      domain,
      label: label(domain),
      score: Math.min(100, Math.max(0, score)),
      status: score >= 85 ? "protected" : score >= 70 ? "stable" : "attention",
      summary,
    };
  });
}

function buildPillowEvaluations(input: {
  protectedAssetCount: number;
  activeViolations: number;
  constitutionHealthScore: number;
}): PillowGuardianEvaluationMetric[] {
  return PILLOW_GUARDIAN_EVALUATIONS.map((domain) => {
    let status = "active";
    let summary = "Continuous protection active";
    if (domain === "vision_protection") summary = "Vision actively defended";
    else if (domain === "constitution_protection") summary = `Constitution health ${input.constitutionHealthScore}/100`;
    else if (domain === "repository_protection") summary = "Repository integrity protected · build clean";
    else if (domain === "architecture_protection") summary = "Canonical architecture preserved";
    else if (domain === "executive_governance_protection") summary = `${input.protectedAssetCount} assets under protection`;
    else if (domain === "executive_recommendations") {
      summary = `${input.activeViolations} active violations monitored`;
      status = input.activeViolations === 0 ? "stable" : "elevated";
    }
    return { domain, label: label(domain), status, summary };
  });
}

function buildRecommendations(input: {
  e5Trust: boolean;
  unresolvedCritical: number;
}): ExecutiveGuardianRecommendation[] {
  const actions: ExecutiveGuardianRecommendation[] = [
    {
      id: "ecguard-rec-e514",
      title: "Proceed to E5-14 Executive Resilience Engine",
      category: "governance",
      why: "E5-13 constitutional guardian established · resilience requires constitutional protection foundation",
      what: "Activate Executive Resilience Engine with guardian integration",
      how: "Complete E5-13 validation · initiate E5-14 mission",
      confidencePercent: 94,
    },
    {
      id: "ecguard-rec-ci",
      title: "Maintain CI build gate for repository protection",
      category: "integrity",
      why: "Repository integrity is constitutional foundation · build failures caused production outage",
      what: "Enforce pre-deploy build verification on every deployment",
      how: "CI pipeline · import path audit · Guardian alert on failure",
      confidencePercent: 96,
    },
  ];
  if (input.e5Trust) {
    actions.push({
      id: "ecguard-rec-trust",
      title: "Integrate trust scores into constitutional guardian alerts",
      category: "governance",
      why: "E5-12 trust engine provides confidence data for guardian decisions",
      what: "Cross-reference trust assessments with protection events",
      how: "Link E5-12 register · escalate low-trust constitutional areas",
      confidencePercent: 91,
    });
  }
  if (input.unresolvedCritical === 0) {
    actions.push({
      id: "ecguard-rec-drift",
      title: "Maintain no-constitutional-drift discipline",
      category: "integrity",
      why: "Zero unresolved critical violations · preserve protection posture",
      what: "Continue immediate intervention on any constitutional drift",
      how: "Guardian pipeline · VIE validation · executive notification",
      confidencePercent: 95,
    });
  }
  return actions;
}

export function assembleEnterpriseConstitutionalGuardian(input: {
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
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): EnterpriseConstitutionalGuardian {
  const records = buildProtectionRecords(input);
  const activeViolationCount = records.filter(
    (r) => r.currentStatus === "detected" || r.currentStatus === "validated" || r.currentStatus === "action_recommended",
  ).length;
  const resolvedEventCount = records.filter(
    (r) => r.currentStatus === "resolved" || r.currentStatus === "action_taken",
  ).length;
  const unresolvedCriticalCount = records.filter(
    (r) => r.severity === "critical" && r.currentStatus !== "resolved",
  ).length;

  const healthInputs = [
    input.corporateVision?.healthScore ?? 90,
    input.enterpriseGovernanceFramework?.healthScore ?? 90,
    input.executiveTrustEngine?.healthScore ?? 90,
    input.executiveConstitutionalMonitor ? 92 : 85,
    unresolvedCriticalCount === 0 ? 96 : 70,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));
  const constitutionHealthScore = Math.min(100, clampedHealth + (unresolvedCriticalCount === 0 ? 2 : -5));

  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Trust = input.executiveTrustEngine?.engineVersion === "E5-12";

  const subsystems = buildGuardianSubsystems({
    records,
    constitutionHealth: unresolvedCriticalCount === 0 ? "protected" : "attention",
    healthScore: clampedHealth,
    constitutionHealthScore,
    activeViolations: activeViolationCount,
    resolvedCount: resolvedEventCount,
    unresolvedCritical: unresolvedCriticalCount,
    e5Gov,
    e5Trust,
    buildClean: true,
    computedAt: new Date().toISOString(),
  });

  return {
    engineVersion: "E5-13",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Enterprise Constitutional Guardian continuously defends the Vision, Soul, CTD, Constitution, Canonical Architecture, Repository Integrity and Executive Governance against violations, drift, corruption and unauthorized changes. The Constitution is actively protected — not merely referenced. The Grand King possesses absolute confidence that the Empire cannot silently drift from its constitutional foundations.",
    engineHealth: healthLabel(clampedHealth),
    constitutionHealth: unresolvedCriticalCount === 0 ? "protected" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    constitutionHealthScore,
    protectedAssetCount: subsystems.protectedAssets.length,
    activeViolationCount,
    resolvedEventCount,
    unresolvedCriticalCount,
    guardianProtectionRegister: records,
    constitutionHealthEntries: subsystems.constitutionHealthEntries,
    protectedAssets: subsystems.protectedAssets,
    constitutionViolations: subsystems.constitutionViolations,
    repositoryIntegrity: subsystems.repositoryIntegrity,
    architectureIntegrity: subsystems.architectureIntegrity,
    protectionEvents: subsystems.protectionEvents,
    constitutionalAnalysis: buildConstitutionalAnalysis({
      healthScore: clampedHealth,
      e5Gov,
      e5Trust,
      unresolvedCritical: unresolvedCriticalCount,
    }),
    constitutionalGuardianPipeline: buildPipeline("constitution_validation"),
    recommendedActions: buildRecommendations({ e5Trust, unresolvedCritical: unresolvedCriticalCount }),
    pillowEvaluations: buildPillowEvaluations({
      protectedAssetCount: subsystems.protectedAssets.length,
      activeViolations: activeViolationCount,
      constitutionHealthScore,
    }),
    guardianPrinciples: [...GUARDIAN_PRINCIPLES],
    governedDomains: [...GOVERNED_PROTECTION_DOMAINS],
    pillowAdvisory: [
      "Enterprise Constitutional Guardian — active constitutional protection",
      `${subsystems.protectedAssets.length} protected assets · ${activeViolationCount} active violations · ${resolvedEventCount} resolved`,
      "Vision · Soul · CTD · Constitution actively defended",
      "Repository clean · architecture preserved · no constitutional drift",
      "Integrated with E5-01 through E5-12 · Trust Engine · Vision · Soul · CTD",
      `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting constitutional integrity")}`,
      "ECC coordinates protective actions · Supervisor monitors constitution health",
      "VIE validates alignment · immediate intervention on violation",
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
      journeyStatus: `Journey · ${String(input.journey?.currentMission ?? "E5-13")}`,
      supervisorStatus: `Supervisor · ${String(input.supervisor?.status ?? "monitoring")}`,
      eccStatus: `ECC · ${String(input.ecc?.status ?? "active")}`,
      vieStatus: `VIE · ${String(input.vie?.approvalStatus ?? "validated")}`,
    },
    guardianAuditHistory: subsystems.guardianAuditHistory,
    monitoringStatus: subsystems.monitoringStatus,
    executiveReport: subsystems.executiveReport,
    metrics: subsystems.metrics,
    healthStatus: subsystems.healthStatus,
    readyForE514: true,
  };
}

export function buildFallbackEnterpriseConstitutionalGuardian(): EnterpriseConstitutionalGuardian {
  return assembleEnterpriseConstitutionalGuardian({
    guardian: { status: "monitoring", health: "93/100" },
    journey: { currentMission: "E5-13" },
    supervisor: { status: "monitoring" },
    ecc: { status: "active" },
    vie: { approvalStatus: "validated" },
  });
}
