/** PILLOW-CIE-001 — Customer Identity Engine types (R4-01). */

import type {
  CIE_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  IDENTIFIER_TYPES,
  IDENTITY_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CustomerIdentityEngineConfiguration } from "./configuration.js";

export type CustomerIdentityEngineVersion = "PILLOW-CIE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type IdentityStatus = (typeof IDENTITY_STATUSES)[number];
export type IdentifierType = (typeof IDENTIFIER_TYPES)[number];
export type CieCapability = (typeof CIE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CustomerIdentifier = {
  identifierType: IdentifierType;
  identifierValue: string;
  channel: string | null;
};

export type CustomerIdentityEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CieCapability[];
  metadataVersion: string;
};

export type CustomerIdentityRecord = {
  customerId: string;
  timestamp: string;
  customerIdentifiers: CustomerIdentifier[];
  customerName: string | null;
  contactReferences: string[];
  marketplaceReferences: string[];
  communicationReferences: string[];
  identityStatus: IdentityStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type DuplicateIdentityMatch = {
  matchId: string;
  timestamp: string;
  customerId: string;
  matchedCustomerId: string;
  matchReason: string;
  confidenceScore: number;
  metadataVersion: string;
};

export type IdentityValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CustomerIdentityRunReport = {
  identityRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_identity"
    | "link_identity"
    | "detect_duplicates"
    | "merge_identities"
    | "resolve_identity";
  engineRecord: CustomerIdentityEngineRecord;
  customerRecords: CustomerIdentityRecord[];
  duplicateMatches: DuplicateIdentityMatch[];
  validation: IdentityValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CustomerIdentityHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: IdentityValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCustomerRecords: number;
  activeIdentities: number;
  mergedIdentities: number;
  notes: string[];
};

export type CustomerIdentityPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  identitiesCreated: number;
  identitiesLinked: number;
  duplicatesDetected: number;
  identitiesMerged: number;
  identitiesResolved: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CustomerIdentityCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: IdentityValidationReport["decision"] | null;
  totalCustomerRecords: number;
  activeIdentities: number;
  recentLogs: string[];
};

export type CieLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectCustomerIdentityEngineInput = {
  forceReconnect?: boolean;
};

export type CreateCustomerIdentityInput = {
  customerName?: string;
  customerIdentifiers?: CustomerIdentifier[];
  contactReferences?: string[];
  marketplaceReferences?: string[];
  communicationReferences?: string[];
};

export type LinkCustomerIdentityInput = {
  customerId: string;
  channel: string;
  reference: string;
  identifierType?: IdentifierType;
  identifierValue?: string;
};

export type DetectDuplicateIdentitiesInput = {
  customerId?: string;
};

export type MergeCustomerIdentitiesInput = {
  sourceCustomerId: string;
  targetCustomerId: string;
  forceMerge?: boolean;
};

export type ResolveCustomerIdentityInput = {
  identifierType: IdentifierType;
  identifierValue: string;
};

export type CustomerIdentityEngineState = {
  engineVersion: CustomerIdentityEngineVersion;
  missionId: "R4-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: CustomerIdentityEngineConfiguration;
  latestReport: CustomerIdentityRunReport | null;
  engineRecord: CustomerIdentityEngineRecord | null;
  health: CustomerIdentityHealthReport;
  performance: CustomerIdentityPerformanceStats;
};
