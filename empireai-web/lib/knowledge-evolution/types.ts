/** P9-02 — Knowledge Evolution Architecture frontend types (mirrors Pillow PILLOW-KEV-001). */

export type KnowledgeItem = {
  knowledgeId: string;
  classification: string;
  source: string;
  title: string;
  evidence: string;
  owner: string;
  dateCreated: string;
  validationStatus: string;
  relatedMissions: string[];
};

export type KnowledgeCategorySummary = {
  classification: string;
  label: string;
  count: number;
  quality: string;
};

export type KnowledgeEvolutionRecommendation = {
  id: string;
  title: string;
  why: string;
  what: string;
  how: string;
  domain: string;
  confidencePercent: number;
};

export type KnowledgePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type KnowledgeEvolutionArchitecture = {
  architectureVersion: "P9-02";
  computedAt: string;
  grandKingSummary: string;
  knowledgeHealth: string;
  knowledgeGrowth: string;
  knowledgeQuality: string;
  healthScore: number;
  recentKnowledge: KnowledgeItem[];
  knowledgeCategories: KnowledgeCategorySummary[];
  knowledgeGaps: string[];
  recommendations: KnowledgeEvolutionRecommendation[];
  historicalGrowth: string[];
  evolutionPipeline: KnowledgePipelineStep[];
  governedDomains: string[];
  knowledgePrinciples: string[];
  knowledgeClassifications: string[];
  knowledgeSources: string[];
  knowledgeGovernance: string[];
  pillowAdvisory: string[];
  integrations: {
    repositoryEvolution: string;
    journeyStatus: string;
    builderStatus: string;
    supervisorStatus: string;
    guardianStatus: string;
    eccStatus: string;
    vieStatus: string;
    commercialIntelligence: string;
  };
};
