/** PILLOW-EGF-001 — Enterprise Governance Framework types (E5-01). */

import type {
  GOVERNANCE_PIPELINE,
  GOVERNANCE_PRINCIPLES,
  GOVERNED_GOVERNANCE_DOMAINS,
  GOVERNANCE_CLASSIFICATIONS,
  GOVERNANCE_ANALYSIS_DOMAINS,
  PILLOW_GOVERNANCE_EVALUATIONS,
} from "./paths.js";

export type EnterpriseGovernanceFrameworkVersion = "E5-01";

export type GovernancePipelinePhase = (typeof GOVERNANCE_PIPELINE)[number];
export type GovernancePrinciple = (typeof GOVERNANCE_PRINCIPLES)[number];
export type GovernedGovernanceDomain = (typeof GOVERNED_GOVERNANCE_DOMAINS)[number];
export type GovernanceClassification = (typeof GOVERNANCE_CLASSIFICATIONS)[number];
export type GovernanceAnalysisDomain = (typeof GOVERNANCE_ANALYSIS_DOMAINS)[number];
export type PillowGovernanceEvaluation = (typeof PILLOW_GOVERNANCE_EVALUATIONS)[number];

export type GovernancePipelineStep = {
  phase: GovernancePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type GovernancePolicyRecord = {
  governanceId: string;
  governanceName: string;
  category: GovernanceClassification;
  domain: GovernedGovernanceDomain;
  authorityLevel: string;
  scope: string;
  businessImpact: string;
  strategicImpact: string;
  owner: string;
  applicableSystems: string[];
  dependencies: string[];
  priority: string;
  confidence: number;
  evidence: string[];
  version: string;
  status: string;
};

export type GovernanceHierarchyEntry = {
  hierarchyId: string;
  level: number;
  title: string;
  authority: string;
  scope: string;
  reportsTo: string;
  status: string;
};

export type AuthorityStructureEntry = {
  authorityId: string;
  role: string;
  authorityLevel: string;
  scope: string;
  delegatedTo: string;
  escalationPath: string;
  status: string;
};

export type PolicyComplianceEntry = {
  complianceId: string;
  policyName: string;
  domain: GovernedGovernanceDomain;
  complianceRate: number;
  violations: number;
  lastReviewed: string;
  status: string;
};

export type GovernanceViolationEntry = {
  violationId: string;
  title: string;
  category: GovernanceClassification;
  severity: string;
  affectedSystem: string;
  remediation: string;
  status: string;
};

export type GovernanceDecisionEntry = {
  decisionId: string;
  title: string;
  governanceDomain: GovernedGovernanceDomain;
  decisionType: string;
  authority: string;
  outcome: string;
  confidence: number;
  status: string;
};

export type GovernanceAnalysisMetric = {
  domain: GovernanceAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EnterpriseGovernanceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowGovernanceEvaluationMetric = {
  domain: PillowGovernanceEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type EnterpriseGovernanceFramework = {
  frameworkVersion: EnterpriseGovernanceFrameworkVersion;
  computedAt: string;
  frameworkSummary: string;
  frameworkHealth: string;
  governanceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeGovernancePolicyCount: number;
  activeViolationCount: number;
  policyComplianceRate: number;
  averageGovernanceConfidence: number;
  governancePolicies: GovernancePolicyRecord[];
  governanceHierarchy: GovernanceHierarchyEntry[];
  authorityStructure: AuthorityStructureEntry[];
  policyCompliance: PolicyComplianceEntry[];
  governanceViolations: GovernanceViolationEntry[];
  governanceDecisions: GovernanceDecisionEntry[];
  governanceAnalysis: GovernanceAnalysisMetric[];
  governancePipeline: GovernancePipelineStep[];
  recommendedActions: EnterpriseGovernanceRecommendation[];
  pillowEvaluations: PillowGovernanceEvaluationMetric[];
  governancePrinciples: GovernancePrinciple[];
  governedDomains: GovernedGovernanceDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    corporateVisionEngine: string;
    executivePlanningProgramme: string;
    executivePolicyEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE502: boolean;
};
