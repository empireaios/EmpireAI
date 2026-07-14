/** E4-08 — Executive Knowledge Graph frontend types (mirrors Pillow PILLOW-EKG-001). */

export type KnowledgeEntityRecord = {
  entityId: string;
  entityName: string;
  entityType: string;
  domain: string;
  relatedEntities: string[];
  relationshipType: string;
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
  domain: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type KnowledgeGraphPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type ExecutiveKnowledgeGraph = {
  engineVersion: string;
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
  knowledgeGraphPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE409: boolean;
};
