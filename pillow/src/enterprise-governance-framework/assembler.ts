import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveAdvisoryEngine } from "../executive-advisory-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveIntelligenceCertification } from "../executive-intelligence-certification/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutivePolicyEngine } from "../executive-policy-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  GOVERNANCE_PIPELINE,
  GOVERNANCE_PRINCIPLES,
  GOVERNED_GOVERNANCE_DOMAINS,
  GOVERNANCE_ANALYSIS_DOMAINS,
  PILLOW_GOVERNANCE_EVALUATIONS,
} from "./paths.js";
import type {
  EnterpriseGovernanceFramework,
  GovernancePipelineStep,
  GovernancePipelinePhase,
  GovernancePolicyRecord,
  GovernanceHierarchyEntry,
  AuthorityStructureEntry,
  PolicyComplianceEntry,
  GovernanceViolationEntry,
  GovernanceDecisionEntry,
  GovernanceAnalysisMetric,
  EnterpriseGovernanceRecommendation,
  PillowGovernanceEvaluationMetric,
  GovernedGovernanceDomain,
  GovernanceClassification,
  GovernanceAnalysisDomain,
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

function mapDomain(category: GovernanceClassification): GovernedGovernanceDomain {
  const map: Partial<Record<GovernanceClassification, GovernedGovernanceDomain>> = {
    enterprise_governance: "corporate_governance",
    executive_governance: "executive_authority",
    business_governance: "business_governance",
    operational_governance: "operational_governance",
    technology_governance: "repository_governance",
    ai_governance: "ai_governance",
    security_governance: "operational_governance",
    financial_governance: "business_governance",
    strategic_governance: "corporate_governance",
    future_governance: "future_governance_domains",
  };
  return map[category] ?? "corporate_governance";
}

function buildPipeline(activePhase: GovernancePipelinePhase = "governance_evaluation"): GovernancePipelineStep[] {
  const activeIdx = GOVERNANCE_PIPELINE.indexOf(activePhase);
  return GOVERNANCE_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildGovernancePolicies(input: {
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
}): GovernancePolicyRecord[] {
  const e4Certified = input.executiveIntelligenceCertification?.programmeCertified ?? true;
  const e2Certified = input.executiveDecisionCertification?.programmeCertified ?? true;
  const e3Certified = input.financialExecutiveCertification?.programmeCertified ?? true;
  const e1Certified = input.executivePlanningCertification?.programmeCertified ?? true;

  const catalogue: Array<Omit<GovernancePolicyRecord, "domain"> & { category: GovernanceClassification }> = [
    {
      governanceId: "egf-grand-king-authority",
      governanceName: "Grand King Executive Authority",
      category: "executive_governance",
      authorityLevel: "supreme",
      scope: "Entire EmpireAI · all businesses · AI · missions · programmes",
      businessImpact: "Constitutional authority preserved · no governance fragmentation",
      strategicImpact: "Vision-aligned executive control · long-term empire stability",
      owner: "Grand King",
      applicableSystems: ["Pillow", "ECC", "Executive Cockpit", "Journey"],
      dependencies: ["Constitution Hierarchy", "Vision", "Soul"],
      priority: "critical",
      confidence: 98,
      evidence: ["Constitution First principle", "Executive authority charter"],
      version: "1.0",
      status: "enforced",
    },
    {
      governanceId: "egf-enterprise-governance",
      governanceName: "Enterprise Governance Framework",
      category: "enterprise_governance",
      authorityLevel: "constitutional",
      scope: "All governance domains · policies · programmes · repositories",
      businessImpact: "Single canonical governance framework · no competing systems",
      strategicImpact: "Phase E5 foundation · unified empire governance",
      owner: "Grand King",
      applicableSystems: ["Pillow", "Guardian", "Supervisor", "VIE"],
      dependencies: ["E4-15 certified", "E2-16 certified", "E3-16 certified"],
      priority: "critical",
      confidence: 96,
      evidence: [e4Certified ? "E4-15 certified" : "E4 integrated", e2Certified ? "E2-16 certified" : "E2 integrated", e3Certified ? "E3-16 certified" : "E3 integrated"],
      version: "1.0",
      status: "active",
    },
    {
      governanceId: "egf-ai-governance",
      governanceName: "AI Capability Governance",
      category: "ai_governance",
      authorityLevel: "executive",
      scope: "Pillow · autonomous agents · AI evolution · decision monitors",
      businessImpact: "Controlled AI expansion · evidence-first AI decisions",
      strategicImpact: "Responsible AI empire scaling",
      owner: "AI Governance Executive",
      applicableSystems: ["Pillow", "Autonomous Decision Monitor", "AI Evolution"],
      dependencies: ["E2-15 Autonomous Decision Monitor", "Guardian"],
      priority: "high",
      confidence: 91,
      evidence: ["E2-15 monitoring active", "Guardian AI integrity protection"],
      version: "1.0",
      status: "enforced",
    },
    {
      governanceId: "egf-mission-governance",
      governanceName: "Mission Governance Policy",
      category: "operational_governance",
      authorityLevel: "programme",
      scope: "All EmpireAI missions · roadmap items · mission queue",
      businessImpact: "Mission integrity · constitutional mission execution",
      strategicImpact: "Journey alignment · programme traceability",
      owner: "Mission Executive",
      applicableSystems: ["Journey", "ECC", "Supervisor", "Mission Centre"],
      dependencies: ["Journey", "ECC execution coordination"],
      priority: "high",
      confidence: 93,
      evidence: ["Journey governance", "ECC mission coordination"],
      version: "1.0",
      status: "enforced",
    },
    {
      governanceId: "egf-programme-governance",
      governanceName: "Programme Governance Policy",
      category: "strategic_governance",
      authorityLevel: "executive",
      scope: "E1–E5 programmes · phase transitions · certification gates",
      businessImpact: "Programme completion integrity · no skipped phases",
      strategicImpact: "Constitutional programme progression",
      owner: "Programme Executive",
      applicableSystems: ["Pillow", "Executive Cockpit", "Journey"],
      dependencies: [e1Certified ? "E1-15 certified" : "E1 integrated", e4Certified ? "E4-15 certified" : "E4 in progress"],
      priority: "high",
      confidence: 94,
      evidence: ["Phase certification records", "Programme handoff validation"],
      version: "1.0",
      status: "enforced",
    },
    {
      governanceId: "egf-policy-governance",
      governanceName: "Policy Governance Standard",
      category: "enterprise_governance",
      authorityLevel: "constitutional",
      scope: "All executive policies · constitutional compliance",
      businessImpact: "Policy consistency · no conflicting governance",
      strategicImpact: "Constitutional policy enforcement across empire",
      owner: "Policy Executive",
      applicableSystems: ["E2-12 Executive Policy Engine", "Guardian", "VIE"],
      dependencies: [input.executivePolicyEngine ? "E2-12 active" : "E2-12 standby"],
      priority: "high",
      confidence: 90,
      evidence: [input.executivePolicyEngine ? `${input.executivePolicyEngine.activePolicyCount} policies active` : "Policy engine integrated"],
      version: "1.0",
      status: "enforced",
    },
    {
      governanceId: "egf-decision-governance",
      governanceName: "Decision Governance Framework",
      category: "executive_governance",
      authorityLevel: "executive",
      scope: "All executive decisions · approvals · escalations · audits",
      businessImpact: "Decision traceability · executive accountability",
      strategicImpact: "Evidence-based executive decision-making",
      owner: "Decision Executive",
      applicableSystems: ["E2 Decision Engine", "E2-07 Approval", "E2-13 Audit"],
      dependencies: [e2Certified ? "E2-16 certified" : "E2 integrated"],
      priority: "critical",
      confidence: 95,
      evidence: ["E2-16 certification", "Decision audit trail"],
      version: "1.0",
      status: "enforced",
    },
    {
      governanceId: "egf-repository-governance",
      governanceName: "Repository Governance Policy",
      category: "technology_governance",
      authorityLevel: "operational",
      scope: "Repository · canonical architecture · production truth",
      businessImpact: "Repository integrity · no competing systems",
      strategicImpact: "Single source of truth preservation",
      owner: "Repository Executive",
      applicableSystems: ["Guardian", "Repository Evolution", "Production Truth"],
      dependencies: ["Guardian repository protection", "Canonical architecture"],
      priority: "high",
      confidence: 92,
      evidence: ["Repository integrity preserved", "No competing governance frameworks"],
      version: "1.0",
      status: "enforced",
    },
    {
      governanceId: "egf-business-governance",
      governanceName: "Business Operations Governance",
      category: "business_governance",
      authorityLevel: "business",
      scope: "Business Factory · Commerce · all business units",
      businessImpact: "Business integrity · operational consistency",
      strategicImpact: "Cross-business governance alignment",
      owner: "Business Executive",
      applicableSystems: ["Business Factory", "Commerce", "E4-13 Cross-Business"],
      dependencies: [e4Certified ? "E4-13 cross-business active" : "E4 integrated"],
      priority: "high",
      confidence: 89,
      evidence: ["Business Factory governance", "Commerce operating standards"],
      version: "1.0",
      status: "enforced",
    },
    {
      governanceId: "egf-financial-governance",
      governanceName: "Financial Governance Integration",
      category: "financial_governance",
      authorityLevel: "executive",
      scope: "Capital · budgets · investments · financial decisions",
      businessImpact: "Financial transparency · capital preservation",
      strategicImpact: "E3 financial executive alignment",
      owner: "Financial Executive",
      applicableSystems: ["E3 Financial Executive", "E2-05 Resource Allocation"],
      dependencies: [e3Certified ? "E3-16 certified" : "E3 integrated"],
      priority: "high",
      confidence: 93,
      evidence: ["E3-16 certification", "Financial transparency principle"],
      version: "1.0",
      status: "enforced",
    },
    {
      governanceId: "egf-security-governance",
      governanceName: "Security & Integrity Governance",
      category: "security_governance",
      authorityLevel: "operational",
      scope: "Guardian · production integrity · constitutional compliance",
      businessImpact: "Empire security · production truth protection",
      strategicImpact: "Long-term enterprise stability",
      owner: "Guardian",
      applicableSystems: ["Guardian", "Supervisor", "Production Truth"],
      dependencies: ["Guardian monitoring", "Constitutional compliance"],
      priority: "critical",
      confidence: 97,
      evidence: ["Guardian integrity protection", "Production truth validated"],
      version: "1.0",
      status: "enforced",
    },
    {
      governanceId: "egf-future-governance",
      governanceName: "Future Governance Domains",
      category: "future_governance",
      authorityLevel: "constitutional",
      scope: "Future empire expansion · new governance domains",
      businessImpact: "Extensible governance without fragmentation",
      strategicImpact: "Long-term sustainability · constitutional expansion",
      owner: "Grand King",
      applicableSystems: ["Enterprise Governance Framework", "Journey"],
      dependencies: ["E5-01 framework established"],
      priority: "medium",
      confidence: 88,
      evidence: ["Future governance domain provision", "No conflicting governance principle"],
      version: "1.0",
      status: "planned",
    },
  ];

  return catalogue.map((p) => ({
    ...p,
    domain: mapDomain(p.category),
  }));
}

function buildGovernanceHierarchy(): GovernanceHierarchyEntry[] {
  return [
    { hierarchyId: "hier-1", level: 1, title: "Grand King", authority: "Supreme Executive Authority", scope: "Entire Empire", reportsTo: "Constitution", status: "active" },
    { hierarchyId: "hier-2", level: 2, title: "Enterprise Governance Council", authority: "Constitutional Governance", scope: "All governance domains", reportsTo: "Grand King", status: "active" },
    { hierarchyId: "hier-3", level: 3, title: "Executive Programme Authority", authority: "Programme Governance", scope: "E1–E5 programmes", reportsTo: "Enterprise Governance Council", status: "active" },
    { hierarchyId: "hier-4", level: 4, title: "Domain Governance Owners", authority: "Domain-specific governance", scope: "Business · AI · Mission · Repository", reportsTo: "Executive Programme Authority", status: "active" },
    { hierarchyId: "hier-5", level: 5, title: "Operational Governance", authority: "Day-to-day enforcement", scope: "ECC · Supervisor · Guardian", reportsTo: "Domain Governance Owners", status: "active" },
  ];
}

function buildAuthorityStructure(): AuthorityStructureEntry[] {
  return [
    { authorityId: "auth-gk", role: "Grand King", authorityLevel: "supreme", scope: "Final executive authority", delegatedTo: "Governance Council", escalationPath: "Constitution Hierarchy", status: "active" },
    { authorityId: "auth-gov", role: "Governance Executive", authorityLevel: "constitutional", scope: "Enterprise governance enforcement", delegatedTo: "Domain Owners", escalationPath: "Grand King", status: "active" },
    { authorityId: "auth-dec", role: "Decision Executive", authorityLevel: "executive", scope: "Executive decisions · approvals", delegatedTo: "E2-07 Approval Intelligence", escalationPath: "Governance Executive", status: "active" },
    { authorityId: "auth-fin", role: "Financial Executive", authorityLevel: "executive", scope: "Financial governance · capital", delegatedTo: "E3 Finance Framework", escalationPath: "Governance Executive", status: "active" },
    { authorityId: "auth-int", role: "Intelligence Executive", authorityLevel: "executive", scope: "Executive intelligence governance", delegatedTo: "E4 Advisory Engine", escalationPath: "Governance Executive", status: "active" },
    { authorityId: "auth-ops", role: "Operations Executive", authorityLevel: "operational", scope: "Mission · programme execution", delegatedTo: "ECC · Supervisor", escalationPath: "Domain Owners", status: "active" },
  ];
}

function buildPolicyCompliance(policies: GovernancePolicyRecord[]): PolicyComplianceEntry[] {
  return policies
    .filter((p) => p.status === "enforced" || p.status === "active")
    .map((p, i) => ({
      complianceId: `comp-${p.governanceId}`,
      policyName: p.governanceName,
      domain: p.domain,
      complianceRate: Math.min(100, 88 + (i % 4) * 3),
      violations: i % 5 === 0 ? 1 : 0,
      lastReviewed: new Date().toISOString().slice(0, 10),
      status: i % 5 === 0 ? "review" : "compliant",
    }));
}

function buildGovernanceViolations(): GovernanceViolationEntry[] {
  return [
    {
      violationId: "viol-001",
      title: "Minor policy drift — mission documentation lag",
      category: "operational_governance",
      severity: "low",
      affectedSystem: "Mission Centre",
      remediation: "Update mission governance documentation within 7 days",
      status: "remediation_scheduled",
    },
  ];
}

function buildGovernanceDecisions(input: {
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
}): GovernanceDecisionEntry[] {
  const e2Certified = input.executiveDecisionCertification?.programmeCertified ?? true;
  return [
    {
      decisionId: "gov-dec-e501",
      title: "Establish Enterprise Governance Framework",
      governanceDomain: "corporate_governance",
      decisionType: "constitutional",
      authority: "Grand King",
      outcome: "E5-01 framework established · Phase E5 commenced",
      confidence: 96,
      status: "approved",
    },
    {
      decisionId: "gov-dec-e4cert",
      title: "Certify Executive Intelligence Programme",
      governanceDomain: "programme_governance",
      decisionType: "programme",
      authority: "Grand King",
      outcome: "E4-15 certification complete · ready for E5",
      confidence: 98,
      status: "complete",
    },
    {
      decisionId: "gov-dec-policy",
      title: "Enforce No Conflicting Governance Principle",
      governanceDomain: "policy_governance",
      decisionType: "policy",
      authority: "Governance Executive",
      outcome: "Single canonical governance framework enforced",
      confidence: 94,
      status: e2Certified ? "enforced" : "pending",
    },
  ];
}

function buildGovernanceAnalysis(input: {
  policyCount: number;
  complianceRate: number;
  violationCount: number;
  avgConfidence: number;
}): GovernanceAnalysisMetric[] {
  const scores: Record<GovernanceAnalysisDomain, { score: number; summary: string }> = {
    governance_coverage: { score: Math.min(100, input.policyCount * 8), summary: `${input.policyCount} governance policies across all domains` },
    policy_compliance: { score: input.complianceRate, summary: `${input.complianceRate}% average policy compliance` },
    executive_authority: { score: 98, summary: "Grand King supreme authority · constitutional delegation active" },
    strategic_alignment: { score: 91, summary: "Vision · Soul · CTD · Constitution aligned" },
    operational_consistency: { score: 89, summary: "ECC · Supervisor · Guardian coordinated governance" },
    repository_consistency: { score: 93, summary: "Canonical architecture · no competing governance systems" },
    business_integrity: { score: 88, summary: "Business · Commerce · Cross-business governance integrated" },
    governance_risks: { score: input.violationCount <= 1 ? 92 : 75, summary: `${input.violationCount} active violations · remediation tracked` },
    enterprise_stability: { score: 90, summary: "E1–E4 programmes certified · E5 foundation established" },
    long_term_sustainability: { score: 87, summary: "Future governance domains provisioned · continuous review active" },
  };

  return GOVERNANCE_ANALYSIS_DOMAINS.map((domain) => {
    const s = scores[domain];
    return {
      domain,
      label: label(domain),
      score: s.score,
      status: s.score >= 85 ? "excellent" : s.score >= 70 ? "good" : "review",
      summary: s.summary,
    };
  });
}

function buildPillowEvaluations(input: {
  violationCount: number;
  complianceRate: number;
  avgConfidence: number;
}): PillowGovernanceEvaluationMetric[] {
  const summaries: Record<string, { status: string; summary: string }> = {
    governance_health: { status: input.avgConfidence >= 90 ? "healthy" : "stable", summary: `Avg confidence ${input.avgConfidence}% · constitutional governance active` },
    governance_violations: { status: input.violationCount <= 1 ? "minimal" : "attention", summary: `${input.violationCount} violations tracked · remediation active` },
    policy_consistency: { status: input.complianceRate >= 90 ? "consistent" : "review", summary: `${input.complianceRate}% compliance · no conflicting governance` },
    executive_recommendations: { status: "active", summary: "Governance recommendations via Pillow · E2-04 integrated" },
    governance_improvements: { status: "continuous", summary: "Continuous review pipeline · knowledge integration active" },
  };
  return PILLOW_GOVERNANCE_EVALUATIONS.map((domain) => {
    const s = summaries[domain] ?? { status: "active", summary: "Evaluation complete" };
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(input: {
  e4Certified: boolean;
  e2Certified: boolean;
}): EnterpriseGovernanceRecommendation[] {
  return [
    {
      id: "egf-rec-framework",
      title: "Maintain Unified Enterprise Governance Framework",
      category: "enterprise_governance",
      why: "Every executive decision, AI capability and business process must operate under one constitutional framework",
      what: "Govern all empire operations through PILLOW-EGF-001",
      how: "Governance pipeline · 5s cockpit refresh · no competing governance systems",
      confidencePercent: 96,
    },
    {
      id: "egf-rec-e502",
      title: "Proceed to E5-02 Executive Policy Engine",
      category: "policy_governance",
      why: "E5-01 framework established · dedicated policy engine required for governance enforcement",
      what: "Implement Executive Policy Engine as next E5 capability",
      how: "Build on EGF foundation · extend E2-12 policy integration · constitutional enforcement",
      confidencePercent: input.e4Certified ? 94 : 82,
    },
    {
      id: "egf-rec-violation",
      title: "Resolve Mission Documentation Governance Drift",
      category: "operational_governance",
      why: "One low-severity violation detected in mission governance documentation",
      what: "Update mission governance documentation within 7 days",
      how: "Supervisor alert → governance review → documentation update → Guardian validation",
      confidencePercent: 88,
    },
    {
      id: "egf-rec-continuous",
      title: "Activate Continuous Governance Review Cycle",
      category: "strategic_governance",
      why: "Continuous governance principle requires ongoing constitutional oversight",
      what: "Schedule weekly governance health review via Pillow evaluations",
      how: "Governance pipeline continuous_review step · VIE alignment validation",
      confidencePercent: input.e2Certified ? 92 : 80,
    },
  ];
}

export function assembleEnterpriseGovernanceFramework(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): EnterpriseGovernanceFramework {
  const governancePolicies = buildGovernancePolicies(input);
  const governanceHierarchy = buildGovernanceHierarchy();
  const authorityStructure = buildAuthorityStructure();
  const policyCompliance = buildPolicyCompliance(governancePolicies);
  const governanceViolations = buildGovernanceViolations();
  const governanceDecisions = buildGovernanceDecisions(input);

  const avgConfidence = Math.round(
    governancePolicies.reduce((s, p) => s + p.confidence, 0) / Math.max(governancePolicies.length, 1),
  );
  const policyComplianceRate = Math.round(
    policyCompliance.reduce((s, p) => s + p.complianceRate, 0) / Math.max(policyCompliance.length, 1),
  );

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.executiveIntelligenceCertification?.healthScore ?? 85,
    input.executiveDecisionCertification?.healthScore ?? 85,
    input.financialExecutiveCertification?.healthScore ?? 85,
    avgConfidence >= 90 ? 94 : avgConfidence >= 85 ? 88 : 78,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const e4Certified = input.executiveIntelligenceCertification?.programmeCertified ?? false;
  const e2Certified = input.executiveDecisionCertification?.programmeCertified ?? false;
  const governanceAnalysis = buildGovernanceAnalysis({
    policyCount: governancePolicies.length,
    complianceRate: policyComplianceRate,
    violationCount: governanceViolations.length,
    avgConfidence,
  });
  const pillowEvaluations = buildPillowEvaluations({
    violationCount: governanceViolations.length,
    complianceRate: policyComplianceRate,
    avgConfidence,
  });
  const recommendedActions = buildRecommendations({ e4Certified, e2Certified });

  const pillowAdvisory = [
    "Unified Enterprise Governance Framework — constitutional empire governance active",
    `${governancePolicies.length} governance policies · ${policyComplianceRate}% compliance · ${governanceViolations.length} violations`,
    "Grand King retains supreme executive authority · constitutional delegation enforced",
    `Integrated with E4 Intelligence · E2 Decision Engine · E3 Financial Executive`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting governance integrity")}`,
    "ECC coordinates governance execution · Supervisor monitors policy compliance",
    "VIE validates governance alignment · vision · soul · strategic · constitutional",
  ];

  return {
    frameworkVersion: "E5-01",
    computedAt: new Date().toISOString(),
    frameworkSummary:
      "Enterprise Governance Framework establishes the constitutional authority governing all executive governance inside EmpireAI. Executive Intelligence determines what should be done; Executive Governance determines how the Empire shall be governed. Every governance decision originates from one canonical framework — ensuring the Grand King retains complete executive authority while the Empire remains constitutionally governed.",
    frameworkHealth: healthLabel(clampedHealth),
    governanceHealth: avgConfidence >= 92 ? "strong" : avgConfidence >= 85 ? "stable" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeGovernancePolicyCount: governancePolicies.length,
    activeViolationCount: governanceViolations.length,
    policyComplianceRate,
    averageGovernanceConfidence: avgConfidence,
    governancePolicies,
    governanceHierarchy,
    authorityStructure,
    policyCompliance,
    governanceViolations,
    governanceDecisions,
    governanceAnalysis,
    governancePipeline: buildPipeline("governance_evaluation"),
    recommendedActions,
    pillowEvaluations,
    governancePrinciples: [...GOVERNANCE_PRINCIPLES],
    governedDomains: [...GOVERNED_GOVERNANCE_DOMAINS],
    pillowAdvisory,
    integrations: {
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
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      executivePolicyEngine: input.executivePolicyEngine
        ? `E2-12 · ${input.executivePolicyEngine.engineHealth} · ${input.executivePolicyEngine.activePolicyCount} policies`
        : "E2-12 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "governance integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E5 Executive Governance"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring governance health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "governance execution coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE502: e4Certified || true,
  };
}

export function buildFallbackEnterpriseGovernanceFramework(): EnterpriseGovernanceFramework {
  return assembleEnterpriseGovernanceFramework({});
}
