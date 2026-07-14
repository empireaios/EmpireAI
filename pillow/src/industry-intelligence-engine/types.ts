/** PILLOW-IIE-001 — Industry Intelligence Engine types (E4-05). */

import type {
  INDUSTRY_INTELLIGENCE_PIPELINE,
  INDUSTRY_INTELLIGENCE_PRINCIPLES,
  GOVERNED_INDUSTRY_DOMAINS,
  INDUSTRY_CLASSIFICATIONS,
  INDUSTRY_ANALYSIS_DOMAINS,
  PILLOW_INDUSTRY_EVALUATIONS,
} from "./paths.js";

export type IndustryIntelligenceEngineVersion = "E4-05";

export type IndustryIntelligencePipelinePhase = (typeof INDUSTRY_INTELLIGENCE_PIPELINE)[number];
export type IndustryIntelligencePrinciple = (typeof INDUSTRY_INTELLIGENCE_PRINCIPLES)[number];
export type GovernedIndustryDomain = (typeof GOVERNED_INDUSTRY_DOMAINS)[number];
export type IndustryClassification = (typeof INDUSTRY_CLASSIFICATIONS)[number];
export type IndustryAnalysisDomain = (typeof INDUSTRY_ANALYSIS_DOMAINS)[number];
export type PillowIndustryEvaluation = (typeof PILLOW_INDUSTRY_EVALUATIONS)[number];

export type IndustryIntelligencePipelineStep = {
  phase: IndustryIntelligencePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type IndustryRecord = {
  industryId: string;
  industryName: string;
  category: IndustryClassification;
  domain: GovernedIndustryDomain;
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
  domain: IndustryAnalysisDomain;
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
  domain: PillowIndustryEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type IndustryIntelligenceEngine = {
  engineVersion: IndustryIntelligenceEngineVersion;
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
  industryPrinciples: IndustryIntelligencePrinciple[];
  governedDomains: GovernedIndustryDomain[];
  pillowAdvisory: string[];
  integrations: {
    marketIntelligenceEngine: string;
    competitorIntelligenceEngine: string;
    opportunityDiscoveryEngine: string;
    threatDetectionEngine: string;
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
  readyForE406: boolean;
};
