import type { AuditRuntimeConfiguration } from "./configuration.js";
import type {
  AUDIT_CATEGORIES,
  AUDIT_STATUSES,
  AUDRT_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  INTEGRITY_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];
export type IntegrityStatus = (typeof INTEGRITY_STATUSES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type AudrtCapability = (typeof AUDRT_CAPABILITIES)[number];

export type AuditRecord = {
  auditRecordId: string;
  eventId: string;
  timestamp: string;
  runtimeComponent: string;
  factoryId: string;
  workerId: string;
  missionId: string;
  actionPerformed: string;
  decision: string;
  currentStatus: string;
  supportingEvidence: string[];
  relatedRecords: string[];
  auditIntegrityStatus: IntegrityStatus;
  auditReference: string;
  category: AuditCategory;
  fabricated: false;
  structuralSignalOnly: true;
  integrityDigest: string;
  metadataVersion: string;
};

export type AuditQuery = {
  category?: AuditCategory | null;
  missionId?: string | null;
  workerId?: string | null;
  factoryId?: string | null;
  fromTimestamp?: string | null;
  toTimestamp?: string | null;
};

export type IntegrityVerificationResult = {
  verificationId: string;
  timestamp: string;
  totalChecked: number;
  verifiedCount: number;
  failedCount: number;
  tamperedSuspectedCount: number;
  pendingCount: number;
  allPassed: boolean;
  failedRecordIds: string[];
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type ActivitySummary = {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
};

export type EvidenceSummary = {
  totalEvidenceRefs: number;
  uniqueEvidenceRefs: number;
  attachmentCount: number;
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
};

export type AuditMetrics = {
  totalAuditRecords: number;
  workerActionCount: number;
  missionLifecycleCount: number;
  approvalCount: number;
  recoveryCount: number;
  schedulingCount: number;
  evidenceAttachmentCount: number;
  verifiedCount: number;
  totalReports: number;
};

export type AuditRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  totalAuditRecords: number;
  workerActivitySummary: ActivitySummary;
  missionActivitySummary: ActivitySummary;
  approvalSummary: ActivitySummary;
  recoverySummary: ActivitySummary;
  schedulingSummary: ActivitySummary;
  evidenceSummary: EvidenceSummary;
  integrityVerification: IntegrityVerificationResult;
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1014: boolean;
  neverFabricateAuditEvidence: true;
  neverDeleteAuditRecords: true;
  neverExecuteBusinessLogic: true;
  neverModifyOperationalData: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1014OrLater: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveImmutableAuditHistory: true;
  preserveAuditHistory: true;
  deterministicAuditRecording: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type Q1014ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "audit-runtime";
  missionId: "Q10-13";
  consumerMissionId: "Q10-14";
  exposedFields: string[];
  auditCategoryCatalog: string[];
  integrityStatusCatalog: string[];
  notes: string[];
  neverImplementQ1014OrLater: true;
  structuralSignalOnly: true;
};

export type AudrtInput = {
  auditRecordId?: string;
  eventId?: string;
  timestamp?: string;
  runtimeComponent?: string;
  factoryId?: string;
  workerId?: string;
  missionId?: string | null;
  actionPerformed?: string;
  decision?: string;
  currentStatus?: string;
  supportingEvidence?: string[];
  relatedRecords?: string[];
  auditReference?: string;
  category?: AuditCategory;
  evidenceRef?: string;
  evidenceRefs?: string[];
  query?: AuditQuery;
  now?: string;
  validated?: boolean;
  forceFail?: boolean;
  exposeSecrets?: boolean;
  fabricateAuditEvidence?: boolean;
  fabricateEvidence?: boolean;
  deleteAuditRecords?: boolean;
  executeBusinessLogic?: boolean;
  modifyOperationalData?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1014OrLater?: boolean;
  targetMissionId?: string | null;
  businessPayload?: unknown;
  operationalPayload?: unknown;
};

export type AudrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AudrtRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: AudrtValidationReport;
  record: AuditRecord | null;
  records: AuditRecord[];
  integrityVerification: IntegrityVerificationResult | null;
  auditRuntimeReport: AuditRuntimeReport | null;
  q1014Contract: Q1014ConsumableContract | null;
  integrationHandshakes: IntegrationHandshake[];
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type AudrtEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalAuditRecords: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: AudrtCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type AudrtDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalAuditRecords: number;
  totalReports: number;
  verifiedCount: number;
  failedIntegrityCount: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type AuditRuntimeState = {
  engineVersion: "PILLOW-AUDRT-001";
  missionId: "Q10-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: AuditRuntimeConfiguration;
  latestReport: AudrtRunReport | null;
  engineRecord: AudrtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalAuditRecords: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type AuditRuntimeCockpitSnapshot = {
  missionId: "Q10-13";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalAuditRecords: number;
  verifiedCount: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateAuditEvidence: true;
  neverDeleteAuditRecords: true;
  neverExecuteBusinessLogic: true;
  neverModifyOperationalData: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1014OrLater: true;
  structuralSignalOnly: true;
};
