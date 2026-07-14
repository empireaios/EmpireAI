/** E1-05 — Priority Management Engine frontend types (mirrors Pillow PILLOW-PME-001). */

export type PriorityScoreBreakdown = {
  domain: string;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
};

export type ManagedPriority = {
  priorityId: string;
  title: string;
  purpose: string;
  currentScore: number;
  businessImpact: string;
  engineeringImpact: string;
  commercialImpact: string;
  financialImpact: string;
  strategicImpact: string;
  riskLevel: string;
  urgency: string;
  dependencies: string[];
  confidence: number;
  recommendedOrder: number;
  supportingEvidence: string[];
  level: string;
  domain: string;
  scoreBreakdown: PriorityScoreBreakdown[];
};

export type ExecutionQueueItem = {
  order: number;
  priorityId: string;
  title: string;
  level: string;
  score: number;
  owner: string;
  eta: string;
};

export type PriorityChange = {
  changeId: string;
  priorityId: string;
  title: string;
  previousOrder: number;
  newOrder: number;
  reason: string;
  trigger: string;
  timestamp: string;
};

export type PriorityPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PriorityRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowPriorityEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type PriorityManagementEngine = {
  architectureVersion: "E1-05";
  computedAt: string;
  prioritySummary: string;
  priorityHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activePriorityCount: number;
  topPriorityScore: number;
  currentPriorities: ManagedPriority[];
  executionQueue: ExecutionQueueItem[];
  priorityChanges: PriorityChange[];
  priorityPipeline: PriorityPipelineStep[];
  scoringDomains: string[];
  recommendedActions: PriorityRecommendation[];
  pillowEvaluations: PillowPriorityEvaluationMetric[];
  priorityPrinciples: string[];
  governedDomains: string[];
  reprioritizationTriggers: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE106: boolean;
};
