/** PILLOW-EPE-001 — Executive Policy Engine types (E2-12). */

import type {
  POLICY_PIPELINE,
  POLICY_PRINCIPLES,
  GOVERNED_POLICY_DOMAINS,
  POLICY_CLASSIFICATIONS,
  POLICY_VALIDATION_DOMAINS,
  PILLOW_POLICY_EVALUATIONS,
} from "./paths.js";

export type ExecutivePolicyEngineVersion = "E2-12";

export type PolicyPipelinePhase = (typeof POLICY_PIPELINE)[number];
export type PolicyPrinciple = (typeof POLICY_PRINCIPLES)[number];
export type GovernedPolicyDomain = (typeof GOVERNED_POLICY_DOMAINS)[number];
export type PolicyClassification = (typeof POLICY_CLASSIFICATIONS)[number];
export type PolicyValidationDomain = (typeof POLICY_VALIDATION_DOMAINS)[number];
export type PillowPolicyEvaluation = (typeof PILLOW_POLICY_EVALUATIONS)[number];

export type PolicyPipelineStep = {
  phase: PolicyPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type EnterprisePolicy = {
  policyId: string;
  title: string;
  description: string;
  category: PolicyClassification;
  domain: GovernedPolicyDomain;
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
  category: PolicyClassification;
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
  domain: PolicyValidationDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
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
  domain: PillowPolicyEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutivePolicyEngine = {
  engineVersion: ExecutivePolicyEngineVersion;
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
  policyPrinciples: PolicyPrinciple[];
  governedDomains: GovernedPolicyDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    executiveConsensusEngine: string;
    tradeOffAnalysisEngine: string;
    executiveRecommendationEngine: string;
    executiveApprovalIntelligence: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE213: boolean;
};
