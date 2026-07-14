/** PILLOW-CVE-001 — Corporate Vision Engine types (E1-02). */

import type {
  VISION_STRUCTURE,
  VISION_SYNC_PIPELINE,
  VISION_PRINCIPLES,
  VISION_GOVERNED_DOMAINS,
  VISION_ACCUMULATION_SOURCES,
  VISION_HEALTH_DOMAINS,
  PILLOW_VISION_EVALUATIONS,
} from "./paths.js";

export type CorporateVisionEngineVersion = "E1-02";

export type VisionStructureLayer = (typeof VISION_STRUCTURE)[number];
export type VisionSyncPhase = (typeof VISION_SYNC_PIPELINE)[number];
export type VisionPrinciple = (typeof VISION_PRINCIPLES)[number];
export type VisionGovernedDomain = (typeof VISION_GOVERNED_DOMAINS)[number];
export type VisionAccumulationSource = (typeof VISION_ACCUMULATION_SOURCES)[number];
export type VisionHealthDomain = (typeof VISION_HEALTH_DOMAINS)[number];
export type PillowVisionEvaluation = (typeof PILLOW_VISION_EVALUATIONS)[number];

export type VisionStructureStep = {
  layer: VisionStructureLayer;
  label: string;
  order: number;
  summary: string;
};

export type VisionSyncStep = {
  phase: VisionSyncPhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending" | "required";
  owner: string;
};

export type VisionHealthMetric = {
  domain: VisionHealthDomain;
  label: string;
  status: string;
  score: number;
  summary: string;
};

export type VisionAccumulationItem = {
  id: string;
  source: VisionAccumulationSource;
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
  status: "pending" | "approved" | "deferred" | "rejected";
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
  domain: PillowVisionEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type CorporateVisionEngine = {
  architectureVersion: CorporateVisionEngineVersion;
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
  visionPrinciples: VisionPrinciple[];
  governedDomains: VisionGovernedDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveArchitecture: string;
    visionIntegrityEngine: string;
    visionSynchronization: string;
    contextSynchronization: string;
    soulFile: string;
    visionFile: string;
    visionAccumulation: string;
    journeyStatus: string;
    eccStatus: string;
    empireEvolution: string;
  };
  readyForE103: boolean;
};
