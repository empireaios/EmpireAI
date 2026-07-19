/** PILLOW-TME-001 — Ticket Management Engine types (R4-09). */

import type {
  TME_CAPABILITIES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  RESOLUTION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { TicketManagementEngineConfiguration } from "./configuration.js";

export type TicketManagementEngineVersion = "PILLOW-TME-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];
export type TmeCapability = (typeof TME_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type TicketEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: TmeCapability[];
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  liveChatIntegrationConnected: boolean;
  aiCustomerSupportConnected: boolean;
  metadataVersion: string;
};

export type TicketRecord = {
  ticketId: string;
  timestamp: string;
  customerId: string;
  conversationReference: string;
  ticketCategory: TicketCategory;
  ticketPriority: TicketPriority;
  assignedOwner: string | null;
  currentStatus: TicketStatus;
  resolutionStatus: ResolutionStatus;
  relatedTimelineReference: string | null;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type TicketFailure = {
  failureId: string;
  timestamp: string;
  ticketId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type TicketValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TicketRunReport = {
  ticketRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_ticket"
    | "classify_category"
    | "assign_priority"
    | "assign_ownership"
    | "track_lifecycle"
    | "link_customer"
    | "link_conversation"
    | "link_timeline"
    | "detect_overdue"
    | "detect_stalled"
    | "detect_failures";
  engineRecord: TicketEngineRecord;
  ticketRecords: TicketRecord[];
  failures: TicketFailure[];
  validation: TicketValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TicketHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: TicketValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalTickets: number;
  openTickets: number;
  assignedTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  stalledTickets: number;
  failedTickets: number;
  notes: string[];
};

export type TicketPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  ticketsCreated: number;
  categoriesClassified: number;
  prioritiesAssigned: number;
  ownershipAssigned: number;
  lifecycleUpdates: number;
  customerLinks: number;
  conversationLinks: number;
  timelineLinks: number;
  overdueDetected: number;
  stalledDetected: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type TicketCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: TicketValidationReport["decision"] | null;
  totalTickets: number;
  openTickets: number;
  assignedTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  stalledTickets: number;
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  aiCustomerSupportConnected: boolean;
  recentLogs: string[];
};

export type TmeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectTicketManagementEngineInput = {
  forceReconnect?: boolean;
};

export type CreateSupportTicketInput = {
  customerId: string;
  subject: string;
  description: string;
  conversationReference?: string;
  aiSupportRecordId?: string;
};

export type ClassifyTicketCategoryInput = {
  ticketId: string;
  subject?: string;
  description?: string;
};

export type AssignTicketPriorityInput = {
  ticketId: string;
  priority?: TicketPriority;
};

export type AssignTicketOwnershipInput = {
  ticketId: string;
  ownerId: string;
};

export type TrackTicketLifecycleInput = {
  ticketId: string;
  status: TicketStatus;
  resolutionStatus?: ResolutionStatus;
};

export type LinkTicketToCustomerInput = {
  ticketId: string;
  customerId: string;
};

export type LinkTicketToConversationInput = {
  ticketId: string;
  conversationReference: string;
};

export type LinkTicketToTimelineInput = {
  ticketId: string;
};

export type DetectOverdueTicketsInput = {
  ticketId?: string;
};

export type DetectStalledTicketsInput = {
  ticketId?: string;
};

export type DetectTicketFailuresInput = {
  ticketId?: string;
};

export type TicketManagementEngineState = {
  engineVersion: TicketManagementEngineVersion;
  missionId: "R4-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: TicketManagementEngineConfiguration;
  latestReport: TicketRunReport | null;
  engineRecord: TicketEngineRecord | null;
  health: TicketHealthReport;
  performance: TicketPerformanceStats;
};
