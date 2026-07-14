/** E2-01 — Executive Decision Architecture frontend types (mirrors Pillow PILLOW-EDA-001). */

export type ExecutiveDecision = {
  decisionId: string;
  title: string;
  purpose: string;
  decisionType: string;
  domain: string;
  context: string;
  evidence: string[];
  strategicObjective: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  riskAssessment: string;
  dependencies: string[];
  alternativesConsidered: string[];
  confidence: number;
  decisionOwner: string;
  decisionOutcome: string;
  status: string;
};

export type DecisionQueueItem = {
  order: number;
  decisionId: string;
  title: string;
  decisionType: string;
  status: string;
  confidence: number;
  owner: string;
};

export type DecisionGovernanceEntry = {
  record: string;
  label: string;
  value: string;
  status: string;
};

export type DecisionPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type DecisionArchitectureRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowDecisionEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveDecisionArchitecture = {
  architectureVersion: string;
  computedAt: string;
  architectureSummary: string;
  architectureHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeDecisionCount: number;
  pendingDecisionCount: number;
  currentDecisions: ExecutiveDecision[];
  decisionQueue: DecisionQueueItem[];
  decisionPipeline: DecisionPipelineStep[];
  decisionGovernance: DecisionGovernanceEntry[];
  recommendedActions: DecisionArchitectureRecommendation[];
  pillowEvaluations: PillowDecisionEvaluationMetric[];
  decisionPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE202: boolean;
};
