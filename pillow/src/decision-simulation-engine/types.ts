/** PILLOW-DSE-001 — Decision Simulation Engine types (E2-03). */

import type {
  SIMULATION_PIPELINE,
  SIMULATION_PRINCIPLES,
  GOVERNED_SIMULATION_DOMAINS,
  SIMULATION_TYPES,
  COMPARATIVE_ANALYSIS_DIMENSIONS,
  SIMULATION_OUTPUT_DOMAINS,
  PILLOW_SIMULATION_EVALUATIONS,
} from "./paths.js";

export type DecisionSimulationEngineVersion = "E2-03";

export type SimulationPipelinePhase = (typeof SIMULATION_PIPELINE)[number];
export type SimulationPrinciple = (typeof SIMULATION_PRINCIPLES)[number];
export type GovernedSimulationDomain = (typeof GOVERNED_SIMULATION_DOMAINS)[number];
export type SimulationType = (typeof SIMULATION_TYPES)[number];
export type ComparativeAnalysisDimension = (typeof COMPARATIVE_ANALYSIS_DIMENSIONS)[number];
export type SimulationOutputDomain = (typeof SIMULATION_OUTPUT_DOMAINS)[number];
export type PillowSimulationEvaluation = (typeof PILLOW_SIMULATION_EVALUATIONS)[number];

export type SimulationPipelineStep = {
  phase: SimulationPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type DecisionSimulation = {
  simulationId: string;
  decisionId: string;
  title: string;
  purpose: string;
  scenario: SimulationType;
  domain: GovernedSimulationDomain;
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
  scenario: SimulationType;
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
  scenario: SimulationType;
  outcome: string;
  successProbability: number;
  businessImpact: string;
  financialImpact: string;
  confidence: number;
};

export type ComparativeAnalysisMetric = {
  dimension: ComparativeAnalysisDimension;
  label: string;
  bestScenario: string;
  score: number;
  summary: string;
};

export type SimulationOutputMetric = {
  domain: SimulationOutputDomain;
  label: string;
  value: string;
  status: string;
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
  domain: PillowSimulationEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type DecisionSimulationEngine = {
  engineVersion: DecisionSimulationEngineVersion;
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
  simulationPrinciples: SimulationPrinciple[];
  governedDomains: GovernedSimulationDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    executiveScenarioPlanner: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE204: boolean;
};
