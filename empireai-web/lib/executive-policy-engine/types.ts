/** E2-12 — Executive Policy Engine frontend types (mirrors Pillow PILLOW-EPE-001). */

export type EnterprisePolicy = {
  policyId: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  purpose: string;
  scope: string;
  owner: string;
  priority: number;
  businessImpact: string;
  strategicImpact: string;
  dependencies: string[];
  complianceRules: string[];
  exceptions: string[];
  effectiveDate: string;
  currentStatus: string;
  confidence: number;
  evidence: string[];
  complianceStatus: string;
};

export type PolicyComplianceEntry = {
  policyId: string;
  title: string;
  category: string;
  complianceStatus: string;
  complianceScore: number;
  lastValidated: string;
  violations: number;
};

export type PolicyExceptionEntry = {
  policyId: string;
  title: string;
  exception: string;
  reason: string;
  status: string;
  expiresAt: string;
};

export type PolicyValidationMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type PolicyPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutivePolicyRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowPolicyEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutivePolicyEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  policyHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activePolicyCount: number;
  compliantPolicyCount: number;
  exceptionCount: number;
  conflictCount: number;
  activePolicies: EnterprisePolicy[];
  policyCompliance: PolicyComplianceEntry[];
  policyExceptions: PolicyExceptionEntry[];
  policyValidation: PolicyValidationMetric[];
  policyPipeline: PolicyPipelineStep[];
  recommendedActions: ExecutivePolicyRecommendation[];
  pillowEvaluations: PillowPolicyEvaluationMetric[];
  policyPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE213: boolean;
};
