import type { SharedRuntimeCertificationConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CERTIFICATION_DECISIONS,
  RUNTIME_CERTIFICATION_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  SRCRT_CAPABILITIES,
  OPERATIONAL_STATES,
  Q10_RUNTIME_CATALOG,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type RuntimeCertificationStatus = (typeof RUNTIME_CERTIFICATION_STATUSES)[number];
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type SrcrtCapability = (typeof SRCRT_CAPABILITIES)[number];
export type Q10Runtime = (typeof Q10_RUNTIME_CATALOG)[number];
export type Q10RuntimeId = Q10Runtime["missionId"];

/* ------------------------------------------------------------------------ */
/* Repository / runtime evidence — never fabricated.                        */
/* ------------------------------------------------------------------------ */

export type RuntimeEvidence = {
  missionId: Q10RuntimeId;
  engineExists: boolean;
  configExists: boolean;
  governanceExists: boolean;
  bridgeExists: boolean;
  testExists: boolean;
  sessionReferenced: boolean;
  registryReferenced: boolean;
  certified: boolean;
  certifiedSource: "json" | "markdown" | "none";
  q1014ContractPresent: boolean;
  deferred: boolean;
  evidenceContradiction: string | null;
  evidence: string;
};

export type WorkerHandle = object;

export type WorkerProbeResult = {
  workerKey: string;
  reachable: boolean;
  evidence: string;
  error?: string;
};

/**
 * Public certification finding per runtime. Field names are the mandated
 * Q10-14 CertificationResult model.
 */
export type CertificationResult = {
  certificationId: string;
  runtimeComponent: string;
  missionId: Q10RuntimeId;
  certificationStatus: RuntimeCertificationStatus;
  verificationResult: string;
  integrationStatus: "bound" | "ready" | "unavailable";
  governanceStatus: "compliant" | "non_compliant";
  reportingStatus: "capable" | "unavailable";
  runtimeHealth: "healthy" | "degraded" | "failed" | "unknown";
  supportingEvidence: string[];
  testResults: string;
  auditReference: string;
  certificationTimestamp: string;
};

/* ------------------------------------------------------------------------ */
/* Repository / runtime audit summaries                                     */
/* ------------------------------------------------------------------------ */

export type RepositoryAudit = {
  auditedAt: string;
  runtimesScanned: number;
  evidenceComplete: number;
  evidence: string[];
};

export type RuntimeAudit = {
  auditedAt: string;
  probesAttempted: number;
  probesReachable: number;
  probes: WorkerProbeResult[];
  notes: string[];
};

export type RuntimeInventoryItem = {
  missionId: Q10RuntimeId;
  runtimeName: string;
  engineVersion: string;
  dependencyKey: string;
  modulePresent: boolean;
  injected: boolean;
};

export type RuntimeInventory = {
  inventoriedAt: string;
  totalRuntimes: number;
  modulesPresent: number;
  injectedCount: number;
  items: RuntimeInventoryItem[];
};

/* ------------------------------------------------------------------------ */
/* Integration verification                                                 */
/* ------------------------------------------------------------------------ */

export type IntegrationCheckRow = {
  missionId: Q10RuntimeId;
  runtimeName: string;
  registryReferenced: boolean;
  runtimeHandshake: "bound" | "ready" | "unavailable";
  allBound: boolean;
  evidence: string;
};

export type IntegrationVerification = {
  verifiedAt: string;
  rows: IntegrationCheckRow[];
  allBound: boolean;
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Governance / monitoring / recovery / auditability / reporting dimensions */
/* ------------------------------------------------------------------------ */

export type GovernanceResults = {
  compliant: boolean;
  grandKingApprovalRequired: true;
  pillowCommandRequired: true;
  checks: Array<{
    missionId: Q10RuntimeId | "self";
    governancePath: string;
    present: boolean;
    containsExpectedLabel: boolean;
  }>;
  missingDocs: string[];
  evidence: string[];
};

export type MonitoringVerification = {
  verified: boolean;
  monitoringRuntimeInjected: boolean;
  monitoringRuntimeReachable: boolean;
  contractExposed: boolean;
  evidence: string[];
};

export type RecoveryVerification = {
  verified: boolean;
  recoveryRuntimeInjected: boolean;
  recoveryRuntimeReachable: boolean;
  contractExposed: boolean;
  evidence: string[];
};

export type AuditabilityVerification = {
  verified: boolean;
  auditRuntimeInjected: boolean;
  auditRuntimeReachable: boolean;
  contractExposed: boolean;
  evidence: string[];
};

export type ReportingVerification = {
  verified: boolean;
  executiveReportingAvailable: boolean;
  runtimesWithReportingAccess: number;
  totalRuntimes: number;
  evidence: string[];
};

export type CertificationSummary = {
  computedAt: string;
  totalRuntimes: number;
  certifiedCount: number;
  partiallyCertifiedCount: number;
  failedCount: number;
  blockedCount: number;
  deferredCount: number;
  ready: boolean;
  notes: string[];
  evidence: string[];
};

export type Q1014ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

/* ------------------------------------------------------------------------ */
/* Certification findings + full report                                     */
/* ------------------------------------------------------------------------ */

export type CertificationFindings = {
  certificationDecision: CertificationDecision;
  runtimeCertificationMatrix: CertificationResult[];
  risks: string[];
  outstandingIssues: string[];
  confidenceScore: number;
};

export type SrcrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SharedRuntimeCertificationReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: "Q10-SRCRT-v1";
  runtimeInventory: RuntimeInventory;
  integrationSummary: IntegrationVerification;
  certificationSummary: CertificationSummary;
  passedComponents: string[];
  failedComponents: string[];
  missingComponents: string[];
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  certificationDecision: CertificationDecision;
  validation: SrcrtValidationReport;
  consumableByQ1101: boolean;
  runtimeCertificationMatrix: CertificationResult[];
  governanceResults: GovernanceResults;
  monitoringVerification: MonitoringVerification;
  recoveryVerification: RecoveryVerification;
  auditabilityVerification: AuditabilityVerification;
  reportingVerification: ReportingVerification;
  q1014ContractConsumed: Q1014ContractConsumption;
  risks: string[];
  repositoryAudit: RepositoryAudit;
  runtimeAudit: RuntimeAudit;
  runTimestamp: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  preserveCompleteTraceability: true;
  preserveImmutableCertificationHistory: true;
  preserveCertificationHistory: true;
  preserveAuditHistory: true;
  deterministicCertification: true;
  maskSensitiveValues: true;
  neverFabricateCertificationEvidence: true;
  neverCertifyMissingFunctionality: true;
  neverAssumeImplementation: true;
  neverImplementMissingRuntimes: true;
  neverModifyRuntimeBehaviour: true;
  neverAutomaticallyFixFailures: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1101OrLater: true;
  finalQ10Gate: true;
};

export type SrcrtInput = {
  reportId?: string | null;
  missionId?: string | null;
  deferredMissionIds?: Q10RuntimeId[];
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  fabricateCertificationEvidence?: boolean;
  forceFail?: boolean;
  certifyMissingFunctionality?: boolean;
  assumeImplementation?: boolean;
  implementMissingRuntimes?: boolean;
  modifyRuntimeBehaviour?: boolean;
  automaticallyFixFailures?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1101OrLater?: boolean;
};

export type SrcrtRunReport = SharedRuntimeCertificationReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type SrcrtEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-SRCRT-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SrcrtCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastCertificationDecision: CertificationDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type SrcrtCatalog = {
  reportVersion: string;
  workerId: string;
  reports: SharedRuntimeCertificationReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateCertificationEvidence: true;
  neverAssumeImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1101OrLater: true;
  finalQ10Gate: true;
};

/** Q10-14's own exposed contract — consumed by Q11-01. */
export type Q1101ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "shared-runtime-certification";
  missionId: "Q10-14";
  consumerMissionId: "Q11-01";
  exposedFields: string[];
  runtimeCertificationCatalog: string[];
  certificationDecisionCatalog: string[];
  notes: string[];
  neverImplementQ1101OrLater: true;
};

export type SharedRuntimeCertificationState = {
  engineVersion: "PILLOW-SRCRT-001";
  missionId: "Q10-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: SharedRuntimeCertificationConfiguration;
  latestReport: SharedRuntimeCertificationReport | null;
  engineRecord: SrcrtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    lastReportId: string | null;
    lastCertificationDecision: CertificationDecision | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type SharedRuntimeCertificationCockpitSnapshot = {
  missionId: "Q10-14";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastCertificationDecision: CertificationDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  runtimeCertificationStatusOptions: RuntimeCertificationStatus[];
  neverFabricateCertificationEvidence: true;
  neverCertifyMissingFunctionality: true;
  neverAssumeImplementation: true;
  neverImplementMissingRuntimes: true;
  neverModifyRuntimeBehaviour: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1101OrLater: true;
  finalQ10Gate: true;
};
