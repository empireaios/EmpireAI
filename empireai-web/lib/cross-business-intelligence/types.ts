/** E4-13 — Cross-Business Intelligence frontend types (mirrors Pillow PILLOW-XBI-001). */

export type BusinessRelationshipRecord = {
  relationshipId: string;
  sourceBusiness: string;
  targetBusiness: string;
  relationshipType: string;
  domain: string;
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

export type ExecutiveIntelligenceSummaryEntry = {
  summaryId: string;
  domain: string;
  label: string;
  value: string;
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

export type CrossBusinessAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type PillowCrossBusinessEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type CrossBusinessPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type CrossBusinessIntelligence = {
  engineVersion: string;
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
  crossBusinessPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE414: boolean;
};
