import type { CrmReport, Q706ConsumableContract } from "../crm-worker/types.js";
import type { WhatsAppWorkerConfiguration } from "./configuration.js";
import type {
  AUTOMATION_STEP_TYPES,
  CONVERSATION_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_MODES,
  INTEGRATION_TARGETS,
  MESSAGE_DIRECTIONS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  WAW_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];
export type AutomationStepType = (typeof AUTOMATION_STEP_TYPES)[number];
export type EvidenceMode = (typeof EVIDENCE_MODES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type WhatsAppWorkerCapability = (typeof WAW_CAPABILITIES)[number];

export type { CrmReport, Q706ConsumableContract };

/** Deterministic fixture mirroring CrmReport shape for tests / offline WhatsApp. */
export type CrmFixture = {
  reportId?: string;
  businessProjectId?: string;
  customerId?: string;
  customerReference?: string;
  leadStatus?: string;
  customerLifecycleStage?: string;
  confidenceScore?: number;
  outstandingTasks?: string[];
};

export type DeliveryOutcome = {
  passed: boolean;
  observed: true;
  provider: "fixture" | "sandbox" | "live";
  reason: string;
  observedAt: string;
  transportMessageId: string | null;
};

export type MediaAttachment = {
  attachmentId: string;
  mediaType: string;
  urlOrRef: string;
  caption: string | null;
};

export type ReminderScheduleEntry = {
  reminderId: string;
  conversationId: string;
  scheduledAt: string;
  dueAt: string;
  purpose: string;
  status: "scheduled" | "sent" | "cancelled" | "failed";
  messageBody: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EscalationRecord = {
  escalationId: string;
  conversationId: string;
  escalatedAt: string;
  reason: string;
  assignedAgent: string | null;
  status: "open" | "acknowledged" | "resolved";
  notes: string;
};

export type Message = {
  messageId: string;
  conversationId: string;
  timestamp: string;
  direction: MessageDirection;
  body: string;
  templateId: string | null;
  deliveryStatus: "pending" | "delivered" | "failed" | "unknown" | "received";
  deliveryOutcome: DeliveryOutcome | null;
  evidenceMode: EvidenceMode;
  fabricated: false;
  mediaAttachments: MediaAttachment[];
  labels: string[];
  source: "inbound" | "outbound" | "template" | "workflow" | "reminder" | "system";
};

export type MessageTemplate = {
  templateId: string;
  name: string;
  body: string;
  category: string;
  language: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
};

export type AutomationStep = {
  stepId: string;
  stepType: AutomationStepType;
  executedAt: string;
  status: "completed" | "failed" | "skipped" | "pending";
  details: string;
  relatedMessageId: string | null;
  relatedTemplateId: string | null;
};

export type AutomationWorkflow = {
  workflowId: string;
  name: string;
  conversationId: string;
  steps: AutomationStep[];
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt: string | null;
};

export type Conversation = {
  conversationId: string;
  createdAt: string;
  updatedAt: string;
  businessProjectId: string;
  customerReference: string;
  status: ConversationStatus;
  assignedAgent: string | null;
  labels: string[];
  messageIds: string[];
  templateIds: string[];
  workflowIds: string[];
  reminderIds: string[];
  escalationIds: string[];
  crmIntegrationStatus: "none" | "triggered" | "linked" | "failed" | "unavailable";
  bookingIntegrationStatus: "none" | "triggered" | "linked" | "failed" | "unavailable";
  outstandingIssues: string[];
  auditStatus: "open" | "audited" | "archived";
  evidenceMode: EvidenceMode;
};

export type WhatsAppReport = {
  reportId: string;
  timestamp: string;
  businessProjectId: string;
  conversationId: string;
  customerReference: string;
  messageDirection: MessageDirection | "mixed";
  conversationStatus: ConversationStatus;
  templatesUsed: string[];
  automationSteps: AutomationStep[];
  crmIntegrationStatus: Conversation["crmIntegrationStatus"];
  bookingIntegrationStatus: Conversation["bookingIntegrationStatus"];
  auditStatus: "open" | "audited" | "archived";
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  messages: Message[];
  labels: string[];
  assignedAgent: string | null;
  mediaAttachments: MediaAttachment[];
  reminderSchedule: ReminderScheduleEntry[];
  consumableByQ707: true;
  neverReplaceCrm: true;
  neverReplaceBookingWorker: true;
  neverReplaceOperationsWorker: true;
  neverModifyUnrelatedPlatformComponents: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateMessageDeliveryResults: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ707OrLater: true;
  preserveCompleteTraceability: true;
  preserveConversationHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeProhibitedPersonalData: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  evidenceMode: EvidenceMode;
  traceabilityRefs: string[];
};

export type WhatsAppInput = {
  reportId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  templateId?: string | null;
  workflowId?: string | null;
  reminderId?: string | null;
  businessProjectId?: string | null;
  customerReference?: string | null;
  customerId?: string | null;
  messageBody?: string | null;
  messageDirection?: MessageDirection | string | null;
  conversationStatus?: ConversationStatus | string | null;
  templateName?: string | null;
  templateBody?: string | null;
  templateCategory?: string | null;
  templateVariables?: string[] | null;
  workflowName?: string | null;
  workflowSteps?: AutomationStepType[] | null;
  assignedAgent?: string | null;
  labels?: string[] | null;
  reminderPurpose?: string | null;
  reminderDueAt?: string | null;
  followUpPurpose?: string | null;
  followUpDueAt?: string | null;
  escalationReason?: string | null;
  mediaAttachments?: MediaAttachment[] | null;
  crmReport?: CrmReport | null;
  fixtureCrm?: CrmFixture | null;
  deliveryFixture?: {
    passed: boolean;
    reason?: string;
    transportMessageId?: string | null;
  } | null;
  evidenceMode?: EvidenceMode | string | null;
  grandKingInstructions?: string | null;
  missionId?: string | null;
  validated?: boolean;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  replaceCrm?: boolean;
  replaceBookingWorker?: boolean;
  replaceOperationsWorker?: boolean;
  modifyUnrelatedPlatformComponents?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateMessageDeliveryResults?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ707OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type WhatsAppWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WhatsAppWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WAW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WhatsAppWorkerCapability[];
  totalReports: number;
  totalConversations: number;
  totalMessages: number;
  lastConversationId: string | null;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type WhatsAppWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reports: WhatsAppReport[];
  conversations: Conversation[];
  messages: Message[];
  templates: MessageTemplate[];
  workflows: AutomationWorkflow[];
  reminders: ReminderScheduleEntry[];
  escalations: EscalationRecord[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverReplaceCrm: true;
  neverReplaceBookingWorker: true;
  neverReplaceOperationsWorker: true;
  neverFabricateMessageDeliveryResults: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ707OrLater: true;
  consumableByQ707: true;
};

export type WhatsAppWorkerRunReport = {
  whatsappRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_inbound_enquiry"
    | "send_outbound_message"
    | "apply_template"
    | "run_automated_workflow"
    | "trigger_crm_workflow"
    | "trigger_booking_workflow"
    | "schedule_reminder"
    | "schedule_follow_up_message"
    | "escalate_to_human"
    | "assign_conversation"
    | "label_conversation"
    | "get_conversation_history"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WhatsAppWorkerEngineRecord;
  catalog: WhatsAppWorkerCatalog | null;
  reports: WhatsAppReport[];
  conversations: Conversation[];
  messages: Message[];
  latestReport: WhatsAppReport | null;
  latestConversation: Conversation | null;
  latestMessage: Message | null;
  latestWorkflow: AutomationWorkflow | null;
  latestReminder: ReminderScheduleEntry | null;
  latestEscalation: EscalationRecord | null;
  integrations: IntegrationHandshake[];
  validation: WhatsAppWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WhatsAppWorkerState = {
  engineVersion: "PILLOW-WAW-001";
  missionId: "Q7-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: WhatsAppWorkerConfiguration;
  latestReport: WhatsAppWorkerRunReport | null;
  engineRecord: WhatsAppWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalConversations: number;
    totalMessages: number;
    lastReportId: string | null;
    lastConversationId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type WhatsAppWorkerCockpitSnapshot = {
  missionId: "Q7-06";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalConversations: number;
  totalMessages: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverReplaceCrm: true;
  neverReplaceBookingWorker: true;
  neverReplaceOperationsWorker: true;
  neverFabricateMessageDeliveryResults: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ707OrLater: true;
  consumableByQ707: true;
};

/** Stable subset contract for Q7-07. */
export type Q707ConsumableContract = {
  contractVersion: "WAW-Q707-v1";
  consumableByQ707: true;
  fields: readonly string[];
  types: {
    WhatsAppReport: "WhatsAppReport";
    Conversation: "Conversation";
    Message: "Message";
    MessageTemplate: "MessageTemplate";
    AutomationWorkflow: "AutomationWorkflow";
    EscalationRecord: "EscalationRecord";
    ReminderScheduleEntry: "ReminderScheduleEntry";
  };
  notes: string[];
  neverReplaceCrm: true;
  neverReplaceBookingWorker: true;
  neverFabricateMessageDeliveryResults: true;
  neverImplementQ707OrLater: true;
};
