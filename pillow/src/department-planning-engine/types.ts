/** PILLOW-DPE-001 — Department Planning Engine types (E1-07). */

import type {
  DEPARTMENT_HIERARCHY,
  DEPARTMENT_LIFECYCLE,
  PLANNING_PRINCIPLES,
  GOVERNED_DEPARTMENTS,
  CROSS_DEPARTMENT_DOMAINS,
  PILLOW_DEPARTMENT_EVALUATIONS,
  DEPARTMENT_PLANNING_DOMAINS,
} from "./paths.js";

export type DepartmentPlanningEngineVersion = "E1-07";

export type DepartmentHierarchyLayer = (typeof DEPARTMENT_HIERARCHY)[number];
export type DepartmentLifecyclePhase = (typeof DEPARTMENT_LIFECYCLE)[number];
export type PlanningPrinciple = (typeof PLANNING_PRINCIPLES)[number];
export type GovernedDepartment = (typeof GOVERNED_DEPARTMENTS)[number];
export type CrossDepartmentDomain = (typeof CROSS_DEPARTMENT_DOMAINS)[number];
export type PillowDepartmentEvaluation = (typeof PILLOW_DEPARTMENT_EVALUATIONS)[number];
export type DepartmentPlanningDomain = (typeof DEPARTMENT_PLANNING_DOMAINS)[number];

export type DepartmentHierarchyStep = {
  layer: DepartmentHierarchyLayer;
  label: string;
  order: number;
  summary: string;
};

export type DepartmentLifecycleStep = {
  phase: DepartmentLifecyclePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveDepartment = {
  departmentId: string;
  departmentName: string;
  purpose: string;
  strategicResponsibilities: string[];
  currentObjectives: string[];
  assignedInitiatives: string[];
  priority: number;
  owner: string;
  dependencies: string[];
  resources: string;
  capacity: string;
  performance: string;
  businessValue: string;
  currentStatus: string;
  evidence: string[];
  healthScore: number;
  risks: string[];
};

export type CrossDepartmentMetric = {
  domain: CrossDepartmentDomain;
  label: string;
  value: string;
  status: string;
};

export type DepartmentPlanningMetric = {
  domain: DepartmentPlanningDomain;
  label: string;
  value: string;
  status: string;
};

export type DepartmentRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowDepartmentEvaluationMetric = {
  domain: PillowDepartmentEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type DepartmentPlanningEngine = {
  architectureVersion: DepartmentPlanningEngineVersion;
  computedAt: string;
  planningSummary: string;
  planningHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeDepartmentCount: number;
  departments: ExecutiveDepartment[];
  departmentHierarchy: DepartmentHierarchyStep[];
  departmentLifecycle: DepartmentLifecycleStep[];
  crossDepartmentCoordination: CrossDepartmentMetric[];
  departmentPlanning: DepartmentPlanningMetric[];
  recommendedActions: DepartmentRecommendation[];
  pillowEvaluations: PillowDepartmentEvaluationMetric[];
  planningPrinciples: PlanningPrinciple[];
  governedDepartments: GovernedDepartment[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    priorityManagementEngine: string;
    initiativePortfolioEngine: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE108: boolean;
};
