import type { MemoryRuntimeConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  GOVERNANCE_CLASSES,
  INTEGRATION_TARGETS,
  MEMRT_CAPABILITIES,
  MEMORY_TYPES,
  RETENTION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type MemoryType = (typeof MEMORY_TYPES)[number];
export type GovernanceClassification = (typeof GOVERNANCE_CLASSES)[number];
export type RetentionStatus = (typeof RETENTION_STATUSES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type MemrtCapability = (typeof MEMRT_CAPABILITIES)[number];

export type MemoryVersion = {
  versionId: string;
  memoryId: string;
  versionNumber: number;
  contentRef: string;
  summary: string;
  createdAt: string;
  supersedesVersion: number | null;
  parentMemoryId: string | null;
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type MemoryEntry = {
  memoryId: string;
  memoryType: MemoryType;
  factory: string | null;
  worker: string | null;
  missionId: string | null;
  sessionId: string | null;
  contextId: string | null;
  sourceRef: string | null;
  contentRef: string;
  summary: string;
  tags: string[];
  governanceClassification: GovernanceClassification;
  retentionStatus: RetentionStatus;
  currentVersion: number;
  versions: MemoryVersion[];
  parentMemoryId: string | null;
  createdAt: string;
  updatedAt: string;
  lastAccessAt: string | null;
  highRisk: boolean;
  pillowConfirmed: boolean;
  grandKingApproved: boolean;
  traceabilityRefs: string[];
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type ContextBundle = {
  bundleId: string;
  worker: string | null;
  factory: string | null;
  missionId: string | null;
  sessionId: string | null;
  contextId: string | null;
  operationalMemories: MemoryEntry[];
  decisionHistory: MemoryEntry[];
  previousResults: MemoryEntry[];
  runtimeContext: MemoryEntry[];
  assembledAt: string;
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type RetrievalQuery = {
  memoryType?: MemoryType;
  factory?: string;
  worker?: string;
  missionId?: string;
  sessionId?: string;
  contextId?: string;
  tag?: string;
  text?: string;
};

export type RetrievalResult = {
  queryId: string;
  query: RetrievalQuery;
  matches: MemoryEntry[];
  matchCount: number;
  retrievedAt: string;
  deterministicOrdering: true;
};

export type MemoryHealth = {
  status: EngineHealthStatus;
  healthScore: number;
  totalEntries: number;
  activeEntries: number;
  archivedEntries: number;
  totalVersions: number;
  notes: string[];
};

export type DecisionHistorySummary = {
  totalDecisions: number;
  byMission: Record<string, number>;
  latestDecisionAt: string | null;
};

export type PreviousResultSummary = {
  totalResults: number;
  byWorker: Record<string, number>;
  latestResultAt: string | null;
};

export type VersionSummary = {
  totalVersions: number;
  entriesWithMultipleVersions: number;
  maxVersionNumber: number;
};

export type RetrievalStatistics = {
  totalQueries: number;
  totalRetrievals: number;
  lastRetrievalAt: string | null;
  averageMatchCount: number;
};

export type MemoryRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  memoryInventory: MemoryEntry[];
  activeContexts: ContextBundle[];
  decisionHistorySummary: DecisionHistorySummary;
  previousResultSummary: PreviousResultSummary;
  retrievalStatistics: RetrievalStatistics;
  versionSummary: VersionSummary;
  memoryHealth: MemoryHealth;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1006: boolean;
  neverReplaceEkls: true;
  neverReplaceApplicationDatabases: true;
  neverModifyHistoricalRecords: true;
  neverFabricateMemory: true;
  neverSilentlyOverwriteHistoricalDecisions: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1006OrLater: true;
  preserveCompleteTraceability: true;
  preserveHistoricalMemory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  deterministicRetrievalOnly: true;
};

export type Q1006ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "memory-runtime";
  missionId: "Q10-05";
  consumerMissionId: "Q10-06";
  exposedFields: string[];
  memoryTypeCatalog: string[];
  governanceClassCatalog: string[];
  notes: string[];
  neverImplementQ1006OrLater: true;
  structuralSignalOnly: true;
};

export type MemrtInput = {
  memoryType?: MemoryType;
  factory?: string;
  worker?: string;
  missionId?: string;
  sessionId?: string;
  contextId?: string;
  sourceRef?: string;
  contentRef?: string;
  summary?: string;
  tags?: string[];
  governanceClassification?: GovernanceClassification;
  parentMemoryId?: string;
  memoryId?: string;
  query?: RetrievalQuery;
  highRisk?: boolean;
  pillowConfirmed?: boolean;
  grandKingApproved?: boolean;
  validated?: boolean;
  forceFail?: boolean;
  fabricateMemory?: boolean;
  replaceEkls?: boolean;
  replaceApplicationDatabases?: boolean;
  modifyHistoricalRecords?: boolean;
  silentlyOverwriteHistoricalDecisions?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1006OrLater?: boolean;
  targetMissionId?: string | null;
};

export type MemrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MemrtRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: MemrtValidationReport;
  memory: MemoryEntry | null;
  contextBundle: ContextBundle | null;
  retrievalResult: RetrievalResult | null;
  memoryRuntimeReport: MemoryRuntimeReport | null;
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type MemrtEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalEntries: number;
  totalVersions: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: MemrtCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type MemrtDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalEntries: number;
  totalVersions: number;
  totalQueries: number;
  totalReports: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type MemoryRuntimeState = {
  engineVersion: "PILLOW-MEMRT-001";
  missionId: "Q10-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: MemoryRuntimeConfiguration;
  latestReport: MemrtRunReport | null;
  engineRecord: MemrtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalEntries: number;
    totalVersions: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type MemoryRuntimeCockpitSnapshot = {
  missionId: "Q10-05";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalEntries: number;
  totalVersions: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverReplaceEkls: true;
  neverReplaceApplicationDatabases: true;
  neverModifyHistoricalRecords: true;
  neverFabricateMemory: true;
  neverSilentlyOverwriteHistoricalDecisions: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1006OrLater: true;
  structuralSignalOnly: true;
};
