/** E5-01 — Enterprise Governance Framework frontend types (mirrors Pillow PILLOW-EGF-001). */

export type GovernancePolicyRecord = {
  governanceId: string;
  governanceName: string;
  category: string;
  domain: string;
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
  domain: string;
  complianceRate: number;
  violations: number;
  lastReviewed: string;
  status: string;
};

export type GovernanceViolationEntry = {
  violationId: string;
  title: string;
  category: string;
  severity: string;
  affectedSystem: string;
  remediation: string;
  status: string;
};

export type GovernanceDecisionEntry = {
  decisionId: string;
  title: string;
  governanceDomain: string;
  decisionType: string;
  authority: string;
  outcome: string;
  confidence: number;
  status: string;
};

export type GovernanceAnalysisMetric = {
  domain: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type GovernancePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type EnterpriseGovernanceFramework = {
  frameworkVersion: string;
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
  governancePrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE502: boolean;
};
