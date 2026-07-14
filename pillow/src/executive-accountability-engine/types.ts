/** PILLOW-EACCT-001 — Executive Accountability Engine types (E5-06). */

import type {
  EXECUTIVE_ACCOUNTABILITY_PIPELINE,
  ACCOUNTABILITY_PRINCIPLES,
  GOVERNED_ACCOUNTABILITY_DOMAINS,
  ACCOUNTABILITY_CLASSIFICATIONS,
  ACCOUNTABILITY_ANALYSIS_DOMAINS,
  PILLOW_ACCOUNTABILITY_EVALUATIONS,
} from "./paths.js";

export type ExecutiveAccountabilityEngineVersion = "E5-06";

export type ExecutiveAccountabilityPipelinePhase = (typeof EXECUTIVE_ACCOUNTABILITY_PIPELINE)[number];
export type AccountabilityPrinciple = (typeof ACCOUNTABILITY_PRINCIPLES)[number];
export type GovernedAccountabilityDomain = (typeof GOVERNED_ACCOUNTABILITY_DOMAINS)[number];
export type AccountabilityClassification = (typeof ACCOUNTABILITY_CLASSIFICATIONS)[number];
export type AccountabilityAnalysisDomain = (typeof ACCOUNTABILITY_ANALYSIS_DOMAINS)[number];
export type PillowAccountabilityEvaluation = (typeof PILLOW_ACCOUNTABILITY_EVALUATIONS)[number];

export type ExecutiveAccountabilityPipelineStep = {
  phase: ExecutiveAccountabilityPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type AccountabilityRecord = {
  accountabilityId: string;
  executiveAction: string;
  category: GovernedAccountabilityDomain;
  owner: string;
  delegatedBy: string;
  authorityLevel: string;
  responsibilities: string;
  businessImpact: string;
  strategicImpact: string;
  currentStatus: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
};

export type DecisionTraceabilityEntry = {
  traceId: string;
  accountabilityId: string;
  executiveAction: string;
  decisionMaker: string;
  decisionReason: string;
  authorityUsed: string;
  outcomeOwner: string;
  traceStatus: string;
  timestamp: string;
};

export type AuthorityChainEntry = {
  chainId: string;
  accountabilityId: string;
  level: number;
  role: string;
  authority: string;
  delegatedFrom: string;
  validationStatus: string;
};

export type ResponsibilityMatrixEntry = {
  matrixId: string;
  accountabilityId: string;
  domain: GovernedAccountabilityDomain;
  owner: string;
  responsibility: string;
  accountabilityScope: string;
  status: string;
};

export type AccountabilityAnalysisMetric = {
  domain: AccountabilityAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveAccountabilityRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowAccountabilityEvaluationMetric = {
  domain: PillowAccountabilityEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveAccountabilityEngine = {
  engineVersion: ExecutiveAccountabilityEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  governanceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  ownershipCoverageScore: number;
  accountabilityRecordCount: number;
  ownerlessActionCount: number;
  fullyAccountableCount: number;
  executiveOwnership: AccountabilityRecord[];
  decisionTraceability: DecisionTraceabilityEntry[];
  authorityChain: AuthorityChainEntry[];
  responsibilityMatrix: ResponsibilityMatrixEntry[];
  accountabilityAnalysis: AccountabilityAnalysisMetric[];
  executiveAccountabilityPipeline: ExecutiveAccountabilityPipelineStep[];
  recommendedActions: ExecutiveAccountabilityRecommendation[];
  pillowEvaluations: PillowAccountabilityEvaluationMetric[];
  accountabilityPrinciples: AccountabilityPrinciple[];
  governedDomains: GovernedAccountabilityDomain[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveConstitutionalMonitor: string;
    enterpriseAuditEngine: string;
    executiveComplianceEngine: string;
    executiveEthicsEngine: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    executivePolicyEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE507: boolean;
};
