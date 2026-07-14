/** E1-07 — Department Planning Engine frontend types (mirrors Pillow PILLOW-DPE-001). */

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

export type DepartmentHierarchyStep = {
  layer: string;
  label: string;
  order: number;
  summary: string;
};

export type DepartmentLifecycleStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CrossDepartmentMetric = {
  domain: string;
  label: string;
  value: string;
  status: string;
};

export type DepartmentPlanningMetric = {
  domain: string;
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type DepartmentPlanningEngine = {
  architectureVersion: "E1-07";
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
  planningPrinciples: string[];
  governedDepartments: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE108: boolean;
};
