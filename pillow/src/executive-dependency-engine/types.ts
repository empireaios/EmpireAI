/** PILLOW-EDE-001 — Executive Dependency Engine types (E1-09). */

import type {
  DEPENDENCY_HIERARCHY,
  DEPENDENCY_LIFECYCLE,
  DEPENDENCY_PRINCIPLES,
  GOVERNED_DEPENDENCY_DOMAINS,
  DEPENDENCY_CLASSIFICATIONS,
  DEPENDENCY_ANALYSIS_DOMAINS,
  BOTTLENECK_TYPES,
  PILLOW_DEPENDENCY_EVALUATIONS,
} from "./paths.js";

export type ExecutiveDependencyEngineVersion = "E1-09";

export type DependencyHierarchyLayer = (typeof DEPENDENCY_HIERARCHY)[number];
export type DependencyLifecyclePhase = (typeof DEPENDENCY_LIFECYCLE)[number];
export type DependencyPrinciple = (typeof DEPENDENCY_PRINCIPLES)[number];
export type GovernedDependencyDomain = (typeof GOVERNED_DEPENDENCY_DOMAINS)[number];
export type DependencyClassification = (typeof DEPENDENCY_CLASSIFICATIONS)[number];
export type DependencyAnalysisDomain = (typeof DEPENDENCY_ANALYSIS_DOMAINS)[number];
export type BottleneckType = (typeof BOTTLENECK_TYPES)[number];
export type PillowDependencyEvaluation = (typeof PILLOW_DEPENDENCY_EVALUATIONS)[number];

export type DependencyHierarchyStep = {
  layer: DependencyHierarchyLayer;
  label: string;
  order: number;
  summary: string;
};

export type DependencyLifecycleStep = {
  phase: DependencyLifecyclePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveDependency = {
  dependencyId: string;
  title: string;
  description: string;
  dependencyType: GovernedDependencyDomain;
  parent: string;
  child: string;
  owner: string;
  criticality: string;
  riskLevel: string;
  currentStatus: string;
  blockingStatus: string;
  expectedResolution: string;
  evidence: string[];
  relatedProgrammes: string[];
  relatedObjectives: string[];
  classification: DependencyClassification;
  critical: boolean;
};

export type DependencyCriticalPathItem = {
  order: number;
  dependencyId: string;
  title: string;
  parent: string;
  child: string;
  status: string;
  blockingStatus: string;
};

export type BottleneckItem = {
  bottleneckId: string;
  type: BottleneckType;
  label: string;
  title: string;
  severity: string;
  impact: string;
  owner: string;
  resolution: string;
};

export type DependencyGraphNode = {
  nodeId: string;
  label: string;
  type: string;
  status: string;
  connections: number;
};

export type DependencyAnalysisMetric = {
  domain: DependencyAnalysisDomain;
  label: string;
  value: string;
  status: string;
};

export type DependencyRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowDependencyEvaluationMetric = {
  domain: PillowDependencyEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveDependencyEngine = {
  architectureVersion: ExecutiveDependencyEngineVersion;
  computedAt: string;
  dependencySummary: string;
  dependencyHealth: string;
  executionReadiness: string;
  visionAlignment: string;
  healthScore: number;
  criticalDependencyCount: number;
  blockingDependencyCount: number;
  criticalPath: DependencyCriticalPathItem[];
  currentBottlenecks: BottleneckItem[];
  blockingDependencies: ExecutiveDependency[];
  crossDepartmentDependencies: ExecutiveDependency[];
  allDependencies: ExecutiveDependency[];
  dependencyGraph: DependencyGraphNode[];
  dependencyAnalysis: DependencyAnalysisMetric[];
  dependencyHierarchy: DependencyHierarchyStep[];
  dependencyLifecycle: DependencyLifecycleStep[];
  recommendedActions: DependencyRecommendation[];
  pillowEvaluations: PillowDependencyEvaluationMetric[];
  dependencyPrinciples: DependencyPrinciple[];
  governedDomains: GovernedDependencyDomain[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    priorityManagementEngine: string;
    initiativePortfolioEngine: string;
    departmentPlanningEngine: string;
    executiveCalendarEngine: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE110: boolean;
};
