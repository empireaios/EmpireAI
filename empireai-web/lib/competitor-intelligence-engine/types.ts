/** E4-02 — Competitor Intelligence Engine frontend types (mirrors Pillow PILLOW-CIE-001). */

export type CompetitorRecord = {
  competitorId: string;
  competitorName: string;
  category: string;
  domain: string;
  industry: string;
  market: string;
  products: string[];
  services: string[];
  marketPosition: string;
  strengths: string[];
  weaknesses: string[];
  competitiveAdvantage: string;
  threatLevel: number;
  opportunityLevel: number;
  strategicRelevance: string;
  confidence: number;
  evidence: string[];
};

export type MarketLeaderEntry = {
  leaderId: string;
  competitorId: string;
  competitorName: string;
  industry: string;
  marketShare: string;
  growthRate: string;
  competitivePosition: string;
  technologyLeadership: string;
  status: string;
};

export type CompetitiveThreatEntry = {
  threatId: string;
  competitorId: string;
  competitorName: string;
  title: string;
  threatLevel: number;
  severity: string;
  category: string;
  description: string;
  mitigation: string;
  status: string;
};

export type CompetitiveOpportunityEntry = {
  opportunityId: string;
  competitorId: string;
  competitorName: string;
  title: string;
  opportunityLevel: number;
  category: string;
  exploitStrategy: string;
  evidence: string;
  status: string;
};

export type StrengthComparisonEntry = {
  comparisonId: string;
  competitorId: string;
  competitorName: string;
  strength: string;
  empirePosition: string;
  competitorPosition: string;
  advantage: string;
  status: string;
};

export type WeaknessComparisonEntry = {
  comparisonId: string;
  competitorId: string;
  competitorName: string;
  weakness: string;
  empireExploit: string;
  competitorVulnerability: string;
  opportunity: string;
  status: string;
};

export type StrategicPositionEntry = {
  positionId: string;
  dimension: string;
  empireScore: number;
  topCompetitor: string;
  competitorScore: number;
  gap: number;
  trend: string;
  status: string;
};

export type CompetitorAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type CompetitorIntelligenceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowCompetitorEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type CompetitorIntelligencePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type CompetitorIntelligenceEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  competitorIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  trackedCompetitorCount: number;
  directCompetitorCount: number;
  threatCount: number;
  opportunityCount: number;
  averageThreatLevel: number;
  competitorLandscape: CompetitorRecord[];
  marketLeaders: MarketLeaderEntry[];
  competitiveThreats: CompetitiveThreatEntry[];
  competitiveOpportunities: CompetitiveOpportunityEntry[];
  strengthComparisons: StrengthComparisonEntry[];
  weaknessComparisons: WeaknessComparisonEntry[];
  strategicPosition: StrategicPositionEntry[];
  competitorAnalysis: CompetitorAnalysisMetric[];
  competitorIntelligencePipeline: CompetitorIntelligencePipelineStep[];
  recommendedActions: CompetitorIntelligenceRecommendation[];
  pillowEvaluations: PillowCompetitorEvaluationMetric[];
  competitorPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE403: boolean;
};
