/** PILLOW-CIE-001 — Competitor Intelligence Engine types (E4-02). */

import type {
  COMPETITOR_INTELLIGENCE_PIPELINE,
  COMPETITOR_PRINCIPLES,
  GOVERNED_COMPETITOR_DOMAINS,
  COMPETITOR_CLASSIFICATIONS,
  COMPETITOR_ANALYSIS_DOMAINS,
  PILLOW_COMPETITOR_EVALUATIONS,
} from "./paths.js";

export type CompetitorIntelligenceEngineVersion = "E4-02";

export type CompetitorIntelligencePipelinePhase = (typeof COMPETITOR_INTELLIGENCE_PIPELINE)[number];
export type CompetitorPrinciple = (typeof COMPETITOR_PRINCIPLES)[number];
export type GovernedCompetitorDomain = (typeof GOVERNED_COMPETITOR_DOMAINS)[number];
export type CompetitorClassification = (typeof COMPETITOR_CLASSIFICATIONS)[number];
export type CompetitorAnalysisDomain = (typeof COMPETITOR_ANALYSIS_DOMAINS)[number];
export type PillowCompetitorEvaluation = (typeof PILLOW_COMPETITOR_EVALUATIONS)[number];

export type CompetitorIntelligencePipelineStep = {
  phase: CompetitorIntelligencePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CompetitorRecord = {
  competitorId: string;
  competitorName: string;
  category: CompetitorClassification;
  domain: GovernedCompetitorDomain;
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
  domain: CompetitorAnalysisDomain;
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
  domain: PillowCompetitorEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type CompetitorIntelligenceEngine = {
  engineVersion: CompetitorIntelligenceEngineVersion;
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
  competitorPrinciples: CompetitorPrinciple[];
  governedDomains: GovernedCompetitorDomain[];
  pillowAdvisory: string[];
  integrations: {
    marketIntelligenceEngine: string;
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
  readyForE403: boolean;
};
