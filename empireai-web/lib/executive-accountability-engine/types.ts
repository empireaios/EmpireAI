/** E5-06 — Executive Accountability Engine frontend types (mirrors Pillow PILLOW-EACCT-001). */

export type AccountabilityRecord = {
  accountabilityId: string;
  executiveAction: string;
  category: string;
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
  domain: string;
  owner: string;
  responsibility: string;
  accountabilityScope: string;
  status: string;
};

export type AccountabilityAnalysisMetric = {
  domain: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveAccountabilityPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutiveAccountabilityEngine = {
  engineVersion: string;
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
  accountabilityPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE507: boolean;
};
