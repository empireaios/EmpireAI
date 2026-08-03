import type { LocalBusinessCertificationConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CERTIFICATION_DECISIONS,
  COMPONENT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LBC_CAPABILITIES,
  OPERATIONAL_STATES,
  Q7_MISSION_CATALOG,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type LocalBusinessCertificationCapability = (typeof LBC_CAPABILITIES)[number];
export type Q7Mission = (typeof Q7_MISSION_CATALOG)[number];
export type Q7MissionId = Q7Mission["missionId"];

/* ------------------------------------------------------------------------ */
/* Repository / runtime evidence — never fabricated.                        */
/* ------------------------------------------------------------------------ */

export type MissionEvidence = {
  missionId: Q7MissionId;
  moduleExists: boolean;
  finalPass: boolean;
  finalPassSource: "json" | "markdown" | "none";
  sessionReferenced: boolean;
  registryReferenced: boolean;
  configExists: boolean;
  governanceExists: boolean;
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

export type ComponentStatusRow = {
  missionId: Q7MissionId;
  missionName: string;
  subsystemId: string;
  modulePath: string;
  expectedDeliverable: string;
  status: ComponentStatus;
  reason: string;
  moduleEvidence: string;
  finalPassEvidence: string;
  sessionEvidence: string;
  registryEvidence: string;
  runtimeEvidence: string;
  governanceEvidence: string;
  configEvidence: string;
};

/* ------------------------------------------------------------------------ */
/* Deliverable verification — derived strictly from componentStatusMatrix.  */
/* ------------------------------------------------------------------------ */

export type DeliverableVerificationItem = {
  missionId: Q7MissionId;
  label: string;
  present: boolean;
  critical: true;
  evidenceRefs: string[];
  notes: string;
};

export type DeliverableVerification = {
  verificationId: string;
  verifiedAt: string;
  items: DeliverableVerificationItem[];
  requiredCount: number;
  presentCount: number;
  allRequiredPresent: boolean;
  missingItems: Q7MissionId[];
  criticalItemsMissing: Q7MissionId[];
};

/* ------------------------------------------------------------------------ */
/* Integration verification — session bind text + registry + handshakes.    */
/* ------------------------------------------------------------------------ */

export type IntegrationCheckRow = {
  missionId: Q7MissionId;
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
/* Readiness dimensions — evidence-derived only.                            */
/* ------------------------------------------------------------------------ */

export type ProductionReadiness = {
  ready: boolean;
  modulesPresent: number;
  modulesTotal: number;
  finalPassCount: number;
  finalPassTotal: number;
  notes: string[];
  evidence: string[];
};

export type GovernanceComplianceCheck = {
  missionId: Q7MissionId | "self";
  governancePath: string;
  present: boolean;
  containsExpectedLabel: boolean;
};

export type GovernanceCompliance = {
  compliant: boolean;
  checks: GovernanceComplianceCheck[];
  missingDocs: string[];
  evidence: string[];
};

export type OperationalReadiness = {
  ready: boolean;
  reachableCount: number;
  totalCount: number;
  probes: WorkerProbeResult[];
  notes: string[];
};

export type WorkflowCompletenessStage = {
  missionId: Q7MissionId;
  dependsOn: Q7MissionId[];
  dependenciesSatisfied: boolean;
  evidence: string;
};

export type WorkflowCompleteness = {
  complete: boolean;
  stages: WorkflowCompletenessStage[];
  evidence: string[];
};

export type ReportingCapability = {
  capable: boolean;
  workersWithReportingAccess: number;
  totalWorkers: number;
  executiveReportingAvailable: boolean;
  evidence: string[];
};

export type LaunchPackContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

/* ------------------------------------------------------------------------ */
/* Certification findings + full report.                                    */
/* ------------------------------------------------------------------------ */

export type CertificationFindings = {
  certificationDecision: CertificationDecision;
  componentStatusMatrix: ComponentStatusRow[];
  risks: string[];
  outstandingFindings: string[];
  confidenceScore: number;
};

export type LocalBusinessCertificationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LocalBusinessCertificationReport = {
  reportId: string;
  timestamp: string;
  factoryName: string;
  certificationScope: Q7MissionId[];
  componentStatusMatrix: ComponentStatusRow[];
  deliverableVerification: DeliverableVerification;
  integrationVerification: IntegrationVerification;
  productionReadiness: ProductionReadiness;
  governanceCompliance: GovernanceCompliance;
  operationalReadiness: OperationalReadiness;
  workflowCompleteness: WorkflowCompleteness;
  reportingCapability: ReportingCapability;
  launchPackContractConsumed: LaunchPackContractConsumption;
  risks: string[];
  outstandingFindings: string[];
  certificationDecision: CertificationDecision;
  auditStatus: AuditStatus;
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  validation: LocalBusinessCertificationValidationReport;
  runTimestamp: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveCertificationAuditHistory: true;
  neverFabricateVerificationResults: true;
  neverCertifyUnsupportedFunctionality: true;
  neverImplementMissingFunctionality: true;
  neverAutoCorrectFailedImplementations: true;
  neverOverrideGovernance: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ801OrLater: true;
  /** This is the final Q7 acceptance gate; no Q8 consumable contract is implemented or required here. */
  finalQ7Gate: true;
  consumableByFutureSeries: false;
};

export type LbcInput = {
  reportId?: string | null;
  factoryName?: string | null;
  missionId?: string | null;
  /** Explicit, non-fabricated deferral — never inferred. */
  deferredMissionIds?: Q7MissionId[];
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  fabricateVerificationResults?: boolean;
  certifyUnsupportedFunctionality?: boolean;
  implementMissingFunctionality?: boolean;
  autoCorrectFailedImplementations?: boolean;
  overrideGovernance?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ801OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type LbcEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-LBC-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LocalBusinessCertificationCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastCertificationDecision: CertificationDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type LbcCatalog = {
  reportVersion: string;
  workerId: string;
  reports: LocalBusinessCertificationReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateVerificationResults: true;
  neverCertifyUnsupportedFunctionality: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ801OrLater: true;
  finalQ7Gate: true;
};

export type LocalBusinessCertificationState = {
  engineVersion: "PILLOW-LBC-001";
  missionId: "Q7-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: LocalBusinessCertificationConfiguration;
  latestReport: LocalBusinessCertificationReport | null;
  engineRecord: LbcEngineRecord | null;
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

export type LocalBusinessCertificationCockpitSnapshot = {
  missionId: "Q7-11";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastCertificationDecision: CertificationDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  componentStatusOptions: ComponentStatus[];
  neverFabricateVerificationResults: true;
  neverCertifyUnsupportedFunctionality: true;
  neverImplementMissingFunctionality: true;
  neverAutoCorrectFailedImplementations: true;
  neverOverrideGovernance: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ801OrLater: true;
  finalQ7Gate: true;
};
