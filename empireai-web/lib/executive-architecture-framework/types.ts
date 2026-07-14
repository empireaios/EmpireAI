/** E1-01 — Executive Architecture Framework frontend types (mirrors Pillow PILLOW-EAF-001). */

export type ExecutivePlanningStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveLayerStep = {
  layer: string;
  label: string;
  order: number;
  owner: string;
  summary: string;
};

export type ExecutiveObjective = {
  id: string;
  title: string;
  status: string;
  alignment: string;
};

export type ExecutivePriority = {
  id: string;
  title: string;
  rank: number;
  status: string;
};

export type ExecutiveInitiative = {
  id: string;
  title: string;
  phase: string;
  status: string;
};

export type ExecutiveRisk = {
  id: string;
  title: string;
  severity: string;
  mitigation: string;
};

export type ExecutiveOpportunity = {
  id: string;
  title: string;
  impact: string;
  confidencePercent: number;
};

export type ExecutiveArchitectureRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type ExecutiveEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveOwnershipEntry = {
  role: string;
  label: string;
  responsibilities: string[];
};

export type ExecutiveArchitectureFramework = {
  architectureVersion: "E1-01";
  computedAt: string;
  executiveSummary: string;
  executiveHealth: string;
  strategicDirection: string;
  planningStatus: string;
  healthScore: number;
  visionAlignment: string;
  constitutionStatus: string;
  currentObjectives: ExecutiveObjective[];
  currentPriorities: ExecutivePriority[];
  currentInitiatives: ExecutiveInitiative[];
  executiveRisks: ExecutiveRisk[];
  executiveOpportunities: ExecutiveOpportunity[];
  executiveRecommendations: ExecutiveArchitectureRecommendation[];
  planningPipeline: ExecutivePlanningStep[];
  executiveLayers: ExecutiveLayerStep[];
  executivePrinciples: string[];
  governedDomains: string[];
  executiveResponsibilities: string[];
  executiveOwnership: ExecutiveOwnershipEntry[];
  pillowEvaluations: ExecutiveEvaluationMetric[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  constitutionalFoundationComplete: boolean;
  readyForE102: boolean;
};
