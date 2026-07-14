/** PILLOW-RAE2-001 — Resource Allocation Engine types (E2-05). */

import type {
  RESOURCE_PIPELINE,
  RESOURCE_PRINCIPLES,
  GOVERNED_RESOURCE_DOMAINS,
  RESOURCE_CLASSIFICATIONS,
  ALLOCATION_OPTIMIZATION_DIMENSIONS,
  RESOURCE_BALANCING_METRICS,
  PILLOW_RESOURCE_EVALUATIONS,
} from "./paths.js";

export type ResourceAllocationEngineVersion = "E2-05";

export type ResourcePipelinePhase = (typeof RESOURCE_PIPELINE)[number];
export type ResourcePrinciple = (typeof RESOURCE_PRINCIPLES)[number];
export type GovernedResourceDomain = (typeof GOVERNED_RESOURCE_DOMAINS)[number];
export type ResourceClassification = (typeof RESOURCE_CLASSIFICATIONS)[number];
export type AllocationOptimizationDimension = (typeof ALLOCATION_OPTIMIZATION_DIMENSIONS)[number];
export type ResourceBalancingMetric = (typeof RESOURCE_BALANCING_METRICS)[number];
export type PillowResourceEvaluation = (typeof PILLOW_RESOURCE_EVALUATIONS)[number];

export type ResourcePipelineStep = {
  phase: ResourcePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ResourceAllocation = {
  allocationId: string;
  resourceType: ResourceClassification;
  domain: GovernedResourceDomain;
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
  domain: GovernedResourceDomain;
  label: string;
  available: number;
  allocated: number;
  utilization: number;
  status: string;
};

export type ResourceBottleneck = {
  order: number;
  resourceType: ResourceClassification;
  title: string;
  severity: string;
  impact: string;
  mitigation: string;
};

export type AllocationOptimizationMetric = {
  dimension: AllocationOptimizationDimension;
  label: string;
  score: number;
  status: string;
};

export type ResourceBalancingEntry = {
  metric: ResourceBalancingMetric;
  label: string;
  value: string;
  status: string;
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
  domain: PillowResourceEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ResourceAllocationEngine = {
  engineVersion: ResourceAllocationEngineVersion;
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
  resourcePrinciples: ResourcePrinciple[];
  governedDomains: GovernedResourceDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    decisionSimulationEngine: string;
    executiveRecommendationEngine: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE206: boolean;
};
