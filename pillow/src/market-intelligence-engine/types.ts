/** PILLOW-MIE-001 — Market Intelligence Engine types (E4-01). */

import type {
  MARKET_INTELLIGENCE_PIPELINE,
  MARKET_PRINCIPLES,
  GOVERNED_MARKET_DOMAINS,
  MARKET_CLASSIFICATIONS,
  MARKET_ANALYSIS_DOMAINS,
  PILLOW_MARKET_EVALUATIONS,
} from "./paths.js";

export type MarketIntelligenceEngineVersion = "E4-01";

export type MarketIntelligencePipelinePhase = (typeof MARKET_INTELLIGENCE_PIPELINE)[number];
export type MarketPrinciple = (typeof MARKET_PRINCIPLES)[number];
export type GovernedMarketDomain = (typeof GOVERNED_MARKET_DOMAINS)[number];
export type MarketClassification = (typeof MARKET_CLASSIFICATIONS)[number];
export type MarketAnalysisDomain = (typeof MARKET_ANALYSIS_DOMAINS)[number];
export type PillowMarketEvaluation = (typeof PILLOW_MARKET_EVALUATIONS)[number];

export type MarketIntelligencePipelineStep = {
  phase: MarketIntelligencePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type MarketRecord = {
  marketId: string;
  marketName: string;
  category: MarketClassification;
  domain: GovernedMarketDomain;
  geographicScope: string;
  industry: string;
  currentStatus: string;
  growthRate: string;
  marketSize: string;
  competitionLevel: string;
  opportunityScore: number;
  riskScore: number;
  strategicRelevance: string;
  confidence: number;
  evidence: string[];
};

export type MarketTrendEntry = {
  trendId: string;
  marketId: string;
  marketName: string;
  trend: string;
  direction: string;
  momentum: string;
  impact: string;
  confidence: number;
  status: string;
};

export type EmergingOpportunityEntry = {
  opportunityId: string;
  marketId: string;
  marketName: string;
  title: string;
  category: string;
  opportunityScore: number;
  timeHorizon: string;
  strategicFit: string;
  evidence: string;
  status: string;
};

export type MarketRiskEntry = {
  riskId: string;
  marketId: string;
  marketName: string;
  title: string;
  riskScore: number;
  severity: string;
  category: string;
  mitigation: string;
  status: string;
};

export type IndustryMovementEntry = {
  movementId: string;
  industry: string;
  movement: string;
  direction: string;
  affectedMarkets: string;
  strategicImpact: string;
  confidence: number;
  status: string;
};

export type EconomicIndicatorEntry = {
  indicatorId: string;
  indicator: string;
  region: string;
  currentValue: string;
  trend: string;
  marketImpact: string;
  status: string;
};

export type StrategicAlertEntry = {
  alertId: string;
  marketId: string;
  title: string;
  severity: string;
  category: string;
  message: string;
  recommendedAction: string;
  status: string;
};

export type MarketAnalysisMetric = {
  domain: MarketAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type MarketIntelligenceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowMarketEvaluationMetric = {
  domain: PillowMarketEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type MarketIntelligenceEngine = {
  engineVersion: MarketIntelligenceEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  marketIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeMarketCount: number;
  monitoredMarketCount: number;
  opportunityCount: number;
  riskAlertCount: number;
  averageOpportunityScore: number;
  globalMarkets: MarketRecord[];
  marketTrends: MarketTrendEntry[];
  emergingOpportunities: EmergingOpportunityEntry[];
  marketRisks: MarketRiskEntry[];
  industryMovement: IndustryMovementEntry[];
  economicIndicators: EconomicIndicatorEntry[];
  strategicAlerts: StrategicAlertEntry[];
  marketAnalysis: MarketAnalysisMetric[];
  marketIntelligencePipeline: MarketIntelligencePipelineStep[];
  recommendedActions: MarketIntelligenceRecommendation[];
  pillowEvaluations: PillowMarketEvaluationMetric[];
  marketPrinciples: MarketPrinciple[];
  governedDomains: GovernedMarketDomain[];
  pillowAdvisory: string[];
  integrations: {
    financialExecutiveCertification: string;
    executiveDecisionCertification: string;
    executiveFinanceFramework: string;
    corporateVisionEngine: string;
    executiveRecommendationEngine: string;
    knowledgeEvolution: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE402: boolean;
};
