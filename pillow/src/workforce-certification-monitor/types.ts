import type { WorkforceCertificationMonitorConfiguration } from "./configuration.js";
import type {
  CERTIFICATION_CHECKS,
  CERTIFICATION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RECOMMENDED_ACTIONS,
  VALIDATION_STATUSES,
  WCM_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];
export type CertificationCheck = (typeof CERTIFICATION_CHECKS)[number];
export type RecommendedAction = (typeof RECOMMENDED_ACTIONS)[number];
export type WorkforceCertificationMonitorCapability = (typeof WCM_CAPABILITIES)[number];

/** Machine-readable Certification Record (Q0-29). */
export type CertificationRecord = {
  certificationId: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  department: string;
  certificationStatus: CertificationStatus | string;
  availabilityStatus: string;
  capabilityStatus: string;
  toolAccessStatus: string;
  governanceStatus: string;
  runtimeHealth: string;
  qualityCompliance: string;
  certificationIssues: string[];
  recommendedAction: RecommendedAction | string;
  metadataVersion: string;
  certificationTraceId: string;
  validationStatus: ValidationStatus;
  checksPerformed: string[];
  checksFailed: string[];
  selfCritiqueCompliance: string;
  dependencyHealth: string;
  registered: boolean;
  reachable: boolean;
  monitorCycleId: string | null;
  /** Explicit Q0-29 boundaries. */
  neverExecuteWorkerTasks: true;
  neverRepairWorkersAutomatically: true;
  neverReplaceWorkerQualityStandard: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  workersRepairedAutomatically: false;
  workerQualityStandardReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveCertificationTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-29 — validate workforce readiness only. */
export type WorkforceCertificationMonitorInput = {
  certificationId?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  department?: string | null;
  missionId?: string | null;
  businessId?: string | null;
  registered?: boolean | null;
  available?: boolean | null;
  reachable?: boolean | null;
  capabilitiesRegistered?: boolean | null;
  requiredToolsAccessible?: boolean | null;
  governanceCompliant?: boolean | null;
  qualityStandardCompliant?: boolean | null;
  selfCritiqueCompliant?: boolean | null;
  runtimeHealthy?: boolean | null;
  dependenciesHealthy?: boolean | null;
  executiveReady?: boolean | null;
  forceStatus?: CertificationStatus | string | null;
  workers?: WorkforceCertificationMonitorInput[];
  checks?: string[];
  certifiedIssues?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  repairWorkersAutomatically?: boolean;
  replaceWorkerQualityStandard?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkforceCertificationMonitorValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceCertificationMonitorEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WCM-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkforceCertificationMonitorCapability[];
  totalCertificationRecords: number;
  certifiedCount: number;
  decertifiedCount: number;
  failureCount: number;
  lastMonitorCycleAt: string | null;
  lastStatus: CertificationStatus | string | null;
  metadataVersion: string;
};

export type WorkforceCertificationMonitorRunReport = {
  certificationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "certify_worker"
    | "monitor_workforce"
    | "verify_availability"
    | "verify_reachability"
    | "verify_capabilities"
    | "verify_tool_access"
    | "verify_governance"
    | "verify_quality_compliance"
    | "verify_self_critique_compliance"
    | "detect_failures"
    | "decertify_worker"
    | "recertify_worker"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkforceCertificationMonitorEngineRecord;
  records: CertificationRecord[];
  certificationStatus: CertificationStatus | string | null;
  certificationIssues: string[];
  failureDetected: boolean;
  validation: WorkforceCertificationMonitorValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceCertificationMonitorState = {
  engineVersion: "PILLOW-WCM-001";
  missionId: "Q0-29";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkforceCertificationMonitorConfiguration;
  latestReport: WorkforceCertificationMonitorRunReport | null;
  engineRecord: WorkforceCertificationMonitorEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalCertificationRecords: number;
    certifiedCount: number;
    decertifiedCount: number;
    failureCount: number;
    lastMonitorCycleAt: string | null;
    lastStatus: CertificationStatus | string | null;
    notes: string[];
  };
};

export type WorkforceCertificationMonitorCockpitSnapshot = {
  missionId: "Q0-29";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalCertificationRecords: number;
  latestCertificationId: string | null;
  certifiedCount: number;
  neverExecuteWorkerTasks: true;
  neverRepairWorkersAutomatically: true;
  neverReplaceWorkerQualityStandard: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
