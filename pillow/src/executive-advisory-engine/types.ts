/** PILLOW-EAE-001 — Executive Advisory Engine types (E4-14). */

import type {
  ADVISORY_PIPELINE,
  ADVISORY_PRINCIPLES,
  GOVERNED_ADVISORY_DOMAINS,
  RECOMMENDATION_CLASSIFICATIONS,
  EXECUTIVE_ANALYSIS_DOMAINS,
  PILLOW_ADVISORY_EVALUATIONS,
} from "./paths.js";

export type ExecutiveAdvisoryEngineVersion = "E4-14";

export type AdvisoryPipelinePhase = (typeof ADVISORY_PIPELINE)[number];
export type AdvisoryPrinciple = (typeof ADVISORY_PRINCIPLES)[number];
export type GovernedAdvisoryDomain = (typeof GOVERNED_ADVISORY_DOMAINS)[number];
export type RecommendationClassification = (typeof RECOMMENDATION_CLASSIFICATIONS)[number];
export type ExecutiveAnalysisDomain = (typeof EXECUTIVE_ANALYSIS_DOMAINS)[number];
export type PillowAdvisoryEvaluation = (typeof PILLOW_ADVISORY_EVALUATIONS)[number];

export type AdvisoryPipelineStep = {
  phase: AdvisoryPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type AdvisoryRecommendationRecord = {
  recommendationId: string;
  title: string;
  category: RecommendationClassification;
  domain: GovernedAdvisoryDomain;
  strategicObjective: string;
  currentSituation: string;
  recommendedAction: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  priority: string;
  urgency: string;
  expectedRoi: string;
  expectedOutcome: string;
  confidence: number;
  evidence: string[];
  lastUpdated: string;
};

export type ImmediateActionEntry = {
  actionId: string;
  recommendationId: string;
  title: string;
  recommendedAction: string;
  urgency: string;
  expectedOutcome: string;
  confidence: number;
  status: string;
};

export type StrategicActionEntry = {
  actionId: string;
  recommendationId: string;
  title: string;
  strategicObjective: string;
  recommendedAction: string;
  strategicImpact: string;
  confidence: number;
  status: string;
};

export type GrowthRecommendationEntry = {
  recommendationEntryId: string;
  recommendationId: string;
  title: string;
  expectedRoi: string;
  businessImpact: string;
  confidence: number;
  status: string;
};

export type FinancialRecommendationEntry = {
  recommendationEntryId: string;
  recommendationId: string;
  title: string;
  financialImpact: string;
  expectedRoi: string;
  confidence: number;
  status: string;
};

export type RiskRecommendationEntry = {
  recommendationEntryId: string;
  recommendationId: string;
  title: string;
  currentSituation: string;
  recommendedAction: string;
  urgency: string;
  confidence: number;
  status: string;
};

export type ExpectedOutcomeEntry = {
  outcomeId: string;
  recommendationId: string;
  title: string;
  expectedOutcome: string;
  expectedRoi: string;
  confidence: number;
  status: string;
};

export type ExecutiveConfidenceEntry = {
  confidenceId: string;
  recommendationId: string;
  title: string;
  confidence: number;
  evidenceQuality: string;
  validationStatus: string;
};

export type ExecutiveAnalysisMetric = {
  domain: ExecutiveAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type PillowAdvisoryEvaluationMetric = {
  domain: PillowAdvisoryEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveAdvisoryEngine = {
  engineVersion: ExecutiveAdvisoryEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  advisoryIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeRecommendationCount: number;
  immediateActionCount: number;
  strategicActionCount: number;
  averageRecommendationConfidence: number;
  topExecutiveRecommendations: AdvisoryRecommendationRecord[];
  immediateActions: ImmediateActionEntry[];
  strategicActions: StrategicActionEntry[];
  growthRecommendations: GrowthRecommendationEntry[];
  financialRecommendations: FinancialRecommendationEntry[];
  riskRecommendations: RiskRecommendationEntry[];
  expectedOutcomes: ExpectedOutcomeEntry[];
  executiveConfidence: ExecutiveConfidenceEntry[];
  executiveAnalysis: ExecutiveAnalysisMetric[];
  advisoryPipeline: AdvisoryPipelineStep[];
  pillowEvaluations: PillowAdvisoryEvaluationMetric[];
  advisoryPrinciples: AdvisoryPrinciple[];
  governedDomains: GovernedAdvisoryDomain[];
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
    executiveBenchmarkEngine: string;
    crossBusinessIntelligence: string;
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
  readyForE415: boolean;
};
