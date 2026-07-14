/** E2-05 — Resource Allocation Engine frontend types (mirrors Pillow PILLOW-RAE2-001). */

export type ResourceAllocation = {
  allocationId: string;
  resourceType: string;
  domain: string;
  purpose: string;
  strategicObjective: string;
  owner: string;
  currentAllocation: string;
  requestedAllocation: string;
  approvedAllocation: string;
  businessValue: string;
  financialValue: string;
  engineeringValue: string;
  expectedRoi: string;
  dependencies: string[];
  constraints: string[];
  confidence: number;
  evidence: string[];
  utilization: number;
  status: string;
};

export type CapacityMetric = {
  domain: string;
  label: string;
  available: number;
  allocated: number;
  utilization: number;
  status: string;
};

export type ResourceBottleneck = {
  order: number;
  resourceType: string;
  title: string;
  severity: string;
  impact: string;
  mitigation: string;
};

export type AllocationOptimizationMetric = {
  dimension: string;
  label: string;
  score: number;
  status: string;
};

export type ResourceBalancingEntry = {
  metric: string;
  label: string;
  value: string;
  status: string;
};

export type ResourcePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ResourceAllocationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowResourceEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ResourceAllocationEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  resourceHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeAllocationCount: number;
  bottleneckCount: number;
  currentAllocations: ResourceAllocation[];
  capacityMetrics: CapacityMetric[];
  utilizationSummary: string;
  allocationOptimization: AllocationOptimizationMetric[];
  resourceBalancing: ResourceBalancingEntry[];
  currentBottlenecks: ResourceBottleneck[];
  resourcePipeline: ResourcePipelineStep[];
  recommendedActions: ResourceAllocationRecommendation[];
  pillowEvaluations: PillowResourceEvaluationMetric[];
  resourcePrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE206: boolean;
};
