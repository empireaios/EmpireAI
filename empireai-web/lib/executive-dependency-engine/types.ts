/** E1-09 — Executive Dependency Engine frontend types (mirrors Pillow PILLOW-EDE-001). */

export type ExecutiveDependency = {
  dependencyId: string;
  title: string;
  description: string;
  dependencyType: string;
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
  classification: string;
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
  type: string;
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

export type DependencyHierarchyStep = {
  layer: string;
  label: string;
  order: number;
  summary: string;
};

export type DependencyLifecycleStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type DependencyAnalysisMetric = {
  domain: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveDependencyEngine = {
  architectureVersion: "E1-09";
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
  dependencyPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE110: boolean;
};
