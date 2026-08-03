import type { InterWorkerMessagingConfiguration } from "./configuration.js";
import type {
  DELIVERY_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  IWM_CAPABILITIES,
  MESSAGE_PRIORITIES,
  MESSAGE_TYPES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type MessageType = (typeof MESSAGE_TYPES)[number];
export type MessagePriority = (typeof MESSAGE_PRIORITIES)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type InterWorkerMessagingCapability = (typeof IWM_CAPABILITIES)[number];

/** Machine-readable Message Record (Q0-24). */
export type MessageRecord = {
  messageId: string;
  timestamp: string;
  senderWorker: string;
  receiverWorker: string;
  businessId: string;
  missionId: string;
  conversationId: string;
  messageType: MessageType | string;
  priority: MessagePriority;
  messageSummary: string;
  payloadReference: string;
  deliveryStatus: DeliveryStatus;
  metadataVersion: string;
  messageTraceId: string;
  validationStatus: ValidationStatus;
  inReplyTo: string | null;
  isBroadcast: boolean;
  deliveryHistory: DeliveryStatus[];
  /** Explicit Q0-24 boundaries. */
  neverExecuteWorkerLogic: true;
  neverModifyWorkerDecisions: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerLogicExecuted: false;
  workerDecisionsModified: false;
  workforceOrchestratorReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveMessageTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-24 — transport/route/track only. */
export type InterWorkerMessagingInput = {
  messageId?: string | null;
  senderWorker?: string | null;
  receiverWorker?: string | null;
  businessId?: string | null;
  missionId?: string | null;
  conversationId?: string | null;
  messageType?: MessageType | string | null;
  priority?: MessagePriority | string | null;
  messageSummary?: string | null;
  payloadReference?: string | null;
  inReplyTo?: string | null;
  broadcast?: boolean;
  deliveryStatus?: DeliveryStatus | string | null;
  searchQuery?: string | null;
  searchMissionId?: string | null;
  searchBusinessId?: string | null;
  searchConversationId?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerLogic?: boolean;
  modifyWorkerDecisions?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type InterWorkerMessagingValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type InterWorkerMessagingEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-IWM-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: InterWorkerMessagingCapability[];
  totalMessageRecords: number;
  deliveredCount: number;
  failedCount: number;
  conversationCount: number;
  lastMessageType: MessageType | string | null;
  metadataVersion: string;
};

export type InterWorkerMessagingRunReport = {
  messagingRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "send"
    | "receive"
    | "route"
    | "reply"
    | "broadcast"
    | "track_delivery"
    | "search_history"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: InterWorkerMessagingEngineRecord;
  records: MessageRecord[];
  routed: boolean;
  deliveryStatus: DeliveryStatus | null;
  conversationId: string | null;
  validation: InterWorkerMessagingValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type InterWorkerMessagingState = {
  engineVersion: "PILLOW-IWM-001";
  missionId: "Q0-24";
  status: EngineStatus;
  initializedAt: string;
  configuration: InterWorkerMessagingConfiguration;
  latestReport: InterWorkerMessagingRunReport | null;
  engineRecord: InterWorkerMessagingEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalMessageRecords: number;
    deliveredCount: number;
    failedCount: number;
    conversationCount: number;
    lastMessageType: MessageType | string | null;
    notes: string[];
  };
};

export type InterWorkerMessagingCockpitSnapshot = {
  missionId: "Q0-24";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalMessageRecords: number;
  latestMessageId: string | null;
  conversationCount: number;
  neverExecuteWorkerLogic: true;
  neverModifyWorkerDecisions: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
