/** E4-05 — Industry Intelligence Engine frontend types (mirrors Pillow PILLOW-IIE-001). */

export type IndustryRecord = {
  industryId: string;
  industryName: string;
  category: string;
  domain: string;
  sector: string;
  marketSize: string;
  growthRate: string;
  maturity: string;
  innovationRate: string;
  competitiveIntensity: string;
  regulatoryEnvironment: string;
  opportunityScore: number;
  riskScore: number;
  strategicRelevance: string;
  confidence: number;
  evidence: string[];
};

export type IndustryTrendEntry = {
  trendId: string;
  trend: string;
  direction: string;
  affectedIndustries: string;
  evolutionSignal: string;
  confidence: number;
  status: string;
};

export type GrowthIndustryEntry = {
  growthId: string;
  industryId: string;
  industryName: string;
  growthRate: string;
  marketSize: string;
  opportunityScore: number;
  strategicRelevance: string;
  status: string;
};

export type EmergingIndustryEntry = {
  emergingId: string;
  industryId: string;
  industryName: string;
  category: string;
  innovationRate: string;
  marketSize: string;
  timeHorizon: string;
  status: string;
};

export type IndustryRiskEntry = {
  riskId: string;
  industryId: string;
  industryName: string;
  riskScore: number;
  severity: string;
  riskType: string;
  mitigation: string;
  status: string;
};

export type IndustryOpportunityEntry = {
  opportunityId: string;
  industryId: string;
  industryName: string;
  opportunityScore: number;
  strategicValue: string;
  marketSize: string;
  status: string;
};

export type InnovationActivityEntry = {
  innovationId: string;
  industryId: string;
  industryName: string;
  innovationRate: string;
  keyTechnologies: string;
  disruptionPotential: string;
  status: string;
};

export type IndustryAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type IndustryIntelligenceRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowIndustryEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type IndustryIntelligencePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type IndustryIntelligenceEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  industryIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  monitoredIndustryCount: number;
  growthIndustryCount: number;
  emergingIndustryCount: number;
  averageOpportunityScore: number;
  industryLandscape: IndustryRecord[];
  industryTrends: IndustryTrendEntry[];
  growthIndustries: GrowthIndustryEntry[];
  emergingIndustries: EmergingIndustryEntry[];
  industryRisks: IndustryRiskEntry[];
  industryOpportunities: IndustryOpportunityEntry[];
  innovationActivity: InnovationActivityEntry[];
  industryAnalysis: IndustryAnalysisMetric[];
  industryIntelligencePipeline: IndustryIntelligencePipelineStep[];
  recommendedActions: IndustryIntelligenceRecommendation[];
  pillowEvaluations: PillowIndustryEvaluationMetric[];
  industryPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE406: boolean;
};
