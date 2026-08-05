import type { ProductionCertificationCoreConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CERTIFICATION_DECISIONS,
  CERTIFICATION_STATUSES,
  COMPONENT_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PCCRT_CAPABILITIES,
  PROGRAMME_CATALOG,
  Q10_RUNTIME_IDS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type ComponentType = (typeof COMPONENT_TYPES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type PccrtCapability = (typeof PCCRT_CAPABILITIES)[number];
export type ProgrammeDefinition = (typeof PROGRAMME_CATALOG)[number];
export type ProgrammeId = ProgrammeDefinition["programmeId"];
export type Q10RuntimeRef = (typeof Q10_RUNTIME_IDS)[number];
export type Q10RuntimeMissionId = Q10RuntimeRef["missionId"];

export type WorkerHandle = object;

export type WorkerProbeResult = {
  workerKey: string;
  reachable: boolean;
  evidence: string;
  error?: string;
};

/* ------------------------------------------------------------------------ */
/* Discovery — factories / workers / runtimes. Never invented.              */
/* ------------------------------------------------------------------------ */

export type DiscoveredFactory = {
  factoryKey: string;
  injected: boolean;
  repositoryEvidence: boolean;
  evidence: string;
};

export type FactoryDiscoveryResult = {
  discoveredAt: string;
  source: "injected" | "repository" | "none";
  totalCatalog: number;
  discoveredCount: number;
  factories: DiscoveredFactory[];
  evidence: string[];
};

export type DiscoveredWorker = {
  workerId: string;
  workerName: string | null;
  evidence: string;
};

export type WorkerDiscoveryResult = {
  discoveredAt: string;
  registryInjected: boolean;
  discoveredCount: number;
  seedWorkerCount: number;
  workers: DiscoveredWorker[];
  evidence: string[];
};

export type DiscoveredRuntime = {
  missionId: Q10RuntimeMissionId;
  runtimeName: string;
  injected: boolean;
  reachable: boolean;
  repositoryEvidence: boolean;
  evidence: string;
};

export type RuntimeDiscoveryResult = {
  discoveredAt: string;
  totalCatalog: number;
  discoveredCount: number;
  runtimes: DiscoveredRuntime[];
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Programme registration + requirements                                    */
/* ------------------------------------------------------------------------ */

export type ProgrammeRegistration = {
  programmeId: ProgrammeId;
  programmeName: string;
  componentType: ComponentType;
  description: string;
  requiredEvidenceRefs: string[];
  registeredAt: string;
};

/* ------------------------------------------------------------------------ */
/* Certification evidence model (mandatory fields per Q11-01 mandate)       */
/* ------------------------------------------------------------------------ */

export type CertificationResult = {
  certificationId: string;
  programmeId: ProgrammeId;
  componentId: string;
  componentType: ComponentType;
  certificationStatus: CertificationStatus;
  readinessScore: number;
  evidenceReferences: string[];
  validationResults: string[];
  failedChecks: string[];
  passedChecks: string[];
  outstandingIssues: string[];
  auditReference: string;
  certificationTimestamp: string;
};

/* ------------------------------------------------------------------------ */
/* Governance / reporting / integration dimensions                          */
/* ------------------------------------------------------------------------ */

export type GovernanceResults = {
  compliant: boolean;
  grandKingApprovalRequired: true;
  pillowCommandRequired: true;
  selfDocPresent: boolean;
  selfDocPath: string;
  boundaryLocksHonoured: boolean;
  evidence: string[];
};

export type ReportingResults = {
  verified: boolean;
  executiveReportingAvailable: boolean;
  evidence: string[];
};

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

export type Q1101ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type ReadinessSummary = {
  computedAt: string;
  totalItems: number;
  certifiedCount: number;
  partiallyCertifiedCount: number;
  failedCount: number;
  blockedCount: number;
  deferredCount: number;
  registeredCount: number;
  discoveredCount: number;
  pendingCount: number;
  overallReadinessScore: number;
  ready: boolean;
  notes: string[];
  evidence: string[];
};

export type FactorySummary = {
  totalCatalog: number;
  discoveredCount: number;
  evidence: string[];
};

export type WorkerSummary = {
  discoveredCount: number;
  registryInjected: boolean;
  evidence: string[];
};

export type RuntimeSummary = {
  totalCatalog: number;
  discoveredCount: number;
  evidence: string[];
};

export type EvidenceSummary = {
  totalRows: number;
  byComponentType: Record<string, number>;
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Certification findings + full report                                     */
/* ------------------------------------------------------------------------ */

export type CertificationFindings = {
  certificationDecision: CertificationDecision;
  certificationResults: CertificationResult[];
  risks: string[];
  outstandingIssues: string[];
  confidenceScore: number;
};

export type PccrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProductionCertificationReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: "Q11-PCCRT-v1";
  certificationScope: ProgrammeId[];
  factorySummary: FactorySummary;
  workerSummary: WorkerSummary;
  runtimeSummary: RuntimeSummary;
  governanceSummary: GovernanceResults;
  readinessSummary: ReadinessSummary;
  evidenceSummary: EvidenceSummary;
  failedItems: string[];
  outstandingRisks: string[];
  auditStatus: AuditStatus;
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  certificationDecision: CertificationDecision;
  validation: PccrtValidationReport;
  consumableByQ1102: boolean;
  neverImplementQ1102OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  finalQ11CoreGate: true;
  q1101ContractConsumed: Q1101ContractConsumption;
  programmeInventory: ProgrammeRegistration[];
  certificationResults: CertificationResult[];
  reportingSummary: ReportingResults;
  integrationSummary: IntegrationVerification;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveImmutableCertificationHistory: true;
  preserveCertificationHistory: true;
  preserveAuditHistory: true;
  deterministicCertification: true;
  maskSensitiveValues: true;
  neverFabricateCertificationEvidence: true;
  neverCertifyMissingCapabilities: true;
  neverAssumeImplementation: true;
  neverImplementMissingCapabilities: true;
  neverModifyProductionLogic: true;
  neverReplaceIndividualAuditProgrammes: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type PccrtInput = {
  reportId?: string | null;
  missionId?: string | null;
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  fabricateCertificationEvidence?: boolean;
  forceFail?: boolean;
  certifyMissingCapabilities?: boolean;
  assumeImplementation?: boolean;
  implementMissingCapabilities?: boolean;
  modifyProductionLogic?: boolean;
  replaceIndividualAuditProgrammes?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1102OrLater?: boolean;
};

export type PccrtRunReport = ProductionCertificationReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type PccrtEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PCCRT-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PccrtCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastCertificationDecision: CertificationDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type PccrtCatalog = {
  reportVersion: string;
  workerId: string;
  reports: ProductionCertificationReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateCertificationEvidence: true;
  neverAssumeImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1102OrLater: true;
  firstQ11Gate: true;
};

/** Q11-01's own exposed contract — consumed by Q11-02 (Worker Readiness Audit). */
export type Q1102ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "production-certification-core";
  missionId: "Q11-01";
  consumerMissionId: "Q11-02";
  exposedFields: string[];
  programmeCatalog: string[];
  certificationStatusCatalog: string[];
  certificationDecisionCatalog: string[];
  notes: string[];
  neverImplementQ1102OrLater: true;
  structuralSignalOnly: true;
};

export type ProductionCertificationCoreState = {
  engineVersion: "PILLOW-PCCRT-001";
  missionId: "Q11-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProductionCertificationCoreConfiguration;
  latestReport: ProductionCertificationReport | null;
  engineRecord: PccrtEngineRecord | null;
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

export type ProductionCertificationCoreCockpitSnapshot = {
  missionId: "Q11-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastCertificationDecision: CertificationDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  certificationStatusOptions: CertificationStatus[];
  programmeIds: ProgrammeId[];
  neverFabricateCertificationEvidence: true;
  neverCertifyMissingCapabilities: true;
  neverAssumeImplementation: true;
  neverImplementMissingCapabilities: true;
  neverModifyProductionLogic: true;
  neverReplaceIndividualAuditProgrammes: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1102OrLater: true;
  firstQ11Gate: true;
};
