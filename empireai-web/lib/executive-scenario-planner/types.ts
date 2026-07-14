/** E1-10 — Executive Scenario Planner frontend types (mirrors Pillow PILLOW-ESP-001). */

export type ExecutiveScenario = {
  scenarioId: string;
  title: string;
  purpose: string;
  scenarioType: string;
  domain: string;
  assumptions: string[];
  dependencies: string[];
  constraints: string[];
  expectedBenefits: string[];
  expectedRisks: string[];
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  commercialImpact: string;
  confidence: number;
  supportingEvidence: string[];
  successProbability: number;
  failureProbability: number;
  recommended: boolean;
};

export type ScenarioOutcome = {
  domain: string;
  label: string;
  value: string;
  status: string;
};

export type TradeOffMetric = {
  domain: string;
  label: string;
  score: number;
  weight: number;
  summary: string;
};

export type ScenarioComparison = {
  scenarioId: string;
  title: string;
  scenarioType: string;
  successProbability: number;
  riskLevel: string;
  financialImpact: string;
  strategicAlignment: string;
};

export type ScenarioPlannerRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type ScenarioPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PillowScenarioEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveScenarioPlanner = {
  architectureVersion: string;
  computedAt: string;
  plannerSummary: string;
  plannerHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  availableScenarioCount: number;
  recommendedScenario: ExecutiveScenario | null;
  availableScenarios: ExecutiveScenario[];
  scenarioComparison: ScenarioComparison[];
  simulationOutputs: ScenarioOutcome[];
  tradeOffAnalysis: TradeOffMetric[];
  alternativeOptions: ExecutiveScenario[];
  scenarioPipeline: ScenarioPipelineStep[];
  recommendedActions: ScenarioPlannerRecommendation[];
  pillowEvaluations: PillowScenarioEvaluationMetric[];
  scenarioPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE111: boolean;
};
