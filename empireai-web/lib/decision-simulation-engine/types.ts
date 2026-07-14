/** E2-03 — Decision Simulation Engine frontend types (mirrors Pillow PILLOW-DSE-001). */

export type DecisionSimulation = {
  simulationId: string;
  decisionId: string;
  title: string;
  purpose: string;
  scenario: string;
  domain: string;
  assumptions: string[];
  constraints: string[];
  dependencies: string[];
  expectedOutcome: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  riskProfile: string;
  probability: number;
  confidence: number;
  evidence: string[];
  successProbability: number;
  failureProbability: number;
  expectedRoi: string;
  status: string;
};

export type ScenarioComparisonEntry = {
  order: number;
  simulationId: string;
  title: string;
  scenario: string;
  successProbability: number;
  failureProbability: number;
  expectedRoi: string;
  riskProfile: string;
  strategicAlignment: string;
  recommended: boolean;
};

export type PredictedOutcome = {
  simulationId: string;
  title: string;
  scenario: string;
  outcome: string;
  successProbability: number;
  businessImpact: string;
  financialImpact: string;
  confidence: number;
};

export type ComparativeAnalysisMetric = {
  dimension: string;
  label: string;
  bestScenario: string;
  score: number;
  summary: string;
};

export type SimulationOutputMetric = {
  domain: string;
  label: string;
  value: string;
  status: string;
};

export type SimulationPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type DecisionSimulationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowSimulationEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type DecisionSimulationEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeSimulationCount: number;
  availableSimulationCount: number;
  availableSimulations: DecisionSimulation[];
  scenarioComparison: ScenarioComparisonEntry[];
  predictedOutcomes: PredictedOutcome[];
  comparativeAnalysis: ComparativeAnalysisMetric[];
  simulationOutputs: SimulationOutputMetric[];
  simulationPipeline: SimulationPipelineStep[];
  recommendedOption: string;
  recommendedConfidence: number;
  recommendedActions: DecisionSimulationRecommendation[];
  pillowEvaluations: PillowSimulationEvaluationMetric[];
  simulationPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE204: boolean;
};
