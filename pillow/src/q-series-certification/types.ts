import type { QSeriesCertificationConfiguration } from "./configuration.js";
import type {
  CERTIFICATION_CLASSIFICATIONS,
  CERTIFICATION_DECISIONS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  Q11_AUDIT_SOURCES,
  Q11_CERTIFICATION_SOURCES,
  QSCRT_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CertificationClassification = (typeof CERTIFICATION_CLASSIFICATIONS)[number];
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number];
export type Q11AuditSource = (typeof Q11_AUDIT_SOURCES)[number];
export type Q11CertificationSource = (typeof Q11_CERTIFICATION_SOURCES)[number];
export type QscrtCapability = (typeof QSCRT_CAPABILITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];

export type QscrtHandle = object;

/** LOCKED QSeriesCertification model fields. */
export type QSeriesCertificationRecord = {
  certificationId: string;
  factoryId: string;
  workerSummary: WorkerVerificationSummary;
  runtimeSummary: RuntimeVerificationSummary;
  integrationStatus: IntegrationVerificationSummary;
  governanceStatus: GovernanceVerificationSummary;
  productionStatus: ProductionReadinessVerification;
  certificationStatus: CertificationClassification;
  readinessScore: number;
  supportingEvidence: string[];
  auditReference: string;
  certificationTimestamp: string;
};

export type FactoryDiscoverySummary = {
  computedAt: string;
  totalDiscovered: number;
  catalogTotal: number;
  factories: Array<{ factoryKey: string; status: string; classification: CertificationClassification }>;
  evidence: string[];
};

export type WorkerVerificationSummary = {
  computedAt: string;
  totalWorkers: number;
  verifiedCount: number;
  failedCount: number;
  missingCount: number;
  classification: CertificationClassification;
  evidence: string[];
};

export type RuntimeVerificationSummary = {
  computedAt: string;
  runtimesChecked: number;
  boundCount: number;
  healthyCount: number;
  failedCount: number;
  missingCount: number;
  classification: CertificationClassification;
  runtimes: Array<{ runtimeId: string; bound: boolean; status: string; classification: CertificationClassification }>;
  evidence: string[];
};

export type IntegrationVerificationSummary = {
  computedAt: string;
  structuralSignalPresent: boolean;
  orchestrationBound: boolean;
  classification: CertificationClassification;
  evidence: string[];
};

export type GovernanceVerificationSummary = {
  computedAt: string;
  pccrtClassification: CertificationClassification;
  auditClassifications: Record<Q11AuditSource, CertificationClassification>;
  gkDecision: string;
  gkAuthorisation: string;
  gkAuthorised: boolean;
  classification: CertificationClassification;
  evidence: string[];
};

export type ProductionReadinessVerification = {
  computedAt: string;
  eaprtDecision: CertificationDecision | null;
  eaprtClassification: CertificationClassification;
  gkAuthorised: boolean;
  plmrtProductionActive: boolean;
  finartConsumable: boolean;
  classification: CertificationClassification;
  evidence: string[];
};

export type AuditEvidenceRef = {
  source: Q11AuditSource;
  bound: boolean;
  reportId: string | null;
  classification: CertificationClassification;
  evidence: string[];
};

export type CertificationEvidenceRef = {
  source: Q11CertificationSource;
  bound: boolean;
  reportId: string | null;
  classification: CertificationClassification;
  evidence: string[];
};

export type AggregatedCertificationEvidence = {
  computedAt: string;
  auditRefs: AuditEvidenceRef[];
  certificationRefs: CertificationEvidenceRef[];
  finartMissing: boolean;
  certifiedCount: number;
  failedCount: number;
  missingCount: number;
  blockedCount: number;
  evidence: string[];
};

export type QSeriesReadinessClassification = {
  computedAt: string;
  overallClassification: CertificationClassification;
  readinessScore: number;
  rationale: string[];
  evidence: string[];
};

export type Q1112ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type QscrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** LOCKED QSeriesCertificationReport minimum + CRT extras. */
export type QSeriesCertificationReport = {
  reportId: string;
  timestamp: string;
  certificationVersion: typeof import("./paths.js").Q_SERIES_CERTIFICATION_RUNTIME_VERSION;
  engineId: "PILLOW-QSCRT-001";
  missionId: "Q11-12";
  factorySummary: FactoryDiscoverySummary;
  workerSummary: WorkerVerificationSummary;
  runtimeSummary: RuntimeVerificationSummary;
  integrationSummary: IntegrationVerificationSummary;
  governanceSummary: GovernanceVerificationSummary;
  productionReadinessSummary: ProductionReadinessVerification;
  certificationDecision: CertificationDecision;
  supportingEvidence: string[];
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  assessments: QSeriesCertificationRecord[];
  q1112ContractConsumed: Q1112ContractConsumption;
  consumableByQ1113: boolean;
  neverImplementQ1113OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  validation: QscrtValidationReport;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveCertificationHistory: true;
  preserveAuditHistory: true;
  deterministicCertificationBehaviour: true;
  maskSensitiveValues: true;
  neverFabricateCertificationEvidence: true;
  neverCertifyMissingFunctionality: true;
  neverBypassGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type QscrtInput = {
  reportId?: string | null;
  missionId?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateCertificationEvidence?: boolean;
  certifyMissing?: boolean;
  bypassGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1113OrLater?: boolean;
  forceCertify?: boolean;
  forceFail?: boolean;
  deferCertification?: boolean;
};

export type QscrtRunReport = QSeriesCertificationReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type QscrtEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-QSCRT-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: QscrtCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastCertificationDecision: CertificationDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type QscrtCatalog = {
  reportVersion: string;
  workerId: string;
  reports: QSeriesCertificationReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  neverFabricateCertificationEvidence: true;
  neverImplementQ1113OrLater: true;
};

/** Q11-12 exposed contract — consumed by Q11-13 Q Series Complete (structural only). */
export type Q1113ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "q-series-certification";
  missionId: "Q11-12";
  consumerMissionId: "Q11-13";
  exposedFields: string[];
  certificationClassificationCatalog: string[];
  certificationDecisionCatalog: string[];
  notes: string[];
  neverImplementQ1113OrLater: true;
  structuralSignalOnly: true;
};

export type QSeriesCertificationState = {
  engineVersion: "PILLOW-QSCRT-001";
  missionId: "Q11-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: QSeriesCertificationConfiguration;
  latestReport: QSeriesCertificationReport | null;
  engineRecord: QscrtEngineRecord | null;
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

export type QSeriesCertificationCockpitSnapshot = {
  missionId: "Q11-12";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastCertificationDecision: CertificationDecision | null;
  workerId: string;
  neverFabricateCertificationEvidence: true;
  neverCertifyMissingFunctionality: true;
  neverBypassGovernance: true;
  neverImplementQ1113OrLater: true;
};

export type CertificationHistoryEntry = {
  entryId: string;
  timestamp: string;
  reportId: string | null;
  certificationDecision: CertificationDecision;
  overallClassification: CertificationClassification;
  evidence: string[];
};
