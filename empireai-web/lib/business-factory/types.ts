/** P8-01 — Business Factory frontend types (mirrors Pillow PILLOW-BF-001). */

export type FactoryBusinessRecord = {
  id: string;
  name: string;
  stage: string;
  pipelinePhase: string;
  progressPercent: number;
  launchStatus: string;
  health: string;
  revenue: string;
  growth: string;
  brand: string | null;
  store: string | null;
};

export type BusinessFactoryArchitecture = {
  architectureVersion: "P8-01";
  computedAt: string;
  grandKingSummary: string;
  currentFactoryStage: string;
  pipelineProgressPercent: number;
  activeBusinessCount: number;
  liveBusinessCount: number;
  businesses: FactoryBusinessRecord[];
  pipeline: Array<{
    phase: string;
    label: string;
    order: number;
    status: "complete" | "active" | "pending";
    description: string;
  }>;
  principles: string[];
  outputs: string[];
  launchStatus: string;
  businessHealth: string;
  revenueSummary: string;
  growthSummary: string;
  currentOpportunities: string[];
  currentRisks: string[];
  pillow: {
    opportunities: string[];
    risks: string[];
    improvements: string[];
    performance: string[];
    growth: string[];
    commercialRecommendations: string[];
  };
  coordination: Array<{
    system: string;
    status: string;
    summary: string;
    notes: string[];
  }>;
};
