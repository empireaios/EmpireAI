/** PILLOW-EIE-001 — Executive Insight Engine types (E4-10). */

import type {
  INSIGHT_PIPELINE,
  INSIGHT_PRINCIPLES,
  GOVERNED_INSIGHT_DOMAINS,
  INSIGHT_CLASSIFICATIONS,
  INSIGHT_ANALYSIS_DOMAINS,
  PILLOW_INSIGHT_EVALUATIONS,
} from "./paths.js";

export type ExecutiveInsightEngineVersion = "E4-10";

export type InsightPipelinePhase = (typeof INSIGHT_PIPELINE)[number];
export type InsightPrinciple = (typeof INSIGHT_PRINCIPLES)[number];
export type GovernedInsightDomain = (typeof GOVERNED_INSIGHT_DOMAINS)[number];
export type InsightClassification = (typeof INSIGHT_CLASSIFICATIONS)[number];
export type InsightAnalysisDomain = (typeof INSIGHT_ANALYSIS_DOMAINS)[number];
export type PillowInsightEvaluation = (typeof PILLOW_INSIGHT_EVALUATIONS)[number];

export type InsightPipelineStep = {
  phase: InsightPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type InsightRecord = {
  insightId: string;
  title: string;
  category: InsightClassification;
  domain: GovernedInsightDomain;
  strategicObjective: string;
  sourceIntelligence: string;
  businessContext: string;
  keyFinding: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  priority: string;
  recommendedAction: string;
  confidence: number;
  evidence: string[];
  lastUpdated: string;
};

export type TopPriorityEntry = {
  priorityId: string;
  insightId: string;
  title: string;
  priority: string;
  urgency: string;
  recommendedAction: string;
  confidence: number;
  status: string;
};

export type StrategicFindingEntry = {
  findingId: string;
  insightId: string;
  title: string;
  keyFinding: string;
  strategicImpact: string;
  confidence: number;
  status: string;
};

export type CriticalOpportunityEntry = {
  opportunityId: string;
  insightId: string;
  title: string;
  opportunityValue: string;
  recommendedAction: string;
  confidence: number;
  status: string;
};

export type CriticalRiskEntry = {
  riskId: string;
  insightId: string;
  title: string;
  riskExposure: string;
  recommendedAction: string;
  confidence: number;
  status: string;
};

export type ConfidenceLevelEntry = {
  levelId: string;
  insightId: string;
  title: string;
  confidence: number;
  evidenceQuality: string;
  validationStatus: string;
};

export type InsightAnalysisMetric = {
  domain: InsightAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveInsightRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowInsightEvaluationMetric = {
  domain: PillowInsightEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveInsightEngine = {
  engineVersion: ExecutiveInsightEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  insightIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeInsightCount: number;
  criticalPriorityCount: number;
  strategicFindingCount: number;
  averageInsightConfidence: number;
  executiveInsights: InsightRecord[];
  topPriorities: TopPriorityEntry[];
  strategicFindings: StrategicFindingEntry[];
  criticalOpportunities: CriticalOpportunityEntry[];
  criticalRisks: CriticalRiskEntry[];
  recommendedActions: ExecutiveInsightRecommendation[];
  confidenceLevels: ConfidenceLevelEntry[];
  insightAnalysis: InsightAnalysisMetric[];
  insightPipeline: InsightPipelineStep[];
  pillowEvaluations: PillowInsightEvaluationMetric[];
  insightPrinciples: InsightPrinciple[];
  governedDomains: GovernedInsightDomain[];
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
  readyForE411: boolean;
};
