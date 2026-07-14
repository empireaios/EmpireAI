/** PILLOW-AIE-001 — Continuous AI Evolution Architecture types (P9-04). */

import type {
  AI_EVOLUTION_PIPELINE,
  AI_EVOLUTION_PRINCIPLES,
  GOVERNED_DOMAINS,
  AI_CAPABILITIES,
  INTELLIGENCE_QUALITY_EVALUATIONS,
  AI_GOVERNANCE_FIELDS,
} from "./paths.js";

export type AiEvolutionArchitectureVersion = "P9-04";

export type AiPipelinePhase = (typeof AI_EVOLUTION_PIPELINE)[number];
export type AiEvolutionPrinciple = (typeof AI_EVOLUTION_PRINCIPLES)[number];
export type AiGovernedDomain = (typeof GOVERNED_DOMAINS)[number];
export type AiCapability = (typeof AI_CAPABILITIES)[number];
export type IntelligenceQualityEvaluation = (typeof INTELLIGENCE_QUALITY_EVALUATIONS)[number];
export type AiGovernanceField = (typeof AI_GOVERNANCE_FIELDS)[number];

export type AiPipelineStep = {
  phase: AiPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type AiImprovement = {
  evolutionId: string;
  title: string;
  capability: string;
  priority: number;
  status: string;
  expectedImprovement: string;
};

export type AiEvolutionRecommendation = {
  id: string;
  title: string;
  why: string;
  what: string;
  how: string;
  domain: string;
  confidencePercent: number;
  evidence: string;
};

export type IntelligenceQualityScore = {
  evaluation: IntelligenceQualityEvaluation;
  label: string;
  score: string;
  status: string;
};

export type AiEvolutionArchitecture = {
  architectureVersion: AiEvolutionArchitectureVersion;
  computedAt: string;
  grandKingSummary: string;
  aiHealth: string;
  reasoningQuality: string;
  recommendationQuality: string;
  healthScore: number;
  currentImprovements: AiImprovement[];
  knowledgeGrowth: string;
  architectureAlignment: string;
  businessIntelligence: string;
  commercialIntelligence: string;
  evolutionTimeline: string[];
  recommendations: AiEvolutionRecommendation[];
  evolutionPipeline: AiPipelineStep[];
  governedDomains: AiGovernedDomain[];
  aiEvolutionPrinciples: AiEvolutionPrinciple[];
  aiCapabilities: AiCapability[];
  intelligenceQuality: IntelligenceQualityScore[];
  aiGovernance: AiGovernanceField[];
  pillowAdvisory: string[];
  integrations: {
    knowledgeEvolution: string;
    architectureEvolution: string;
    commercialIntelligence: string;
    explainability: string;
    journeyStatus: string;
    builderStatus: string;
    supervisorStatus: string;
    guardianStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
};
