/** E4-12 — Executive Benchmark Engine frontend types (mirrors Pillow PILLOW-EBM-001). */

export type BenchmarkRecord = {
  benchmarkId: string;
  title: string;
  category: string;
  domain: string;
  benchmarkTarget: string;
  internalScore: number;
  externalScore: number;
  performanceGap: number;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  improvementOpportunity: string;
  priority: string;
  confidence: number;
  evidence: string[];
  lastUpdated: string;
};

export type IndustryRankingEntry = {
  rankingId: string;
  benchmarkId: string;
  title: string;
  industryPosition: string;
  internalScore: number;
  externalScore: number;
  rank: number;
  status: string;
};

export type PerformanceGapEntry = {
  gapId: string;
  benchmarkId: string;
  title: string;
  performanceGap: number;
  benchmarkTarget: string;
  improvementOpportunity: string;
  priority: string;
  status: string;
};

export type BenchmarkImprovementEntry = {
  improvementId: string;
  benchmarkId: string;
  title: string;
  improvementOpportunity: string;
  businessImpact: string;
  financialImpact: string;
  priority: string;
  confidence: number;
};

export type CompetitivePositionEntry = {
  positionId: string;
  benchmarkId: string;
  title: string;
  competitivePosition: string;
  internalScore: number;
  externalScore: number;
  performanceGap: number;
  status: string;
};

export type StrategicReadinessEntry = {
  readinessId: string;
  benchmarkId: string;
  title: string;
  strategicImpact: string;
  internalScore: number;
  readinessLevel: string;
  confidence: number;
};

export type TrendAnalysisEntry = {
  trendId: string;
  benchmarkId: string;
  title: string;
  trendDirection: string;
  internalScore: number;
  externalScore: number;
  gapTrend: string;
  status: string;
};

export type BenchmarkAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveBenchmarkRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowBenchmarkEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type BenchmarkPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutiveBenchmarkEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  benchmarkIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeBenchmarkCount: number;
  criticalGapCount: number;
  improvementOpportunityCount: number;
  averageBenchmarkConfidence: number;
  performanceBenchmarks: BenchmarkRecord[];
  industryRanking: IndustryRankingEntry[];
  performanceGaps: PerformanceGapEntry[];
  improvementOpportunities: BenchmarkImprovementEntry[];
  competitivePosition: CompetitivePositionEntry[];
  strategicReadiness: StrategicReadinessEntry[];
  trendAnalysis: TrendAnalysisEntry[];
  benchmarkAnalysis: BenchmarkAnalysisMetric[];
  benchmarkPipeline: BenchmarkPipelineStep[];
  recommendedActions: ExecutiveBenchmarkRecommendation[];
  pillowEvaluations: PillowBenchmarkEvaluationMetric[];
  benchmarkPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE413: boolean;
};
