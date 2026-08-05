import type { CapitalFactoryCertificationConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CERTIFICATION_DECISIONS,
  WORKER_CERTIFICATION_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  CAPCRT_CAPABILITIES,
  OPERATIONAL_STATES,
  Q9_MISSION_CATALOG,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type WorkerCertificationStatus = (typeof WORKER_CERTIFICATION_STATUSES)[number];
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type CapcrtCapability = (typeof CAPCRT_CAPABILITIES)[number];
export type Q9Mission = (typeof Q9_MISSION_CATALOG)[number];
export type Q9MissionId = Q9Mission["missionId"];

/* ------------------------------------------------------------------------ */
/* Repository / runtime evidence — never fabricated.                        */
/* ------------------------------------------------------------------------ */

export type MissionEvidence = {
  missionId: Q9MissionId;
  engineExists: boolean;
  configExists: boolean;
  governanceExists: boolean;
  bridgeExists: boolean;
  testExists: boolean;
  sessionReferenced: boolean;
  registryReferenced: boolean;
  finalPass: boolean;
  finalPassSource: "json" | "markdown" | "none";
  q911ContractPresent: boolean;
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

export type WorkerCertificationRow = {
  missionId: Q9MissionId;
  missionName: string;
  subsystemId: string;
  engineVersion: string;
  modulePath: string;
  expectedDeliverable: string;
  status: WorkerCertificationStatus;
  reason: string;
  engineEvidence: string;
  configEvidence: string;
  governanceEvidence: string;
  bridgeEvidence: string;
  testEvidence: string;
  sessionEvidence: string;
  registryEvidence: string;
  runtimeEvidence: string;
  q911ContractEvidence: string;
};

/* ------------------------------------------------------------------------ */
/* Repository / runtime audit summaries                                     */
/* ------------------------------------------------------------------------ */

export type RepositoryAudit = {
  auditedAt: string;
  missionsScanned: number;
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

export type WorkerInventoryItem = {
  missionId: Q9MissionId;
  missionName: string;
  engineVersion: string;
  dependencyKey: string;
  modulePresent: boolean;
  injected: boolean;
};

export type WorkerInventory = {
  inventoriedAt: string;
  totalWorkers: number;
  modulesPresent: number;
  injectedCount: number;
  items: WorkerInventoryItem[];
};

/* ------------------------------------------------------------------------ */
/* Integration verification                                                 */
/* ------------------------------------------------------------------------ */

export type IntegrationCheckRow = {
  missionId: Q9MissionId;
  missionName: string;
  registryReferenced: boolean;
  expectedBinds: string[];
  observedBinds: string[];
  missingBinds: string[];
  allBound: boolean;
  runtimeHandshake: "bound" | "ready" | "unavailable";
  evidence: string;
};

export type IntegrationVerification = {
  verifiedAt: string;
  rows: IntegrationCheckRow[];
  allBound: boolean;
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* End-to-end workflow + readiness dimensions                               */
/* ------------------------------------------------------------------------ */

export type EndToEndWorkflowStage = {
  stageId: string;
  missionId: Q9MissionId | "ERR" | "pillow_review" | "grand_king_approval";
  label: string;
  satisfied: boolean;
  evidence: string;
};

export type EndToEndWorkflowResults = {
  evaluatedAt: string;
  complete: boolean;
  currencyPrecisionVerified: boolean;
  traceabilityVerified: boolean;
  stages: EndToEndWorkflowStage[];
  evidence: string[];
};

export type ExecutiveReportingResults = {
  capable: boolean;
  executiveReportingAvailable: boolean;
  workersWithReportingAccess: number;
  totalWorkers: number;
  evidence: string[];
};

export type GovernanceResults = {
  compliant: boolean;
  grandKingApprovalRequired: true;
  pillowCommandRequired: true;
  checks: Array<{
    missionId: Q9MissionId | "self";
    governancePath: string;
    present: boolean;
    containsExpectedLabel: boolean;
  }>;
  missingDocs: string[];
  evidence: string[];
};

export type FinancialTraceabilityResults = {
  traceable: boolean;
  currencyPrecisionEnforced: boolean;
  auditHistoryPreserved: boolean;
  notes: string[];
  evidence: string[];
};

export type ProductionReadinessAssessment = {
  ready: boolean;
  modulesPresent: number;
  modulesTotal: number;
  certifiedWorkers: number;
  certifiedWorkersTotal: number;
  notes: string[];
  evidence: string[];
};

export type Q911ContractConsumption = {
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
  workerCertificationMatrix: WorkerCertificationRow[];
  risks: string[];
  openIssues: string[];
  confidenceScore: number;
};

export type CapcrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CapitalCertificationReport = {
  /** Certification ID */
  certificationId: string;
  /** Timestamp */
  timestamp: string;
  /** Capital Factory Version */
  capitalFactoryVersion: string;
  /** Repository Audit */
  repositoryAudit: RepositoryAudit;
  /** Runtime Audit */
  runtimeAudit: RuntimeAudit;
  /** Worker Inventory */
  workerInventory: WorkerInventory;
  /** Worker Certification Matrix */
  workerCertificationMatrix: WorkerCertificationRow[];
  /** Integration Results */
  integrationResults: IntegrationVerification;
  /** End-to-End Workflow Results */
  endToEndWorkflowResults: EndToEndWorkflowResults;
  /** Executive Reporting Results */
  executiveReportingResults: ExecutiveReportingResults;
  /** Governance Results */
  governanceResults: GovernanceResults;
  /** Financial Traceability Results */
  financialTraceabilityResults: FinancialTraceabilityResults;
  /** Production Readiness Assessment */
  productionReadinessAssessment: ProductionReadinessAssessment;
  /** Open Issues */
  openIssues: string[];
  /** Risks */
  risks: string[];
  /** Certification Decision */
  certificationDecision: CertificationDecision;
  /** Supporting Evidence */
  supportingEvidence: string[];
  /** Confidence Score */
  confidenceScore: number;
  /** Metadata Version */
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  factoryName: string;
  certificationScope: Q9MissionId[];
  validation: CapcrtValidationReport;
  runTimestamp: string;
  auditStatus: AuditStatus;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  q911ContractConsumed: Q911ContractConsumption;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  preserveCompleteTraceability: true;
  preserveCertificationHistory: true;
  preserveAuditHistory: true;
  neverFabricateSuccessfulTests: true;
  neverAssumeImplementation: true;
  neverImplementMissingWorkers: true;
  neverModifyFinancialRecords: true;
  neverAutomaticallyFixFailures: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ10OrLater: true;
  neverExposeCredentials: true;
  finalQ9Gate: true;
  consumableByFutureSeries: false;
};

export type CapcrtInput = {
  reportId?: string | null;
  factoryName?: string | null;
  missionId?: string | null;
  deferredMissionIds?: Q9MissionId[];
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  fabricateSuccessfulTests?: boolean;
  forceFail?: boolean;
  assumeImplementation?: boolean;
  implementMissingWorkers?: boolean;
  modifyFinancialRecords?: boolean;
  automaticallyFixFailures?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ10OrLater?: boolean;
};

export type CapcrtRunReport = CapitalCertificationReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type CapcrtEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CAPCRT-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CapcrtCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastCertificationDecision: CertificationDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type CapcrtCatalog = {
  reportVersion: string;
  workerId: string;
  reports: CapitalCertificationReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateSuccessfulTests: true;
  neverAssumeImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ10OrLater: true;
  finalQ9Gate: true;
};

export type CapitalFactoryCertificationState = {
  engineVersion: "PILLOW-CAPCRT-001";
  missionId: "Q9-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: CapitalFactoryCertificationConfiguration;
  latestReport: CapitalCertificationReport | null;
  engineRecord: CapcrtEngineRecord | null;
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

export type CapitalFactoryCertificationCockpitSnapshot = {
  missionId: "Q9-11";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastCertificationDecision: CertificationDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  workerCertificationStatusOptions: WorkerCertificationStatus[];
  neverFabricateSuccessfulTests: true;
  neverAssumeImplementation: true;
  neverImplementMissingWorkers: true;
  neverModifyFinancialRecords: true;
  neverAutomaticallyFixFailures: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ10OrLater: true;
  finalQ9Gate: true;
};
