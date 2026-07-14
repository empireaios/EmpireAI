/** PILLOW-IPE-001 — Initiative Portfolio Engine types (E1-06). */

import type {
  PORTFOLIO_HIERARCHY,
  INITIATIVE_LIFECYCLE,
  PORTFOLIO_PRINCIPLES,
  GOVERNED_PORTFOLIO_DOMAINS,
  PORTFOLIO_SEGMENTS,
  PORTFOLIO_ANALYSIS_DOMAINS,
  PILLOW_PORTFOLIO_EVALUATIONS,
} from "./paths.js";

export type InitiativePortfolioEngineVersion = "E1-06";

export type PortfolioHierarchyLayer = (typeof PORTFOLIO_HIERARCHY)[number];
export type InitiativeLifecyclePhase = (typeof INITIATIVE_LIFECYCLE)[number];
export type PortfolioPrinciple = (typeof PORTFOLIO_PRINCIPLES)[number];
export type GovernedPortfolioDomain = (typeof GOVERNED_PORTFOLIO_DOMAINS)[number];
export type PortfolioSegment = (typeof PORTFOLIO_SEGMENTS)[number];
export type PortfolioAnalysisDomain = (typeof PORTFOLIO_ANALYSIS_DOMAINS)[number];
export type PillowPortfolioEvaluation = (typeof PILLOW_PORTFOLIO_EVALUATIONS)[number];

export type PortfolioHierarchyStep = {
  layer: PortfolioHierarchyLayer;
  label: string;
  order: number;
  summary: string;
};

export type InitiativeLifecycleStep = {
  phase: InitiativeLifecyclePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PortfolioInitiative = {
  initiativeId: string;
  title: string;
  description: string;
  purpose: string;
  businessCase: string;
  strategicObjective: string;
  portfolio: string;
  owner: string;
  priority: number;
  currentStatus: string;
  dependencies: string[];
  budget: string;
  resources: string;
  targetCompletion: string;
  successCriteria: string[];
  businessValue: string;
  evidence: string[];
  segment: PortfolioSegment;
  domain: GovernedPortfolioDomain;
  progressPercent: number;
  expectedRoi: string;
  risks: string[];
};

export type PortfolioSegmentSummary = {
  segment: PortfolioSegment;
  label: string;
  count: number;
  summary: string;
};

export type PortfolioAnalysisMetric = {
  domain: PortfolioAnalysisDomain;
  label: string;
  value: string;
  status: string;
};

export type PortfolioRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowPortfolioEvaluationMetric = {
  domain: PillowPortfolioEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type InitiativePortfolioEngine = {
  architectureVersion: InitiativePortfolioEngineVersion;
  computedAt: string;
  portfolioSummary: string;
  portfolioHealth: string;
  visionAlignment: string;
  strategicCoverage: string;
  healthScore: number;
  overallProgress: number;
  activeInitiativeCount: number;
  activeInitiatives: PortfolioInitiative[];
  portfolioHierarchy: PortfolioHierarchyStep[];
  initiativeLifecycle: InitiativeLifecycleStep[];
  portfolioSegments: PortfolioSegmentSummary[];
  portfolioAnalysis: PortfolioAnalysisMetric[];
  recommendedActions: PortfolioRecommendation[];
  pillowEvaluations: PillowPortfolioEvaluationMetric[];
  portfolioPrinciples: PortfolioPrinciple[];
  governedDomains: GovernedPortfolioDomain[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    priorityManagementEngine: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE107: boolean;
};
