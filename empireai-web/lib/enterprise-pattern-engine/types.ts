/** E4-11 — Enterprise Pattern Engine frontend types (mirrors Pillow PILLOW-EPA-001). */

export type PatternRecord = {
  patternId: string;
  patternName: string;
  category: string;
  domain: string;
  sourceDomains: string[];
  patternDescription: string;
  occurrenceFrequency: string;
  trendDirection: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  confidence: number;
  evidence: string[];
  recommendedActions: string;
  lastUpdated: string;
};

export type RecurringPatternEntry = {
  entryId: string;
  patternId: string;
  patternName: string;
  occurrenceFrequency: string;
  trendDirection: string;
  confidence: number;
  status: string;
};

export type EmergingPatternEntry = {
  entryId: string;
  patternId: string;
  patternName: string;
  patternDescription: string;
  trendDirection: string;
  confidence: number;
  status: string;
};

export type GrowthPatternEntry = {
  entryId: string;
  patternId: string;
  patternName: string;
  businessImpact: string;
  financialImpact: string;
  trendDirection: string;
  confidence: number;
};

export type RiskPatternEntry = {
  entryId: string;
  patternId: string;
  patternName: string;
  businessImpact: string;
  occurrenceFrequency: string;
  confidence: number;
  status: string;
};

export type PatternTrendEntry = {
  trendId: string;
  patternId: string;
  patternName: string;
  trendDirection: string;
  occurrenceFrequency: string;
  predictiveValue: string;
  status: string;
};

export type StrategicSignalEntry = {
  signalId: string;
  patternId: string;
  patternName: string;
  strategicImpact: string;
  trendDirection: string;
  confidence: number;
  status: string;
};

export type BusinessImpactEntry = {
  impactId: string;
  patternId: string;
  patternName: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  confidence: number;
};

export type PatternAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EnterprisePatternRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowPatternEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type PatternPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type EnterprisePatternEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  patternIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activePatternCount: number;
  recurringPatternCount: number;
  emergingPatternCount: number;
  riskPatternCount: number;
  averagePatternConfidence: number;
  recurringPatterns: RecurringPatternEntry[];
  emergingPatterns: EmergingPatternEntry[];
  growthPatterns: GrowthPatternEntry[];
  riskPatterns: RiskPatternEntry[];
  patternTrends: PatternTrendEntry[];
  strategicSignals: StrategicSignalEntry[];
  businessImpact: BusinessImpactEntry[];
  patternCatalogue: PatternRecord[];
  patternAnalysis: PatternAnalysisMetric[];
  patternPipeline: PatternPipelineStep[];
  recommendedActions: EnterprisePatternRecommendation[];
  pillowEvaluations: PillowPatternEvaluationMetric[];
  patternPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE412: boolean;
};
