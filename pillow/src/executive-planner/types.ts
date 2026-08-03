import type { ExecutivePlannerConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  EP_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  WORKFORCE_CATEGORIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type WorkforceCategory = (typeof WORKFORCE_CATEGORIES)[number];
export type ExecutivePlannerCapability = (typeof EP_CAPABILITIES)[number];

/** Input for Q0-01 — high-level objective only. No worker assignment. */
export type ExecutivePlannerInput = {
  objective: string;
  priorityHint?: "critical" | "high" | "medium" | "low";
  constraintHints?: string[];
  riskHints?: string[];
  assumptionHints?: string[];
  dependencyHints?: string[];
  successCriteriaHints?: string[];
  approvalHints?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWork?: boolean;
  assignWorkers?: boolean;
  invokeTools?: boolean;
  approveActions?: boolean;
};

export type ExecutionStage = {
  stageId: string;
  stageNumber: number;
  name: string;
  description: string;
  expectedOutcomes: string[];
};

export type ApprovalRequirement = {
  approvalId: string;
  requirement: string;
  requiredBeforeStage: string;
  status: "required" | "deferred";
};

/** Machine-readable execution plan consumed by future Q0 missions. */
export type ExecutionPlan = {
  planId: string;
  timestamp: string;
  objectiveSummary: string;
  intent: string;
  assumptions: string[];
  constraints: string[];
  priorities: string[];
  risks: string[];
  dependencies: string[];
  requiredWorkforceCategories: WorkforceCategory[];
  executionStages: ExecutionStage[];
  expectedDeliverables: string[];
  approvalRequirements: ApprovalRequirement[];
  successCriteria: string[];
  validationStatus: ValidationStatus;
  metadataVersion: string;
  planTraceId: string;
  /** Explicit Q0-01 boundaries. */
  neverExecuteWork: true;
  neverAssignWorkers: true;
  neverInvokeTools: true;
  neverApproveActions: true;
  workersAssigned: false;
  workExecuted: false;
  toolsInvoked: false;
  actionsApproved: false;
  preservePlanTraceability: true;
  preserveAuditability: true;
  preservePlanningIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type PlanValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExecutivePlannerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EP-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ExecutivePlannerCapability[];
  totalPlans: number;
  metadataVersion: string;
};

export type ExecutivePlannerRunReport = {
  plannerRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "submit_objective"
    | "analyze_objective"
    | "produce_execution_plan"
    | "identify_workforce_categories"
    | "validate_plan"
    | "diagnostics";
  engineRecord: ExecutivePlannerEngineRecord;
  plans: ExecutionPlan[];
  validation: PlanValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExecutivePlannerState = {
  engineVersion: "PILLOW-EP-001";
  missionId: "Q0-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutivePlannerConfiguration;
  latestReport: ExecutivePlannerRunReport | null;
  engineRecord: ExecutivePlannerEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalPlans: number;
    notes: string[];
  };
};

export type ExecutivePlannerCockpitSnapshot = {
  missionId: "Q0-01";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalPlans: number;
  latestPlanId: string | null;
  neverAssignWorkers: true;
  neverExecuteWork: true;
};
