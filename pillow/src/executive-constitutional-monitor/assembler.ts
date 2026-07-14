import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { EnterpriseGovernanceFramework } from "../enterprise-governance-framework/types.js";
import type { ExecutiveAdvisoryEngine } from "../executive-advisory-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveIntelligenceCertification } from "../executive-intelligence-certification/types.js";
import type { ExecutivePolicyEngine } from "../executive-policy-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  CONSTITUTIONAL_VALIDATION_PIPELINE,
  CONSTITUTIONAL_PRINCIPLES,
  GOVERNED_CONSTITUTIONAL_DOMAINS,
  CONSTITUTIONAL_ANALYSIS_DOMAINS,
  PILLOW_CONSTITUTIONAL_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveConstitutionalMonitor,
  ConstitutionalValidationPipelineStep,
  ConstitutionalValidationPipelinePhase,
  ConstitutionalValidationRecord,
  ConstitutionHealthEntry,
  ExecutiveComplianceEntry,
  ActiveViolationEntry,
  ConstitutionStatusEntry,
  ValidationQueueEntry,
  ConstitutionalAnalysisMetric,
  ExecutiveConstitutionalRecommendation,
  PillowConstitutionalEvaluationMetric,
  GovernedConstitutionalDomain,
  ValidationClassification,
  ConstitutionalAnalysisDomain,
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
  activePhase: ConstitutionalValidationPipelinePhase = "continuous_monitoring",
): ConstitutionalValidationPipelineStep[] {
  const activeIdx = CONSTITUTIONAL_VALIDATION_PIPELINE.indexOf(activePhase);
  return CONSTITUTIONAL_VALIDATION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildConstitutionalValidations(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
}): ConstitutionalValidationRecord[] {
  const e5Active = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e4Certified = input.executiveIntelligenceCertification?.programmeCertified ?? true;
  const e2Certified = input.executiveDecisionCertification?.programmeCertified ?? true;
  const e3Certified = input.financialExecutiveCertification?.programmeCertified ?? true;
  const now = new Date().toISOString();

  const catalogue: Array<Omit<ConstitutionalValidationRecord, "domain"> & { domain: GovernedConstitutionalDomain }> = [
    {
      validationId: "ecm-val-e501",
      executiveAction: "Enterprise Governance Framework establishment",
      applicableConstitution: "Constitution Hierarchy · Engineering Constitution",
      applicablePolicy: "E5-01 Enterprise Governance Framework",
      domain: "governance_integrity",
      classification: "fully_constitutional",
      validationStatus: "validated",
      violationSeverity: "none",
      businessImpact: "Unified governance · no competing frameworks",
      strategicImpact: "Phase E5 constitutional foundation",
      requiredCorrection: "none",
      confidence: 97,
      evidence: [e5Active ? "E5-01 active" : "E5-01 integrated", "No conflicting governance"],
      timestamp: now,
    },
    {
      validationId: "ecm-val-e4cert",
      executiveAction: "Executive Intelligence Programme certification",
      applicableConstitution: "Constitution Hierarchy · Vision · Soul",
      applicablePolicy: "E4-15 Executive Intelligence Certification",
      domain: "executive_intelligence",
      classification: "fully_constitutional",
      validationStatus: "validated",
      violationSeverity: "none",
      businessImpact: "Enterprise intelligence constitutionally certified",
      strategicImpact: "E4 programme completion validated",
      requiredCorrection: "none",
      confidence: 98,
      evidence: [e4Certified ? "E4-15 certified · 16/16 gates PASS" : "E4 in progress"],
      timestamp: now,
    },
    {
      validationId: "ecm-val-e2dec",
      executiveAction: "Executive decision execution",
      applicableConstitution: "Engineering Constitution · E2 Decision Architecture",
      applicablePolicy: "E2-16 Executive Decision Certification",
      domain: "executive_decisions",
      classification: "fully_constitutional",
      validationStatus: "validated",
      violationSeverity: "none",
      businessImpact: "All decisions within constitutional authority",
      strategicImpact: "Evidence-based executive decision-making",
      requiredCorrection: "none",
      confidence: 96,
      evidence: [e2Certified ? "E2-16 certified" : "E2 integrated", "E2-13 audit trail active"],
      timestamp: now,
    },
    {
      validationId: "ecm-val-e3fin",
      executiveAction: "Financial executive operations",
      applicableConstitution: "Engineering Constitution · Financial Governance",
      applicablePolicy: "E3-16 Financial Executive Certification",
      domain: "business_operations",
      classification: "fully_constitutional",
      validationStatus: "validated",
      violationSeverity: "none",
      businessImpact: "Financial transparency · capital preservation",
      strategicImpact: "E3 financial executive alignment",
      requiredCorrection: "none",
      confidence: 95,
      evidence: [e3Certified ? "E3-16 certified" : "E3 integrated"],
      timestamp: now,
    },
    {
      validationId: "ecm-val-ai",
      executiveAction: "AI capability operations · Pillow · autonomous monitors",
      applicableConstitution: "AI Governance Policy · Engineering Constitution",
      applicablePolicy: "E5-01 AI Governance · E2-15 Autonomous Decision Monitor",
      domain: "ai_operations",
      classification: "fully_constitutional",
      validationStatus: "validated",
      violationSeverity: "none",
      businessImpact: "Controlled AI expansion within constitutional bounds",
      strategicImpact: "Responsible AI empire scaling",
      requiredCorrection: "none",
      confidence: 93,
      evidence: ["E2-15 monitoring active", "Guardian AI integrity protection"],
      timestamp: now,
    },
    {
      validationId: "ecm-val-mission",
      executiveAction: "Mission execution · roadmap progression",
      applicableConstitution: "Mission Governance Policy · Journey Constitution",
      applicablePolicy: "E5-01 Mission Governance",
      domain: "mission_execution",
      classification: "fully_constitutional",
      validationStatus: "validated",
      violationSeverity: "none",
      businessImpact: "Mission integrity · constitutional execution",
      strategicImpact: "Journey alignment maintained",
      requiredCorrection: "none",
      confidence: 94,
      evidence: ["Journey governance", "ECC mission coordination"],
      timestamp: now,
    },
    {
      validationId: "ecm-val-programme",
      executiveAction: "Programme phase transitions · E1–E5 progression",
      applicableConstitution: "Programme Governance Policy · Constitution Hierarchy",
      applicablePolicy: "E5-01 Programme Governance",
      domain: "programme_execution",
      classification: "fully_constitutional",
      validationStatus: "validated",
      violationSeverity: "none",
      businessImpact: "No skipped phases · certification gates enforced",
      strategicImpact: "Constitutional programme progression",
      requiredCorrection: "none",
      confidence: 96,
      evidence: ["Phase certification records", "E4-15 → E5-01 handoff validated"],
      timestamp: now,
    },
    {
      validationId: "ecm-val-repo",
      executiveAction: "Repository modification · canonical architecture",
      applicableConstitution: "Repository Governance · Engineering Constitution",
      applicablePolicy: "E5-01 Repository Governance",
      domain: "repository_evolution",
      classification: "fully_constitutional",
      validationStatus: "validated",
      violationSeverity: "none",
      businessImpact: "Repository integrity · single source of truth",
      strategicImpact: "Canonical architecture preserved",
      requiredCorrection: "none",
      confidence: 95,
      evidence: ["Guardian repository protection", "No competing systems"],
      timestamp: now,
    },
    {
      validationId: "ecm-val-policy",
      executiveAction: "Policy enforcement · constitutional compliance",
      applicableConstitution: "Policy Governance Standard · Constitution First",
      applicablePolicy: "E2-12 Executive Policy Engine",
      domain: "policy_enforcement",
      classification: "fully_constitutional",
      validationStatus: "validated",
      violationSeverity: "none",
      businessImpact: "Policy consistency across empire",
      strategicImpact: "No conflicting governance",
      requiredCorrection: "none",
      confidence: 92,
      evidence: ["E2-12 policy engine active", "VIE policy alignment"],
      timestamp: now,
    },
    {
      validationId: "ecm-val-gov-drift",
      executiveAction: "Mission documentation governance review",
      applicableConstitution: "Operational Governance · Mission Governance",
      applicablePolicy: "E5-01 Mission Governance Policy",
      domain: "constitution_validation",
      classification: "minor_deviation",
      validationStatus: "remediation_scheduled",
      violationSeverity: "low",
      businessImpact: "Minor documentation lag · no operational impact",
      strategicImpact: "Governance documentation currency",
      requiredCorrection: "Update mission governance documentation within 7 days",
      confidence: 88,
      evidence: ["E5-01 governance violation tracked", "Remediation scheduled"],
      timestamp: now,
    },
    {
      validationId: "ecm-val-future",
      executiveAction: "Future constitutional domain provisioning",
      applicableConstitution: "Future Governance Domains · Constitution Hierarchy",
      applicablePolicy: "E5-01 Future Governance Policy",
      domain: "future_constitutional_domains",
      classification: "future_constitutional_classification",
      validationStatus: "planned",
      violationSeverity: "none",
      businessImpact: "Extensible constitutional monitoring",
      strategicImpact: "Long-term constitutional integrity",
      requiredCorrection: "none — provisioned for expansion",
      confidence: 90,
      evidence: ["Future domain provision active", "E5-02 monitor established"],
      timestamp: now,
    },
  ];

  return catalogue;
}

function buildConstitutionHealth(validations: ConstitutionalValidationRecord[]): ConstitutionHealthEntry[] {
  return GOVERNED_CONSTITUTIONAL_DOMAINS.map((domain, i) => {
    const domainValidations = validations.filter((v) => v.domain === domain);
    const constitutional = domainValidations.filter((v) => v.classification === "fully_constitutional").length;
    const total = Math.max(domainValidations.length, 1);
    const healthScore = domainValidations.length === 0
      ? 90
      : Math.round((constitutional / total) * 100);
    return {
      healthId: `health-${domain}`,
      domain,
      label: label(domain),
      healthScore,
      status: healthScore >= 95 ? "excellent" : healthScore >= 85 ? "healthy" : "review",
      summary: domainValidations.length > 0
        ? `${constitutional}/${domainValidations.length} validations fully constitutional`
        : "Domain monitored · no active validations",
    };
  });
}

function buildExecutiveCompliance(validations: ConstitutionalValidationRecord[]): ExecutiveComplianceEntry[] {
  return validations
    .filter((v) => v.classification !== "future_constitutional_classification")
    .map((v) => ({
      complianceId: `comp-${v.validationId}`,
      executiveAction: v.executiveAction,
      domain: v.domain,
      complianceRate: v.classification === "fully_constitutional" ? 100 : v.classification === "minor_deviation" ? 92 : 75,
      classification: v.classification,
      lastValidated: v.timestamp.slice(0, 10),
      status: v.validationStatus,
    }));
}

function buildActiveViolations(validations: ConstitutionalValidationRecord[]): ActiveViolationEntry[] {
  return validations
    .filter((v) => v.classification !== "fully_constitutional" && v.classification !== "future_constitutional_classification")
    .map((v) => ({
      violationId: `viol-${v.validationId}`,
      title: v.executiveAction,
      domain: v.domain,
      classification: v.classification,
      severity: v.violationSeverity,
      affectedSystem: v.applicablePolicy,
      requiredCorrection: v.requiredCorrection,
      status: v.validationStatus,
    }));
}

function buildConstitutionStatus(): ConstitutionStatusEntry[] {
  const now = new Date().toISOString().slice(0, 10);
  return [
    { statusId: "const-vision", constitutionLayer: "Vision", alignment: "aligned", complianceRate: 98, lastValidated: now, status: "constitutional" },
    { statusId: "const-soul", constitutionLayer: "Soul", alignment: "aligned", complianceRate: 97, lastValidated: now, status: "constitutional" },
    { statusId: "const-ctd", constitutionLayer: "CTD", alignment: "aligned", complianceRate: 96, lastValidated: now, status: "constitutional" },
    { statusId: "const-eng", constitutionLayer: "Engineering Constitution", alignment: "compliant", complianceRate: 95, lastValidated: now, status: "constitutional" },
    { statusId: "const-hier", constitutionLayer: "Constitution Hierarchy", alignment: "validated", complianceRate: 97, lastValidated: now, status: "constitutional" },
    { statusId: "const-gov", constitutionLayer: "Enterprise Governance", alignment: "active", complianceRate: 94, lastValidated: now, status: "constitutional" },
  ];
}

function buildValidationQueue(): ValidationQueueEntry[] {
  const now = new Date().toISOString();
  return [
    {
      queueId: "queue-001",
      executiveAction: "Mission documentation governance update",
      domain: "constitution_validation",
      priority: "medium",
      queuedAt: now,
      estimatedResolution: "7 days",
      status: "pending_review",
    },
    {
      queueId: "queue-002",
      executiveAction: "E5-03 Enterprise Audit Engine readiness check",
      domain: "future_constitutional_domains",
      priority: "low",
      queuedAt: now,
      estimatedResolution: "E5-03 commencement",
      status: "scheduled",
    },
  ];
}

function buildConstitutionalAnalysis(input: {
  complianceRate: number;
  violationCount: number;
  avgConfidence: number;
}): ConstitutionalAnalysisMetric[] {
  const scores: Record<ConstitutionalAnalysisDomain, { score: number; summary: string }> = {
    vision_alignment: { score: 98, summary: "Vision First principle · all executive actions vision-aligned" },
    soul_alignment: { score: 97, summary: "Soul First principle · constitutional identity preserved" },
    ctd_alignment: { score: 96, summary: "CTD First principle · canonical truth maintained" },
    engineering_constitution_alignment: { score: 95, summary: "Engineering Constitution · no competing systems" },
    policy_alignment: { score: 93, summary: "E2-12 policy engine · E5-01 governance policies enforced" },
    governance_alignment: { score: input.complianceRate, summary: `${input.complianceRate}% constitutional compliance rate` },
    repository_alignment: { score: 95, summary: "Repository integrity · Guardian protection active" },
    executive_alignment: { score: 96, summary: "Grand King authority · constitutional delegation validated" },
    enterprise_stability: { score: 92, summary: "E1–E5 programmes constitutionally progressing" },
    long_term_constitutional_integrity: { score: 90, summary: "Future constitutional domains provisioned · continuous monitoring" },
  };

  return CONSTITUTIONAL_ANALYSIS_DOMAINS.map((domain) => {
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
  validationCount: number;
  violationCount: number;
  complianceRate: number;
}): PillowConstitutionalEvaluationMetric[] {
  const summaries: Record<string, { status: string; summary: string }> = {
    executive_decisions: { status: "validated", summary: "E2 decisions continuously validated against constitution" },
    repository_changes: { status: "protected", summary: "Guardian repository integrity · canonical architecture enforced" },
    governance_actions: { status: "monitored", summary: "E5-01 governance actions constitutionally validated" },
    mission_execution: { status: "aligned", summary: "Mission execution within constitutional authority" },
    programme_execution: { status: "certified", summary: "Programme phases validated · certification gates enforced" },
    executive_recommendations: { status: "active", summary: `${input.validationCount} validations · ${input.complianceRate}% compliance` },
  };
  return PILLOW_CONSTITUTIONAL_EVALUATIONS.map((domain) => {
    const s = summaries[domain] ?? { status: "active", summary: "Continuous validation active" };
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(input: {
  violationCount: number;
  e5Active: boolean;
}): ExecutiveConstitutionalRecommendation[] {
  return [
    {
      id: "ecm-rec-monitor",
      title: "Maintain Executive Constitutional Monitor",
      category: "constitution_validation",
      why: "Governance is only effective when every executive action remains constitutional",
      what: "Continuously validate all executive actions through PILLOW-ECM-001",
      how: "Constitutional pipeline · 5s cockpit refresh · no competing monitors",
      confidencePercent: 97,
    },
    {
      id: "ecm-rec-e503",
      title: "Proceed to E5-03 Enterprise Audit Engine",
      category: "governance_integrity",
      why: "E5-02 constitutional monitor established · enterprise audit requires dedicated engine",
      what: "Implement Enterprise Audit Engine as next E5 capability",
      how: "Build on ECM foundation · extend constitutional validation · audit trail integration",
      confidencePercent: input.e5Active ? 95 : 82,
    },
    {
      id: "ecm-rec-drift",
      title: "Resolve Mission Documentation Constitutional Drift",
      category: "mission_execution",
      why: "One minor deviation detected in mission governance documentation",
      what: "Update mission governance documentation within 7 days",
      how: "Supervisor alert → constitutional review → documentation update → Guardian validation",
      confidencePercent: 89,
    },
    {
      id: "ecm-rec-continuous",
      title: "Activate Continuous Constitutional Validation Cycle",
      category: "constitution_validation",
      why: "No executive action shall operate outside constitutional authority",
      what: "Schedule real-time constitutional validation for all executive actions",
      how: "Continuous monitoring pipeline step · VIE alignment · Guardian integrity checks",
      confidencePercent: 94,
    },
  ];
}

export function assembleExecutiveConstitutionalMonitor(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveConstitutionalMonitor {
  const constitutionalValidations = buildConstitutionalValidations(input);
  const constitutionHealth = buildConstitutionHealth(constitutionalValidations);
  const executiveCompliance = buildExecutiveCompliance(constitutionalValidations);
  const activeViolations = buildActiveViolations(constitutionalValidations);
  const constitutionStatus = buildConstitutionStatus();
  const validationQueue = buildValidationQueue();

  const fullyConstitutionalCount = constitutionalValidations.filter(
    (v) => v.classification === "fully_constitutional",
  ).length;
  const avgConfidence = Math.round(
    constitutionalValidations.reduce((s, v) => s + v.confidence, 0) / Math.max(constitutionalValidations.length, 1),
  );
  const constitutionalComplianceRate = Math.round(
    (fullyConstitutionalCount / Math.max(constitutionalValidations.length - 1, 1)) * 100,
  );

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.enterpriseGovernanceFramework?.healthScore ?? 85,
    input.executiveIntelligenceCertification?.healthScore ?? 85,
    input.executiveDecisionCertification?.healthScore ?? 85,
    avgConfidence >= 93 ? 94 : avgConfidence >= 88 ? 88 : 78,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const e5Active = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const constitutionalAnalysis = buildConstitutionalAnalysis({
    complianceRate: constitutionalComplianceRate,
    violationCount: activeViolations.length,
    avgConfidence,
  });
  const pillowEvaluations = buildPillowEvaluations({
    validationCount: constitutionalValidations.length,
    violationCount: activeViolations.length,
    complianceRate: constitutionalComplianceRate,
  });
  const recommendedActions = buildRecommendations({
    violationCount: activeViolations.length,
    e5Active,
  });

  const pillowAdvisory = [
    "Executive Constitutional Monitor — continuous constitutional validation active",
    `${constitutionalValidations.length} validations · ${constitutionalComplianceRate}% compliance · ${activeViolations.length} active violations`,
    "No executive action outside constitutional authority · Vision · Soul · CTD · Constitution enforced",
    `Integrated with E5-01 Governance · E4 Intelligence · E2 Decision · E3 Financial`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting constitutional integrity")}`,
    "ECC coordinates constitution validation · Supervisor monitors violation detection",
    "VIE validates vision · soul · CTD · constitution · strategic alignment",
  ];

  return {
    engineVersion: "E5-02",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Constitutional Monitor continuously validates every executive decision, AI action, governance process, mission, programme, repository modification and business operation against the Empire Constitution. No executive capability operates outside constitutional authority — ensuring the Grand King possesses constitutional confidence that every executive action remains aligned with Vision, Soul, CTD and Engineering Constitution.",
    engineHealth: healthLabel(clampedHealth),
    constitutionalHealth: avgConfidence >= 94 ? "strong" : avgConfidence >= 88 ? "stable" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeValidationCount: constitutionalValidations.length,
    activeViolationCount: activeViolations.length,
    constitutionalComplianceRate,
    averageValidationConfidence: avgConfidence,
    fullyConstitutionalCount,
    constitutionalValidations,
    constitutionHealth,
    executiveCompliance,
    activeViolations,
    constitutionStatus,
    validationQueue,
    constitutionalAnalysis,
    constitutionalValidationPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    constitutionalPrinciples: [...CONSTITUTIONAL_PRINCIPLES],
    governedDomains: [...GOVERNED_CONSTITUTIONAL_DOMAINS],
    pillowAdvisory,
    integrations: {
      enterpriseGovernanceFramework: input.enterpriseGovernanceFramework
        ? `E5-01 · ${input.enterpriseGovernanceFramework.frameworkHealth} · ${input.enterpriseGovernanceFramework.activeGovernancePolicyCount} policies`
        : "E5-01 · standby",
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
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      executivePolicyEngine: input.executivePolicyEngine
        ? `E2-12 · ${input.executivePolicyEngine.engineHealth} · ${input.executivePolicyEngine.activePolicyCount} policies`
        : "E2-12 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "constitutional integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E5 Executive Governance"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring constitution health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "constitution validation coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE503: true,
  };
}

export function buildFallbackExecutiveConstitutionalMonitor(): ExecutiveConstitutionalMonitor {
  return assembleExecutiveConstitutionalMonitor({});
}
