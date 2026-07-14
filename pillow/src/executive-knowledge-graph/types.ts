/** PILLOW-EKG-001 — Executive Knowledge Graph types (E4-08). */

import type {
  KNOWLEDGE_GRAPH_PIPELINE,
  KNOWLEDGE_GRAPH_PRINCIPLES,
  GOVERNED_KNOWLEDGE_DOMAINS,
  RELATIONSHIP_CLASSIFICATIONS,
  KNOWLEDGE_GRAPH_ANALYSIS_DOMAINS,
  PILLOW_KNOWLEDGE_GRAPH_EVALUATIONS,
} from "./paths.js";

export type ExecutiveKnowledgeGraphVersion = "E4-08";

export type KnowledgeGraphPipelinePhase = (typeof KNOWLEDGE_GRAPH_PIPELINE)[number];
export type KnowledgeGraphPrinciple = (typeof KNOWLEDGE_GRAPH_PRINCIPLES)[number];
export type GovernedKnowledgeDomain = (typeof GOVERNED_KNOWLEDGE_DOMAINS)[number];
export type RelationshipClassification = (typeof RELATIONSHIP_CLASSIFICATIONS)[number];
export type KnowledgeGraphAnalysisDomain = (typeof KNOWLEDGE_GRAPH_ANALYSIS_DOMAINS)[number];
export type PillowKnowledgeGraphEvaluation = (typeof PILLOW_KNOWLEDGE_GRAPH_EVALUATIONS)[number];

export type KnowledgeGraphPipelineStep = {
  phase: KnowledgeGraphPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type KnowledgeEntityRecord = {
  entityId: string;
  entityName: string;
  entityType: string;
  domain: GovernedKnowledgeDomain;
  relatedEntities: string[];
  relationshipType: RelationshipClassification;
  relationshipStrength: number;
  strategicImportance: string;
  businessImpact: string;
  financialImpact: string;
  confidence: number;
  evidence: string[];
  lastUpdated: string;
};

export type EntityRelationshipEntry = {
  relationshipId: string;
  sourceEntityId: string;
  sourceEntityName: string;
  targetEntityId: string;
  targetEntityName: string;
  relationshipType: string;
  relationshipStrength: number;
  status: string;
};

export type StrategicConnectionEntry = {
  connectionId: string;
  entityId: string;
  entityName: string;
  connectedEntity: string;
  strategicImportance: string;
  relationshipStrength: number;
  status: string;
};

export type BusinessConnectionEntry = {
  connectionId: string;
  entityId: string;
  entityName: string;
  connectedEntity: string;
  businessImpact: string;
  relationshipStrength: number;
  status: string;
};

export type OpportunityNetworkEntry = {
  networkId: string;
  entityId: string;
  entityName: string;
  connectedOpportunities: string;
  networkStrength: number;
  strategicValue: string;
  status: string;
};

export type RiskNetworkEntry = {
  networkId: string;
  entityId: string;
  entityName: string;
  connectedRisks: string;
  networkStrength: number;
  severity: string;
  status: string;
};

export type KnowledgeGapEntry = {
  gapId: string;
  domain: string;
  gapDescription: string;
  affectedEntities: string;
  priority: string;
  remediation: string;
  status: string;
};

export type KnowledgeGraphAnalysisMetric = {
  domain: KnowledgeGraphAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveKnowledgeGraphRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowKnowledgeGraphEvaluationMetric = {
  domain: PillowKnowledgeGraphEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveKnowledgeGraph = {
  engineVersion: ExecutiveKnowledgeGraphVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  knowledgeGraphHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  entityCount: number;
  relationshipCount: number;
  strategicConnectionCount: number;
  knowledgeGapCount: number;
  averageRelationshipStrength: number;
  knowledgeNetwork: KnowledgeEntityRecord[];
  entityRelationships: EntityRelationshipEntry[];
  strategicConnections: StrategicConnectionEntry[];
  businessConnections: BusinessConnectionEntry[];
  opportunityNetwork: OpportunityNetworkEntry[];
  riskNetwork: RiskNetworkEntry[];
  knowledgeGaps: KnowledgeGapEntry[];
  knowledgeGraphAnalysis: KnowledgeGraphAnalysisMetric[];
  knowledgeGraphPipeline: KnowledgeGraphPipelineStep[];
  recommendedActions: ExecutiveKnowledgeGraphRecommendation[];
  pillowEvaluations: PillowKnowledgeGraphEvaluationMetric[];
  knowledgeGraphPrinciples: KnowledgeGraphPrinciple[];
  governedDomains: GovernedKnowledgeDomain[];
  pillowAdvisory: string[];
  integrations: {
    marketIntelligenceEngine: string;
    competitorIntelligenceEngine: string;
    opportunityDiscoveryEngine: string;
    threatDetectionEngine: string;
    industryIntelligenceEngine: string;
    customerBehaviourIntelligence: string;
    innovationIntelligenceEngine: string;
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
  readyForE409: boolean;
};
