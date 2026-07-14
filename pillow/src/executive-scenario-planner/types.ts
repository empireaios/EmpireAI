/** PILLOW-ESP-001 — Executive Scenario Planner types (E1-10). */

import type {
  SCENARIO_PIPELINE,
  SCENARIO_PRINCIPLES,
  GOVERNED_SCENARIO_DOMAINS,
  SCENARIO_TYPES,
  TRADE_OFF_DOMAINS,
  SIMULATION_OUTPUT_DOMAINS,
  PILLOW_SCENARIO_EVALUATIONS,
} from "./paths.js";

export type ExecutiveScenarioPlannerVersion = "E1-10";

export type ScenarioPipelinePhase = (typeof SCENARIO_PIPELINE)[number];
export type ScenarioPrinciple = (typeof SCENARIO_PRINCIPLES)[number];
export type GovernedScenarioDomain = (typeof GOVERNED_SCENARIO_DOMAINS)[number];
export type ScenarioType = (typeof SCENARIO_TYPES)[number];
export type TradeOffDomain = (typeof TRADE_OFF_DOMAINS)[number];
export type SimulationOutputDomain = (typeof SIMULATION_OUTPUT_DOMAINS)[number];
export type PillowScenarioEvaluation = (typeof PILLOW_SCENARIO_EVALUATIONS)[number];

export type ScenarioPipelineStep = {
  phase: ScenarioPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveScenario = {
  scenarioId: string;
  title: string;
  purpose: string;
  scenarioType: ScenarioType;
  domain: GovernedScenarioDomain;
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
  domain: SimulationOutputDomain;
  label: string;
  value: string;
  status: string;
};

export type TradeOffMetric = {
  domain: TradeOffDomain;
  label: string;
  score: number;
  weight: number;
  summary: string;
};

export type ScenarioComparison = {
  scenarioId: string;
  title: string;
  scenarioType: ScenarioType;
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

export type PillowScenarioEvaluationMetric = {
  domain: PillowScenarioEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveScenarioPlanner = {
  architectureVersion: ExecutiveScenarioPlannerVersion;
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
  scenarioPrinciples: ScenarioPrinciple[];
  governedDomains: GovernedScenarioDomain[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    priorityManagementEngine: string;
    initiativePortfolioEngine: string;
    departmentPlanningEngine: string;
    executiveCalendarEngine: string;
    executiveDependencyEngine: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE111: boolean;
};
