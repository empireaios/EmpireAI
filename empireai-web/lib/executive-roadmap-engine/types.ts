/** E1-04 — Executive Roadmap Engine frontend types (mirrors Pillow PILLOW-ERE-001). */

export type RoadmapMilestone = {
  milestoneId: string;
  title: string;
  targetDate: string;
  status: string;
  completionPercent: number;
};

export type RoadmapDependency = {
  dependencyId: string;
  domain: string;
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
  segment: string;
  risks: string[];
  eta: string;
  strategicAlignment: string;
};

export type RoadmapHierarchyStep = {
  layer: string;
  label: string;
  order: number;
  summary: string;
};

export type RoadmapLifecycleStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type RoadmapSegmentSummary = {
  segment: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveRoadmapEngine = {
  architectureVersion: "E1-04";
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
  roadmapPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE105: boolean;
};
