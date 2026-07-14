/** PILLOW-ERE-001 — Executive Roadmap Engine types (E1-04). */

import type {
  ROADMAP_HIERARCHY,
  ROADMAP_LIFECYCLE,
  ROADMAP_PRINCIPLES,
  GOVERNED_ROADMAP_DOMAINS,
  ROADMAP_SEGMENTS,
  DEPENDENCY_DOMAINS,
  PILLOW_ROADMAP_EVALUATIONS,
} from "./paths.js";

export type ExecutiveRoadmapEngineVersion = "E1-04";

export type RoadmapHierarchyLayer = (typeof ROADMAP_HIERARCHY)[number];
export type RoadmapLifecyclePhase = (typeof ROADMAP_LIFECYCLE)[number];
export type RoadmapPrinciple = (typeof ROADMAP_PRINCIPLES)[number];
export type GovernedRoadmapDomain = (typeof GOVERNED_ROADMAP_DOMAINS)[number];
export type RoadmapSegment = (typeof ROADMAP_SEGMENTS)[number];
export type DependencyDomain = (typeof DEPENDENCY_DOMAINS)[number];
export type PillowRoadmapEvaluation = (typeof PILLOW_ROADMAP_EVALUATIONS)[number];

export type RoadmapHierarchyStep = {
  layer: RoadmapHierarchyLayer;
  label: string;
  order: number;
  summary: string;
};

export type RoadmapLifecycleStep = {
  phase: RoadmapLifecyclePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type RoadmapMilestone = {
  milestoneId: string;
  title: string;
  targetDate: string;
  status: string;
  completionPercent: number;
};

export type RoadmapDependency = {
  dependencyId: string;
  domain: DependencyDomain;
  label: string;
  source: string;
  target: string;
  status: string;
  critical: boolean;
};

export type CriticalPathItem = {
  order: number;
  roadmapId: string;
  title: string;
  status: string;
  eta: string;
};

export type ExecutiveProgramme = {
  roadmapId: string;
  title: string;
  description: string;
  purpose: string;
  owner: string;
  priority: number;
  currentStatus: string;
  dependencies: string[];
  estimatedDuration: string;
  targetCompletion: string;
  milestones: RoadmapMilestone[];
  successCriteria: string[];
  relatedVision: string;
  relatedObjectives: string[];
  relatedProgrammes: string[];
  currentPhase: string;
  overallProgress: number;
  segment: RoadmapSegment;
  risks: string[];
  eta: string;
  strategicAlignment: string;
};

export type RoadmapSegmentSummary = {
  segment: RoadmapSegment;
  label: string;
  count: number;
  summary: string;
};

export type RoadmapRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowRoadmapEvaluationMetric = {
  domain: PillowRoadmapEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveRoadmapEngine = {
  architectureVersion: ExecutiveRoadmapEngineVersion;
  computedAt: string;
  roadmapSummary: string;
  roadmapHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  overallProgress: number;
  activeProgrammeCount: number;
  currentProgrammes: ExecutiveProgramme[];
  currentPhases: string[];
  roadmapHierarchy: RoadmapHierarchyStep[];
  roadmapLifecycle: RoadmapLifecycleStep[];
  roadmapSegments: RoadmapSegmentSummary[];
  dependencies: RoadmapDependency[];
  criticalPath: CriticalPathItem[];
  recommendedActions: RoadmapRecommendation[];
  pillowEvaluations: PillowRoadmapEvaluationMetric[];
  roadmapPrinciples: RoadmapPrinciple[];
  governedDomains: GovernedRoadmapDomain[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE105: boolean;
};
