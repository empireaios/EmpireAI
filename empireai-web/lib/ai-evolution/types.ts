/** P9-04 — AI Evolution Architecture frontend types (mirrors Pillow PILLOW-AIE-001). */

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
  evaluation: string;
  label: string;
  score: string;
  status: string;
};

export type AiPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type AiEvolutionArchitecture = {
  architectureVersion: "P9-04";
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
  governedDomains: string[];
  aiEvolutionPrinciples: string[];
  aiCapabilities: string[];
  intelligenceQuality: IntelligenceQualityScore[];
  aiGovernance: string[];
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
