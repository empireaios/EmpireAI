import type { WorkerReadinessAuditConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  VALIDATION_STATUSES,
  WRART_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CheckStatus = (typeof CHECK_STATUSES)[number];
export type ReadinessClassification = (typeof READINESS_CLASSIFICATIONS)[number];
export type ReadinessDecision = (typeof READINESS_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type WrartCapability = (typeof WRART_CAPABILITIES)[number];

export type WorkerHandle = object;

export type WorkerProbeResult = {
  workerKey: string;
  reachable: boolean;
  evidence: string;
  error?: string;
};

/* ------------------------------------------------------------------------ */
/* Discovery — workers, from the injected Worker Registry only. Never       */
/* invented.                                                                */
/* ------------------------------------------------------------------------ */

/** Structural worker record as returned by workerRegistry.listWorkers(). */
export type RegisteredWorkerRecord = {
  workerId: string;
  workerName: string | null;
  workerType: string | null;
  department: string | null;
  factory: string | null;
  role: string | null;
  reportingLine: string[];
  governingAuthority: string | null;
  skillProfile: string[];
  approvedTools: string[];
  authorityLevel: string | null;
  certificationStatus: string | null;
  operationalStatus: string | null;
};

export type WorkerDiscoveryResult = {
  discoveredAt: string;
  registryInjected: boolean;
  discoveredCount: number;
  workers: RegisteredWorkerRecord[];
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Per-dimension verification rows                                          */
/* ------------------------------------------------------------------------ */

export type RegistrationCheckRow = {
  workerId: string;
  workerName: string;
  registrationStatus: CheckStatus;
  evidence: string[];
};

export type ReachabilityCheckRow = {
  workerId: string;
  workerName: string;
  reachabilityStatus: CheckStatus;
  probed: boolean;
  evidence: string[];
};

export type ConfigurationCheckRow = {
  workerId: string;
  workerName: string;
  dependencyStatus: CheckStatus;
  evidence: string[];
};

export type GovernanceCheckRow = {
  workerId: string;
  workerName: string;
  governanceStatus: CheckStatus;
  evidence: string[];
};

export type PermissionCheckRow = {
  workerId: string;
  workerName: string;
  permissionStatus: CheckStatus;
  evidence: string[];
};

export type RuntimeConnectivityCheckRow = {
  workerId: string;
  workerName: string;
  runtimeStatus: CheckStatus;
  evidence: string[];
};

export type CapabilityCheckRow = {
  workerId: string;
  workerName: string;
  capabilityStatus: CheckStatus;
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Worker readiness assessment (single row of the readiness matrix)         */
/* ------------------------------------------------------------------------ */

export type WorkerReadinessAssessment = {
  workerId: string;
  workerName: string;
  factory: string;
  registrationStatus: CheckStatus;
  runtimeStatus: CheckStatus;
  reachabilityStatus: CheckStatus;
  governanceStatus: CheckStatus;
  permissionStatus: CheckStatus;
  dependencyStatus: CheckStatus;
  capabilityStatus: CheckStatus;
  readinessClassification: ReadinessClassification;
  supportingEvidence: string[];
  auditReference: string;
  auditTimestamp: string;
};

/* ------------------------------------------------------------------------ */
/* Summaries                                                                 */
/* ------------------------------------------------------------------------ */

export type GovernanceSummary = {
  compliant: boolean;
  grandKingApprovalRequired: true;
  pillowCommandRequired: true;
  selfDocPresent: boolean;
  selfDocPath: string;
  boundaryLocksHonoured: boolean;
  governedWorkerCount: number;
  totalWorkers: number;
  evidence: string[];
};

export type RuntimeSummary = {
  sharedRuntimeCoreBound: boolean;
  pillowOrchestrationRuntimeBound: boolean;
  reachableWorkerCount: number;
  totalWorkers: number;
  evidence: string[];
};

export type CapabilitySummary = {
  capableWorkerCount: number;
  totalWorkers: number;
  evidence: string[];
};

export type ReadinessSummary = {
  computedAt: string;
  totalWorkers: number;
  readyCount: number;
  partiallyReadyCount: number;
  failedCount: number;
  missingCount: number;
  blockedCount: number;
  deferredCount: number;
  overallReadinessScore: number;
  ready: boolean;
  notes: string[];
  evidence: string[];
};

export type IntegrationTarget = (typeof import("./paths.js").INTEGRATION_TARGETS)[number];

export type IntegrationCheckRow = {
  target: IntegrationTarget;
  bound: boolean;
  evidence: string;
};

export type IntegrationVerification = {
  verifiedAt: string;
  rows: IntegrationCheckRow[];
  totalTargets: number;
  boundCount: number;
  allBound: boolean;
  evidence: string[];
};

/** Inbound — Q11-02 consumes the Q1102ConsumableContract exposed by Q11-01. */
export type Q1102ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

/* ------------------------------------------------------------------------ */
/* Validation                                                                */
/* ------------------------------------------------------------------------ */

export type WrartValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/* ------------------------------------------------------------------------ */
/* Worker Readiness Audit Report                                            */
/* ------------------------------------------------------------------------ */

export type WorkerReadinessAuditReport = {
  reportId: string;
  timestamp: string;
  auditVersion: "Q11-WRART-v1";
  totalWorkers: number;
  readyWorkers: number;
  partiallyReadyWorkers: number;
  failedWorkers: number;
  missingWorkers: number;
  blockedWorkers: number;
  deferredWorkers: number;
  governanceSummary: GovernanceSummary;
  runtimeSummary: RuntimeSummary;
  capabilitySummary: CapabilitySummary;
  supportingEvidence: string[];
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  readinessDecision: ReadinessDecision;
  validation: WrartValidationReport;
  consumableByQ1103: boolean;
  neverImplementQ1103OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  firstWorkerReadinessGate: true;
  q1102ContractConsumed: Q1102ContractConsumption;
  workerInventory: RegisteredWorkerRecord[];
  readinessMatrix: WorkerReadinessAssessment[];
  readinessSummary: ReadinessSummary;
  integrationSummary: IntegrationVerification;
  auditStatus: AuditStatus;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveImmutableAuditHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  maskSensitiveValues: true;
  neverFabricateAuditEvidence: true;
  neverCertifyMissingWorkers: true;
  neverCertifyUnreachableWorkers: true;
  neverAssumeImplementation: true;
  neverModifyWorkerImplementations: true;
  neverRepairFailedWorkers: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type WrartInput = {
  reportId?: string | null;
  missionId?: string | null;
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  fabricateAuditEvidence?: boolean;
  forceFail?: boolean;
  certifyMissingWorkers?: boolean;
  certifyUnreachableWorkers?: boolean;
  assumeImplementation?: boolean;
  modifyWorkerImplementations?: boolean;
  repairFailedWorkers?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1103OrLater?: boolean;
};

export type WrartRunReport = WorkerReadinessAuditReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type WrartEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WRART-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WrartCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastReadinessDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type WrartCatalog = {
  reportVersion: string;
  workerId: string;
  reports: WorkerReadinessAuditReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateAuditEvidence: true;
  neverAssumeImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1103OrLater: true;
  secondQ11Gate: true;
};

/** Q11-02's own exposed contract — consumed by Q11-03 (Pillow Command Audit). */
export type Q1103ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "worker-readiness-audit";
  missionId: "Q11-02";
  consumerMissionId: "Q11-03";
  exposedFields: string[];
  readinessClassificationCatalog: string[];
  readinessDecisionCatalog: string[];
  notes: string[];
  neverImplementQ1103OrLater: true;
  structuralSignalOnly: true;
};

export type WorkerReadinessAuditState = {
  engineVersion: "PILLOW-WRART-001";
  missionId: "Q11-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkerReadinessAuditConfiguration;
  latestReport: WorkerReadinessAuditReport | null;
  engineRecord: WrartEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    lastReportId: string | null;
    lastReadinessDecision: ReadinessDecision | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type WorkerReadinessAuditCockpitSnapshot = {
  missionId: "Q11-02";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastReadinessDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  readinessClassificationOptions: ReadinessClassification[];
  neverFabricateAuditEvidence: true;
  neverCertifyMissingWorkers: true;
  neverCertifyUnreachableWorkers: true;
  neverAssumeImplementation: true;
  neverModifyWorkerImplementations: true;
  neverRepairFailedWorkers: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1103OrLater: true;
  secondQ11Gate: true;
};
