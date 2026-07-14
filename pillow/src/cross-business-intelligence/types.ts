/** PILLOW-XBI-001 — Cross-Business Intelligence types (E4-13). */

import type {
  CROSS_BUSINESS_PIPELINE,
  CROSS_BUSINESS_PRINCIPLES,
  GOVERNED_CROSS_BUSINESS_DOMAINS,
  RELATIONSHIP_CLASSIFICATIONS,
  CROSS_BUSINESS_ANALYSIS_DOMAINS,
  PILLOW_CROSS_BUSINESS_EVALUATIONS,
} from "./paths.js";

export type CrossBusinessIntelligenceVersion = "E4-13";

export type CrossBusinessPipelinePhase = (typeof CROSS_BUSINESS_PIPELINE)[number];
export type CrossBusinessPrinciple = (typeof CROSS_BUSINESS_PRINCIPLES)[number];
export type GovernedCrossBusinessDomain = (typeof GOVERNED_CROSS_BUSINESS_DOMAINS)[number];
export type RelationshipClassification = (typeof RELATIONSHIP_CLASSIFICATIONS)[number];
export type CrossBusinessAnalysisDomain = (typeof CROSS_BUSINESS_ANALYSIS_DOMAINS)[number];
export type PillowCrossBusinessEvaluation = (typeof PILLOW_CROSS_BUSINESS_EVALUATIONS)[number];

export type CrossBusinessPipelineStep = {
  phase: CrossBusinessPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type BusinessRelationshipRecord = {
  relationshipId: string;
  sourceBusiness: string;
  targetBusiness: string;
  relationshipType: RelationshipClassification;
  domain: GovernedCrossBusinessDomain;
  businessContext: string;
  knowledgeShared: string;
  businessImpact: string;
  financialImpact: string;
  strategicImpact: string;
  opportunityValue: string;
  riskLevel: string;
  confidence: number;
  evidence: string[];
  lastUpdated: string;
};

export type EnterpriseSynergyEntry = {
  synergyId: string;
  relationshipId: string;
  sourceBusiness: string;
  targetBusiness: string;
  synergyType: string;
  businessImpact: string;
  financialImpact: string;
  confidence: number;
  status: string;
};

export type KnowledgeSharingEntry = {
  sharingId: string;
  relationshipId: string;
  sourceBusiness: string;
  targetBusiness: string;
  knowledgeShared: string;
  reusePotential: string;
  confidence: number;
  status: string;
};

export type CrossBusinessOpportunityEntry = {
  opportunityId: string;
  relationshipId: string;
  title: string;
  sourceBusiness: string;
  targetBusiness: string;
  opportunityValue: string;
  confidence: number;
  status: string;
};

export type CrossBusinessRiskEntry = {
  riskId: string;
  relationshipId: string;
  title: string;
  sourceBusiness: string;
  targetBusiness: string;
  riskLevel: string;
  businessImpact: string;
  confidence: number;
  status: string;
};

export type EnterprisePatternEntry = {
  patternId: string;
  relationshipId: string;
  title: string;
  patternDescription: string;
  businessesInvolved: string;
  confidence: number;
  status: string;
};

export type CrossBusinessAnalysisMetric = {
  domain: CrossBusinessAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type CrossBusinessRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type ExecutiveIntelligenceSummaryEntry = {
  summaryId: string;
  domain: string;
  label: string;
  value: string;
  status: string;
  summary: string;
};

export type PillowCrossBusinessEvaluationMetric = {
  domain: PillowCrossBusinessEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type CrossBusinessIntelligence = {
  engineVersion: CrossBusinessIntelligenceVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  crossBusinessIntelligenceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeRelationshipCount: number;
  synergyCount: number;
  knowledgeSharingCount: number;
  crossBusinessOpportunityCount: number;
  averageRelationshipConfidence: number;
  businessRelationships: BusinessRelationshipRecord[];
  enterpriseSynergies: EnterpriseSynergyEntry[];
  knowledgeSharing: KnowledgeSharingEntry[];
  crossBusinessOpportunities: CrossBusinessOpportunityEntry[];
  crossBusinessRisks: CrossBusinessRiskEntry[];
  enterprisePatterns: EnterprisePatternEntry[];
  strategicRecommendations: CrossBusinessRecommendation[];
  executiveIntelligence: ExecutiveIntelligenceSummaryEntry[];
  crossBusinessAnalysis: CrossBusinessAnalysisMetric[];
  crossBusinessPipeline: CrossBusinessPipelineStep[];
  pillowEvaluations: PillowCrossBusinessEvaluationMetric[];
  crossBusinessPrinciples: CrossBusinessPrinciple[];
  governedDomains: GovernedCrossBusinessDomain[];
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
  readyForE414: boolean;
};
