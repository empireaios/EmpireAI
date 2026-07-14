/** E1-02 — Corporate Vision Engine frontend types (mirrors Pillow PILLOW-CVE-001). */

export type VisionStructureStep = {
  layer: string;
  label: string;
  order: number;
  summary: string;
};

export type VisionSyncStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending" | "required";
  owner: string;
};

export type VisionHealthMetric = {
  domain: string;
  label: string;
  status: string;
  score: number;
  summary: string;
};

export type VisionAccumulationItem = {
  id: string;
  source: string;
  label: string;
  title: string;
  classification: string;
  disposition: string;
  traceable: boolean;
  versioned: boolean;
  evidenceBacked: boolean;
  constitutionallyAligned: boolean;
  accumulatedAt: string;
};

export type VisionAddition = {
  id: string;
  title: string;
  source: string;
  classification: string;
  addedAt: string;
};

export type VisionReview = {
  id: string;
  title: string;
  status: string;
  reviewer: string;
  duePhase: string;
};

export type VisionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowVisionEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type CorporateVisionEngine = {
  architectureVersion: "E1-02";
  computedAt: string;
  visionSummary: string;
  currentVision: string;
  visionWhy: string;
  visionWhat: string;
  visionHow: string;
  strategicDirection: string;
  executivePurpose: string;
  visionHealth: string;
  visionAlignment: string;
  visionGrowth: string;
  healthScore: number;
  visionSyncRequired: boolean;
  visionSyncStatus: string;
  eccVisionGate: string;
  currentObjectives: string[];
  longTermGoals: string[];
  futureProgrammes: string[];
  visionStructure: VisionStructureStep[];
  visionSyncPipeline: VisionSyncStep[];
  visionHealthMetrics: VisionHealthMetric[];
  visionAccumulations: VisionAccumulationItem[];
  recentVisionAdditions: VisionAddition[];
  pendingVisionReviews: VisionReview[];
  visionRecommendations: VisionRecommendation[];
  pillowEvaluations: PillowVisionEvaluationMetric[];
  visionPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE103: boolean;
};
