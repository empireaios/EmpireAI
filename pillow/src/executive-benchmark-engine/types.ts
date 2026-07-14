/** PILLOW-EBM-001 — Executive Benchmark Engine types (E4-12). */

import type {
  BENCHMARK_PIPELINE,
  BENCHMARK_PRINCIPLES,
  GOVERNED_BENCHMARK_DOMAINS,
  BENCHMARK_CLASSIFICATIONS,
  BENCHMARK_ANALYSIS_DOMAINS,
  PILLOW_BENCHMARK_EVALUATIONS,
} from "./paths.js";

export type ExecutiveBenchmarkEngineVersion = "E4-12";

export type BenchmarkPipelinePhase = (typeof BENCHMARK_PIPELINE)[number];
export type BenchmarkPrinciple = (typeof BENCHMARK_PRINCIPLES)[number];
export type GovernedBenchmarkDomain = (typeof GOVERNED_BENCHMARK_DOMAINS)[number];
export type BenchmarkClassification = (typeof BENCHMARK_CLASSIFICATIONS)[number];
export type BenchmarkAnalysisDomain = (typeof BENCHMARK_ANALYSIS_DOMAINS)[number];
export type PillowBenchmarkEvaluation = (typeof PILLOW_BENCHMARK_EVALUATIONS)[number];

export type BenchmarkPipelineStep = {
  phase: BenchmarkPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type BenchmarkRecord = {
  benchmarkId: string;
  title: string;
  category: BenchmarkClassification;
  domain: GovernedBenchmarkDomain;
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
  domain: BenchmarkAnalysisDomain;
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
  domain: PillowBenchmarkEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveBenchmarkEngine = {
  engineVersion: ExecutiveBenchmarkEngineVersion;
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
  benchmarkPrinciples: BenchmarkPrinciple[];
  governedDomains: GovernedBenchmarkDomain[];
  pillowAdvisory: string[];
  integrations: {
    marketIntelligenceEngine: string;
    competitorIntelligenceEngine: string;
    opportunityDiscoveryEngine: string;
    threatDetectionEngine: string;
    industryIntelligenceEngine: string;
    customerBehaviourIntelligence: string;
    innovationIntelligenceEngine: string;
    executiveKnowledgeGraph: string;
    executivePredictionEngine: string;
    executiveInsightEngine: string;
    enterprisePatternEngine: string;
    financialExecutiveCertification: string;
    executiveDecisionCertification: string;
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
  readyForE413: boolean;
};
