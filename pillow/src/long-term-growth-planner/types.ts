/** PILLOW-LTGP-001 — Long-Term Growth Planner types (E1-11). */

import type {
  GROWTH_HIERARCHY,
  GROWTH_PLANNING_PIPELINE,
  PLANNING_HORIZONS,
  GROWTH_PRINCIPLES,
  GOVERNED_GROWTH_DOMAINS,
  GROWTH_ANALYSIS_DOMAINS,
  PILLOW_GROWTH_EVALUATIONS,
} from "./paths.js";

export type LongTermGrowthPlannerVersion = "E1-11";

export type GrowthHierarchyLayer = (typeof GROWTH_HIERARCHY)[number];
export type GrowthPlanningPhase = (typeof GROWTH_PLANNING_PIPELINE)[number];
export type PlanningHorizon = (typeof PLANNING_HORIZONS)[number];
export type GrowthPrinciple = (typeof GROWTH_PRINCIPLES)[number];
export type GovernedGrowthDomain = (typeof GOVERNED_GROWTH_DOMAINS)[number];
export type GrowthAnalysisDomain = (typeof GROWTH_ANALYSIS_DOMAINS)[number];
export type PillowGrowthEvaluation = (typeof PILLOW_GROWTH_EVALUATIONS)[number];

export type GrowthHierarchyStep = {
  layer: GrowthHierarchyLayer;
  label: string;
  order: number;
  summary: string;
};

export type GrowthPipelineStep = {
  phase: GrowthPlanningPhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PlanningHorizonView = {
  horizon: PlanningHorizon;
  label: string;
  timeframe: string;
  summary: string;
  visionSync: string;
  status: string;
};

export type GrowthInitiative = {
  growthId: string;
  title: string;
  purpose: string;
  strategicObjective: string;
  domain: GovernedGrowthDomain;
  expectedValue: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  commercialImpact: string;
  dependencies: string[];
  resources: string[];
  targetTimeline: string;
  successCriteria: string[];
  confidence: number;
  evidence: string[];
  horizon: PlanningHorizon;
  priority: string;
};

export type GrowthAnalysisMetric = {
  domain: GrowthAnalysisDomain;
  label: string;
  value: string;
  status: string;
};

export type GrowthRiskItem = {
  riskId: string;
  title: string;
  severity: string;
  horizon: string;
  mitigation: string;
};

export type GrowthOpportunityItem = {
  opportunityId: string;
  title: string;
  domain: GovernedGrowthDomain;
  expectedValue: string;
  horizon: string;
  confidence: number;
};

export type InvestmentPipelineItem = {
  investmentId: string;
  title: string;
  category: string;
  amount: string;
  timeline: string;
  expectedRoi: string;
  status: string;
};

export type ExpansionTimelineItem = {
  period: string;
  horizon: PlanningHorizon;
  milestone: string;
  programmes: string[];
  status: string;
};

export type GrowthPlannerRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowGrowthEvaluationMetric = {
  domain: PillowGrowthEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type LongTermGrowthPlanner = {
  architectureVersion: LongTermGrowthPlannerVersion;
  computedAt: string;
  plannerSummary: string;
  plannerHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  growthCapacity: string;
  growthReadiness: string;
  growthHierarchy: GrowthHierarchyStep[];
  growthPipeline: GrowthPipelineStep[];
  planningHorizons: PlanningHorizonView[];
  growthRoadmap: ExpansionTimelineItem[];
  growthObjectives: GrowthInitiative[];
  growthInitiatives: GrowthInitiative[];
  investmentPipeline: InvestmentPipelineItem[];
  growthAnalysis: GrowthAnalysisMetric[];
  strategicOpportunities: GrowthOpportunityItem[];
  growthRisks: GrowthRiskItem[];
  recommendedActions: GrowthPlannerRecommendation[];
  pillowEvaluations: PillowGrowthEvaluationMetric[];
  growthPrinciples: GrowthPrinciple[];
  governedDomains: GovernedGrowthDomain[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    executiveScenarioPlanner: string;
    priorityManagementEngine: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE112: boolean;
};
