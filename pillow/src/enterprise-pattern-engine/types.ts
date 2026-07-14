/** PILLOW-EPA-001 — Enterprise Pattern Engine types (E4-11). */

import type {
  PATTERN_PIPELINE,
  PATTERN_PRINCIPLES,
  GOVERNED_PATTERN_DOMAINS,
  PATTERN_CLASSIFICATIONS,
  PATTERN_ANALYSIS_DOMAINS,
  PILLOW_PATTERN_EVALUATIONS,
} from "./paths.js";

export type EnterprisePatternEngineVersion = "E4-11";

export type PatternPipelinePhase = (typeof PATTERN_PIPELINE)[number];
export type PatternPrinciple = (typeof PATTERN_PRINCIPLES)[number];
export type GovernedPatternDomain = (typeof GOVERNED_PATTERN_DOMAINS)[number];
export type PatternClassification = (typeof PATTERN_CLASSIFICATIONS)[number];
export type PatternAnalysisDomain = (typeof PATTERN_ANALYSIS_DOMAINS)[number];
export type PillowPatternEvaluation = (typeof PILLOW_PATTERN_EVALUATIONS)[number];

export type PatternPipelineStep = {
  phase: PatternPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PatternRecord = {
  patternId: string;
  patternName: string;
  category: PatternClassification;
  domain: GovernedPatternDomain;
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
  domain: PatternAnalysisDomain;
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
  domain: PillowPatternEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type EnterprisePatternEngine = {
  engineVersion: EnterprisePatternEngineVersion;
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
  patternPrinciples: PatternPrinciple[];
  governedDomains: GovernedPatternDomain[];
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
  readyForE412: boolean;
};
