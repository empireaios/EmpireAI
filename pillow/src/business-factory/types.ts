/** PILLOW-BF-001 — Business Factory types (P8-01). */

import type {
  FACTORY_PIPELINE,
  FACTORY_STAGES,
  FACTORY_PRINCIPLES,
  FACTORY_OUTPUTS,
} from "./paths.js";

export type BusinessFactoryArchitectureVersion = "P8-01";

export type FactoryPipelinePhase = (typeof FACTORY_PIPELINE)[number];
export type FactoryBusinessStage = (typeof FACTORY_STAGES)[number];
export type FactoryPrinciple = (typeof FACTORY_PRINCIPLES)[number];
export type FactoryOutput = (typeof FACTORY_OUTPUTS)[number];

export type FactoryBusinessRecord = {
  id: string;
  name: string;
  stage: FactoryBusinessStage;
  pipelinePhase: FactoryPipelinePhase;
  progressPercent: number;
  launchStatus: string;
  health: string;
  revenue: string;
  growth: string;
  brand: string | null;
  store: string | null;
};

export type FactoryPipelineStageView = {
  phase: FactoryPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
  description: string;
};

export type FactoryPillowAnalysis = {
  opportunities: string[];
  risks: string[];
  improvements: string[];
  performance: string[];
  growth: string[];
  commercialRecommendations: string[];
};

export type FactorySystemCoordination = {
  system: string;
  status: string;
  summary: string;
  notes: string[];
};

export type BusinessFactoryArchitecture = {
  architectureVersion: BusinessFactoryArchitectureVersion;
  computedAt: string;
  grandKingSummary: string;
  currentFactoryStage: FactoryBusinessStage;
  pipelineProgressPercent: number;
  activeBusinessCount: number;
  liveBusinessCount: number;
  businesses: FactoryBusinessRecord[];
  pipeline: FactoryPipelineStageView[];
  principles: FactoryPrinciple[];
  outputs: FactoryOutput[];
  launchStatus: string;
  businessHealth: string;
  revenueSummary: string;
  growthSummary: string;
  currentOpportunities: string[];
  currentRisks: string[];
  pillow: FactoryPillowAnalysis;
  coordination: FactorySystemCoordination[];
};
