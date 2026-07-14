/** PILLOW-SOE-001 — Strategic Objective Engine types (E1-03). */

import type {
  OBJECTIVE_HIERARCHY,
  OBJECTIVE_LIFECYCLE,
  OBJECTIVE_PRINCIPLES,
  GOVERNED_OBJECTIVE_DOMAINS,
  OBJECTIVE_CLASSIFICATIONS,
  MEASUREMENT_DOMAINS,
  PILLOW_OBJECTIVE_EVALUATIONS,
} from "./paths.js";

export type StrategicObjectiveEngineVersion = "E1-03";

export type ObjectiveHierarchyLayer = (typeof OBJECTIVE_HIERARCHY)[number];
export type ObjectiveLifecyclePhase = (typeof OBJECTIVE_LIFECYCLE)[number];
export type ObjectivePrinciple = (typeof OBJECTIVE_PRINCIPLES)[number];
export type GovernedObjectiveDomain = (typeof GOVERNED_OBJECTIVE_DOMAINS)[number];
export type ObjectiveClassification = (typeof OBJECTIVE_CLASSIFICATIONS)[number];
export type MeasurementDomain = (typeof MEASUREMENT_DOMAINS)[number];
export type PillowObjectiveEvaluation = (typeof PILLOW_OBJECTIVE_EVALUATIONS)[number];

export type ObjectiveHierarchyStep = {
  layer: ObjectiveHierarchyLayer;
  label: string;
  order: number;
  summary: string;
};

export type ObjectiveLifecycleStep = {
  phase: ObjectiveLifecyclePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

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
  classification: ObjectiveClassification;
  completionPercent: number;
  progressTrend: string;
  expectedCompletion: string;
  confidencePercent: number;
  risks: string[];
  businessImpact: string;
  executiveImpact: string;
  architectureImpact: string;
};

export type ObjectiveMeasurement = {
  domain: MeasurementDomain;
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
  domain: PillowObjectiveEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type StrategicObjectiveEngine = {
  architectureVersion: StrategicObjectiveEngineVersion;
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
  objectivePrinciples: ObjectivePrinciple[];
  governedDomains: GovernedObjectiveDomain[];
  objectiveClassifications: ObjectiveClassification[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    executiveArchitecture: string;
    objectiveEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE104: boolean;
};
