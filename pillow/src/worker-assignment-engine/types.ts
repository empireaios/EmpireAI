import type { WorkerAssignmentEngineConfiguration } from "./configuration.js";
import type {
  ASSIGNMENT_DECISIONS,
  ASSIGNMENT_FACTORS,
  ASSIGNMENT_RULES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  WAE_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type AssignmentFactor = (typeof ASSIGNMENT_FACTORS)[number];
export type AssignmentDecision = (typeof ASSIGNMENT_DECISIONS)[number];
export type AssignmentRule = (typeof ASSIGNMENT_RULES)[number];
export type WorkerAssignmentCapability = (typeof WAE_CAPABILITIES)[number];

export type MissionRequirements = {
  requiredSkills: string[];
  requiredTools: string[];
  requiredAuthority: string;
  requiredCertification: "certified";
  maxRisk: number;
  maxCost: number;
  maxWorkload: number;
  dependencyIds: string[];
  supportingWorkerCount: number;
};

/** Candidate worker profile used for evaluation (assignment pool, not Registry). */
export type AssignmentWorker = {
  workerId: string;
  workerName: string;
  skills: string[];
  certificationStatus: "certified" | "pending" | "expired" | "revoked" | string;
  available: boolean;
  lifecycleStatus: string;
  workload: number;
  authorityLevel: string;
  approvedTools: string[];
  dependencyIds: string[];
  riskScore: number;
  costScore: number;
  historicalPerformance: number;
  responsibilityDomains: string[];
  neverExecuteWorkerTasks: true;
};

export type CandidateEvaluation = {
  workerId: string;
  workerName: string;
  eligible: boolean;
  factorScores: Record<string, number>;
  totalScore: number;
  rejectionReasons: string[];
  evaluationNotes: string[];
};

/** Machine-readable Worker Assignment Record (Q1-09). */
export type AssignmentRecord = {
  assignmentId: string;
  timestamp: string;
  missionId: string;
  businessId: string;
  missionRequirements: MissionRequirements;
  candidateWorkers: string[];
  evaluationCriteria: string[];
  selectedPrimaryWorker: string | null;
  supportingWorkers: string[];
  assignmentReason: string;
  riskAssessment: {
    overallRisk: number;
    riskBand: "low" | "medium" | "high";
    notes: string[];
  };
  estimatedCost: number;
  confidenceScore: number;
  metadataVersion: string;
  evaluations: CandidateEvaluation[];
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplaceTaskNegotiationProtocol: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type WorkerAssignmentCatalog = {
  assignmentVersion: string;
  factors: string[];
  workers: AssignmentWorker[];
  records: AssignmentRecord[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplaceTaskNegotiationProtocol: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type WorkerAssignmentInput = {
  assignmentId?: string | null;
  missionId?: string | null;
  businessId?: string | null;
  requiredSkills?: string[];
  requiredTools?: string[];
  requiredAuthority?: string | null;
  maxRisk?: number | null;
  maxCost?: number | null;
  maxWorkload?: number | null;
  dependencyIds?: string[];
  supportingWorkerCount?: number | null;
  responsibilityDomain?: string | null;
  primaryWorkerId?: string | null;
  supportingWorkerIds?: string[];
  workers?: AssignmentWorker[];
  rules?: string[];
  violatedRules?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  replaceTaskNegotiationProtocol?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkerAssignmentValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkerAssignmentEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WAE-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkerAssignmentCapability[];
  totalWorkers: number;
  totalRecords: number;
  lastAssignmentDecision: AssignmentDecision | string | null;
  metadataVersion: string;
};

export type WorkerAssignmentRunReport = {
  assignmentRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "submit_mission"
    | "discover_eligible"
    | "evaluate_candidates"
    | "recommend_primary"
    | "recommend_supporting"
    | "recommend_assignment"
    | "produce"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkerAssignmentEngineRecord;
  catalog: WorkerAssignmentCatalog | null;
  workers: AssignmentWorker[];
  records: AssignmentRecord[];
  latestAssignment: AssignmentRecord | null;
  eligibleWorkers: AssignmentWorker[];
  evaluations: CandidateEvaluation[];
  assignmentDecision: AssignmentDecision | string | null;
  rulesFailed: string[];
  validation: WorkerAssignmentValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkerAssignmentEngineState = {
  engineVersion: "PILLOW-WAE-001";
  missionId: "Q1-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkerAssignmentEngineConfiguration;
  latestReport: WorkerAssignmentRunReport | null;
  engineRecord: WorkerAssignmentEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalWorkers: number;
    totalRecords: number;
    lastAssignmentDecision: AssignmentDecision | string | null;
    notes: string[];
  };
};

export type WorkerAssignmentCockpitSnapshot = {
  missionId: "Q1-09";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalWorkers: number;
  totalRecords: number;
  latestAssignmentId: string | null;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplaceTaskNegotiationProtocol: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
