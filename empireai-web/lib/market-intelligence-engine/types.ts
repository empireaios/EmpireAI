/** E4-01 — Market Intelligence Engine frontend types (mirrors Pillow PILLOW-MIE-001). */

export type MarketRecord = {
  marketId: string;
  marketName: string;
  category: string;
  domain: string;
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
  domain: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type MarketIntelligencePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type MarketIntelligenceEngine = {
  engineVersion: string;
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
  marketPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE402: boolean;
};
