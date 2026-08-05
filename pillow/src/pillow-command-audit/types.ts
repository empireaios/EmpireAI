import type { PillowCommandAuditConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  VALIDATION_STATUSES,
  PCART_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CheckStatus = (typeof CHECK_STATUSES)[number];
export type ReadinessClassification = (typeof READINESS_CLASSIFICATIONS)[number];
export type ReadinessDecision = (typeof READINESS_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type PcartCapability = (typeof PCART_CAPABILITIES)[number];

export type WorkerHandle = object;

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
/* Command dispatch — structural, presence-only. Never executes business    */
/* logic on the worker.                                                     */
/* ------------------------------------------------------------------------ */

export type CommandDispatchProbeResult = {
  workerId: string;
  commandId: string;
  dispatchStatus: CheckStatus;
  evidence: string;
};

/* ------------------------------------------------------------------------ */
/* Per-dimension verification rows                                          */
/* ------------------------------------------------------------------------ */

export type AssignmentCheckRow = {
  workerId: string;
  workerName: string;
  assignmentStatus: CheckStatus;
  evidence: string[];
};

export type CommandDispatchCheckRow = {
  workerId: string;
  workerName: string;
  commandId: string;
  dispatchStatus: CheckStatus;
  evidence: string[];
};

export type CommunicationCheckRow = {
  workerId: string;
  workerName: string;
  communicationStatus: CheckStatus;
  evidence: string[];
};

export type SupervisionCheckRow = {
  workerId: string;
  workerName: string;
  supervisionStatus: CheckStatus;
  progressStatus: CheckStatus;
  resultStatus: CheckStatus;
  evidence: string[];
};

export type GovernanceCheckRow = {
  workerId: string;
  workerName: string;
  governanceStatus: CheckStatus;
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Pillow Command Assessment (single row of the command matrix) — LOCKED    */
/* field set.                                                               */
/* ------------------------------------------------------------------------ */

export type PillowCommandAssessment = {
  workerId: string;
  factoryId: string;
  commandId: string;
  assignmentStatus: CheckStatus;
  communicationStatus: CheckStatus;
  supervisionStatus: CheckStatus;
  progressStatus: CheckStatus;
  resultStatus: CheckStatus;
  governanceStatus: CheckStatus;
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

export type AssignmentSummary = {
  assignableWorkerCount: number;
  totalWorkers: number;
  missionRuntimeBound: boolean;
  evidence: string[];
};

export type CommunicationSummary = {
  communicableWorkerCount: number;
  totalWorkers: number;
  communicationRuntimeBound: boolean;
  evidence: string[];
};

export type SupervisionSummary = {
  supervisedWorkerCount: number;
  progressTrackedWorkerCount: number;
  resultsCollectedWorkerCount: number;
  totalWorkers: number;
  monitoringRuntimeBound: boolean;
  orchestrationRuntimeBound: boolean;
  evidence: string[];
};

export type CommandReadinessSummary = {
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

/** Inbound — Q11-03 consumes the Q1103ConsumableContract exposed by Q11-02. */
export type Q1103ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

/* ------------------------------------------------------------------------ */
/* Validation                                                                */
/* ------------------------------------------------------------------------ */

export type PcartValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/* ------------------------------------------------------------------------ */
/* Pillow Command Audit Report                                              */
/* ------------------------------------------------------------------------ */

export type PillowCommandAuditReport = {
  reportId: string;
  timestamp: string;
  auditVersion: "Q11-PCART-v1";
  totalWorkersAudited: number;
  successfullyControlledWorkers: number;
  partiallyControlledWorkers: number;
  failedCommandTests: number;
  missingCommandWorkers: number;
  blockedCommandWorkers: number;
  deferredCommandWorkers: number;
  communicationSummary: CommunicationSummary;
  assignmentSummary: AssignmentSummary;
  supervisionSummary: SupervisionSummary;
  governanceSummary: GovernanceSummary;
  supportingEvidence: string[];
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  commandReadinessDecision: ReadinessDecision;
  validation: PcartValidationReport;
  consumableByQ1104: boolean;
  neverImplementQ1104OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  firstPillowCommandGate: true;
  q1103ContractConsumed: Q1103ContractConsumption;
  workerInventory: RegisteredWorkerRecord[];
  commandMatrix: PillowCommandAssessment[];
  commandReadinessSummary: CommandReadinessSummary;
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
  neverCertifyUnverifiedCommandCapability: true;
  neverAssumeImplementation: true;
  neverModifyWorkerImplementations: true;
  neverRepairFailedWorkers: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type PcartInput = {
  reportId?: string | null;
  missionId?: string | null;
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  fabricateAuditEvidence?: boolean;
  forceFail?: boolean;
  certifyUnverifiedCommandCapability?: boolean;
  assumeImplementation?: boolean;
  modifyWorkerImplementations?: boolean;
  repairFailedWorkers?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1104OrLater?: boolean;
};

export type PcartRunReport = PillowCommandAuditReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type PcartEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PCART-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PcartCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastCommandReadinessDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type PcartCatalog = {
  reportVersion: string;
  workerId: string;
  reports: PillowCommandAuditReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateAuditEvidence: true;
  neverAssumeImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1104OrLater: true;
  thirdQ11Gate: true;
};

/** Q11-03's own exposed contract — consumed by Q11-04 (Factory Readiness Audit). */
export type Q1104ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "pillow-command-audit";
  missionId: "Q11-03";
  consumerMissionId: "Q11-04";
  exposedFields: string[];
  readinessClassificationCatalog: string[];
  commandReadinessDecisionCatalog: string[];
  notes: string[];
  neverImplementQ1104OrLater: true;
  structuralSignalOnly: true;
};

export type PillowCommandAuditState = {
  engineVersion: "PILLOW-PCART-001";
  missionId: "Q11-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: PillowCommandAuditConfiguration;
  latestReport: PillowCommandAuditReport | null;
  engineRecord: PcartEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    lastReportId: string | null;
    lastCommandReadinessDecision: ReadinessDecision | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type PillowCommandAuditCockpitSnapshot = {
  missionId: "Q11-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastCommandReadinessDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  readinessClassificationOptions: ReadinessClassification[];
  neverFabricateAuditEvidence: true;
  neverCertifyUnverifiedCommandCapability: true;
  neverAssumeImplementation: true;
  neverModifyWorkerImplementations: true;
  neverRepairFailedWorkers: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1104OrLater: true;
  thirdQ11Gate: true;
};
