/** PILLOW-KEV-001 — Continuous Knowledge Evolution Architecture types (P9-02). */

import type {
  KNOWLEDGE_EVOLUTION_PIPELINE,
  KNOWLEDGE_PRINCIPLES,
  GOVERNED_DOMAINS,
  KNOWLEDGE_CLASSIFICATIONS,
  KNOWLEDGE_SOURCES,
  KNOWLEDGE_GOVERNANCE_FIELDS,
} from "./paths.js";

export type KnowledgeEvolutionArchitectureVersion = "P9-02";

export type KnowledgePipelinePhase = (typeof KNOWLEDGE_EVOLUTION_PIPELINE)[number];
export type KnowledgePrinciple = (typeof KNOWLEDGE_PRINCIPLES)[number];
export type KnowledgeGovernedDomain = (typeof GOVERNED_DOMAINS)[number];
export type KnowledgeClassification = (typeof KNOWLEDGE_CLASSIFICATIONS)[number];
export type KnowledgeSource = (typeof KNOWLEDGE_SOURCES)[number];
export type KnowledgeGovernanceField = (typeof KNOWLEDGE_GOVERNANCE_FIELDS)[number];

export type KnowledgePipelineStep = {
  phase: KnowledgePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type KnowledgeItem = {
  knowledgeId: string;
  classification: KnowledgeClassification;
  source: KnowledgeSource;
  title: string;
  evidence: string;
  owner: string;
  dateCreated: string;
  validationStatus: string;
  relatedMissions: string[];
};

export type KnowledgeCategorySummary = {
  classification: KnowledgeClassification;
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

export type KnowledgeEvolutionArchitecture = {
  architectureVersion: KnowledgeEvolutionArchitectureVersion;
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
  governedDomains: KnowledgeGovernedDomain[];
  knowledgePrinciples: KnowledgePrinciple[];
  knowledgeClassifications: KnowledgeClassification[];
  knowledgeSources: KnowledgeSource[];
  knowledgeGovernance: KnowledgeGovernanceField[];
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
