/** PILLOW-CTE-001 — Customer Timeline Engine types (R4-03). */

import type {
  CTE_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  EVENT_SOURCES,
  EVENT_STATUSES,
  EVENT_TYPES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CustomerTimelineEngineConfiguration } from "./configuration.js";

export type CustomerTimelineEngineVersion = "PILLOW-CTE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type EventSource = (typeof EVENT_SOURCES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type CteCapability = (typeof CTE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type TimelineEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CteCapability[];
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  metadataVersion: string;
};

export type TimelineRecord = {
  timelineRecordId: string;
  timestamp: string;
  customerId: string;
  eventType: EventType;
  eventSource: EventSource;
  eventReference: string;
  eventDescription: string;
  eventStatus: EventStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type TimelineValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TimelineSearchResult = {
  resultId: string;
  timestamp: string;
  timelineRecordId: string;
  customerId: string;
  matchReason: string;
  relevanceScore: number;
  metadataVersion: string;
};

export type TimelineRunReport = {
  timelineRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "record_event"
    | "record_interaction"
    | "record_purchase"
    | "record_support"
    | "record_communication"
    | "record_account_change"
    | "record_milestone"
    | "search_timeline";
  engineRecord: TimelineEngineRecord;
  timelineRecords: TimelineRecord[];
  searchResults: TimelineSearchResult[];
  validation: TimelineValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TimelineHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: TimelineValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalTimelineRecords: number;
  uniqueCustomers: number;
  notes: string[];
};

export type TimelinePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  eventsRecorded: number;
  interactionsRecorded: number;
  purchasesRecorded: number;
  supportActivitiesRecorded: number;
  communicationsRecorded: number;
  accountChangesRecorded: number;
  milestonesRecorded: number;
  searchesPerformed: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type TimelineCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: TimelineValidationReport["decision"] | null;
  totalTimelineRecords: number;
  uniqueCustomers: number;
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  recentLogs: string[];
};

export type CteLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectCustomerTimelineEngineInput = {
  forceReconnect?: boolean;
};

export type RecordTimelineEventInput = {
  customerId: string;
  eventType: EventType;
  eventSource: EventSource;
  eventReference: string;
  eventDescription: string;
  eventStatus?: EventStatus;
};

export type RecordCustomerInteractionInput = {
  customerId: string;
  eventReference: string;
  eventDescription: string;
  eventSource?: EventSource;
};

export type RecordPurchaseInput = {
  customerId: string;
  eventReference: string;
  eventDescription: string;
  eventSource?: EventSource;
};

export type RecordSupportActivityInput = {
  customerId: string;
  eventReference: string;
  eventDescription: string;
  eventSource?: EventSource;
};

export type RecordCommunicationInput = {
  customerId: string;
  eventReference: string;
  eventDescription: string;
  eventSource?: EventSource;
};

export type RecordAccountChangeInput = {
  customerId: string;
  eventReference: string;
  eventDescription: string;
  eventSource?: EventSource;
};

export type RecordCustomerMilestoneInput = {
  customerId: string;
  eventReference: string;
  eventDescription: string;
  eventSource?: EventSource;
};

export type SearchTimelineHistoryInput = {
  query: string;
  customerId?: string;
  eventType?: EventType;
  limit?: number;
};

export type CustomerTimelineEngineState = {
  engineVersion: CustomerTimelineEngineVersion;
  missionId: "R4-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: CustomerTimelineEngineConfiguration;
  latestReport: TimelineRunReport | null;
  engineRecord: TimelineEngineRecord | null;
  health: TimelineHealthReport;
  performance: TimelinePerformanceStats;
};
