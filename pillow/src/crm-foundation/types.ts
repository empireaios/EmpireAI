/** PILLOW-CRM-001 — CRM Foundation types (R4-02). */

import type {
  CRM_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LIFECYCLE_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CrmFoundationConfiguration } from "./configuration.js";

export type CrmFoundationVersion = "PILLOW-CRM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];
export type CrmCapability = (typeof CRM_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CustomerContactInfo = {
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type CustomerNote = {
  noteId: string;
  timestamp: string;
  author: string;
  content: string;
};

export type CustomAttribute = {
  key: string;
  value: string;
};

export type CrmEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CrmCapability[];
  identityEngineConnected: boolean;
  metadataVersion: string;
};

export type CrmRecord = {
  crmRecordId: string;
  timestamp: string;
  customerId: string;
  customerProfileReference: string;
  customerLifecycleStatus: LifecycleStatus;
  customerOwner: string | null;
  customerTags: string[];
  customerNotes: CustomerNote[];
  customAttributes: CustomAttribute[];
  customerAccountRefs: string[];
  contactInformation: CustomerContactInfo;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type CrmValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CrmSearchResult = {
  resultId: string;
  timestamp: string;
  crmRecordId: string;
  customerId: string;
  matchReason: string;
  relevanceScore: number;
  metadataVersion: string;
};

export type CrmRunReport = {
  crmRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_profile"
    | "update_record"
    | "search_customers"
    | "add_note"
    | "update_tags"
    | "update_attributes";
  engineRecord: CrmEngineRecord;
  crmRecords: CrmRecord[];
  searchResults: CrmSearchResult[];
  validation: CrmValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CrmHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CrmValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCrmRecords: number;
  activeCustomers: number;
  notes: string[];
};

export type CrmPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  profilesCreated: number;
  recordsUpdated: number;
  searchesPerformed: number;
  notesAdded: number;
  tagsUpdated: number;
  attributesUpdated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CrmCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: CrmValidationReport["decision"] | null;
  totalCrmRecords: number;
  activeCustomers: number;
  identityEngineConnected: boolean;
  recentLogs: string[];
};

export type CrmLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectCrmFoundationInput = {
  forceReconnect?: boolean;
};

export type CreateCustomerProfileInput = {
  customerId: string;
  customerOwner?: string;
  customerLifecycleStatus?: LifecycleStatus;
  customerTags?: string[];
  customerAccountRefs?: string[];
  contactInformation?: Partial<CustomerContactInfo>;
  customAttributes?: CustomAttribute[];
};

export type UpdateCrmRecordInput = {
  crmRecordId: string;
  customerOwner?: string;
  customerLifecycleStatus?: LifecycleStatus;
  customerAccountRefs?: string[];
  contactInformation?: Partial<CustomerContactInfo>;
};

export type SearchCustomerRecordsInput = {
  query: string;
  searchBy?: "all" | "customerId" | "owner" | "tags" | "email" | "phone";
  limit?: number;
};

export type AddCustomerNoteInput = {
  crmRecordId: string;
  author: string;
  content: string;
};

export type UpdateCustomerTagsInput = {
  crmRecordId: string;
  tags: string[];
  mode?: "replace" | "append";
};

export type UpdateCustomAttributesInput = {
  crmRecordId: string;
  attributes: CustomAttribute[];
  mode?: "replace" | "merge";
};

export type CrmFoundationState = {
  engineVersion: CrmFoundationVersion;
  missionId: "R4-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: CrmFoundationConfiguration;
  latestReport: CrmRunReport | null;
  engineRecord: CrmEngineRecord | null;
  health: CrmHealthReport;
  performance: CrmPerformanceStats;
};
