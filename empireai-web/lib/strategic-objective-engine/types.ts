/** E1-03 — Strategic Objective Engine frontend types (mirrors Pillow PILLOW-SOE-001). */

export type StrategicObjective = {
  objectiveId: string;
  title: string;
  description: string;
  purpose: string;
  expectedOutcome: string;
  owner: string;
  priority: number;
  dependencies: string[];
  targetDate: string;
  currentStatus: string;
  successCriteria: string[];
  evidence: string[];
  relatedVision: string;
  relatedRoadmap: string;
  relatedInitiatives: string[];
  classification: string;
  completionPercent: number;
  progressTrend: string;
  expectedCompletion: string;
  confidencePercent: number;
  risks: string[];
  businessImpact: string;
  executiveImpact: string;
  architectureImpact: string;
};

export type ObjectiveHierarchyStep = {
  layer: string;
  label: string;
  order: number;
  summary: string;
};

export type ObjectiveLifecycleStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ObjectiveMeasurement = {
  domain: string;
  label: string;
  value: string;
  status: string;
};

export type StrategicRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowObjectiveEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type StrategicObjectiveEngine = {
  architectureVersion: "E1-03";
  computedAt: string;
  objectiveSummary: string;
  objectiveHealth: string;
  visionAlignment: string;
  strategicCoverage: string;
  healthScore: number;
  activeObjectiveCount: number;
  currentStrategicObjectives: StrategicObjective[];
  objectiveHierarchy: ObjectiveHierarchyStep[];
  objectiveLifecycle: ObjectiveLifecycleStep[];
  objectiveMeasurements: ObjectiveMeasurement[];
  recommendedActions: StrategicRecommendation[];
  pillowEvaluations: PillowObjectiveEvaluationMetric[];
  objectivePrinciples: string[];
  governedDomains: string[];
  objectiveClassifications: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE104: boolean;
};
