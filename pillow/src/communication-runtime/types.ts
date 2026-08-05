import type { CommunicationRuntimeConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CHANNEL_STATUSES,
  CHANNEL_TYPES,
  COMRT_CAPABILITIES,
  DELIVERY_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  MESSAGE_TYPES,
  PRIORITIES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type MessageType = (typeof MESSAGE_TYPES)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type ChannelType = (typeof CHANNEL_TYPES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type ChannelStatus = (typeof CHANNEL_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ComrtCapability = (typeof COMRT_CAPABILITIES)[number];

export type CommunicationMessage = {
  messageId: string;
  sender: string;
  receiver: string;
  messageType: MessageType;
  correlationId: string | null;
  sessionId: string | null;
  missionId: string;
  priority: Priority;
  deliveryStatus: DeliveryStatus;
  retryCount: number;
  maxRetries: number;
  timestamp: string;
  contextReference: string;
  auditReference: string;
  channelType: ChannelType;
  syncMode: "sync" | "async";
  acknowledgedAt: string | null;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type CommunicationChannel = {
  channelId: string;
  channelType: ChannelType;
  participants: string[];
  status: ChannelStatus;
  createdAt: string;
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type CollaborationSession = {
  sessionId: string;
  participants: string[];
  missionId: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  messageCount: number;
  contextReference: string;
  auditReference: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type DeliveryRecord = {
  deliveryId: string;
  messageId: string;
  channelId: string;
  status: DeliveryStatus;
  attempt: number;
  timestamp: string;
  errorClass: string | null;
  structuralSignalOnly: true;
  fabricated: false;
};

export type RetrySummary = {
  totalRetries: number;
  exhaustedRetries: number;
  deadLettered: number;
  averageAttempts: number;
};

export type MessageStatistics = {
  totalMessages: number;
  pendingMessages: number;
  routedMessages: number;
  deliveredMessages: number;
  acknowledgedMessages: number;
  failedMessages: number;
  retryingMessages: number;
  deadLetteredMessages: number;
  syncMessages: number;
  asyncMessages: number;
  lastMessageAt: string | null;
};

export type DeliverySummary = {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  acknowledgedDeliveries: number;
  byChannelType: Record<string, number>;
};

export type RuntimeHealth = {
  status: EngineHealthStatus;
  healthScore: number;
  activeChannels: number;
  openSessions: number;
  failedDeliveryRate: number;
  notes: string[];
};

export type CommunicationRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  activeCommunicationChannels: CommunicationChannel[];
  messageStatistics: MessageStatistics;
  deliverySummary: DeliverySummary;
  retrySummary: RetrySummary;
  failedDeliveries: DeliveryRecord[];
  collaborationSessions: CollaborationSession[];
  runtimeHealth: RuntimeHealth;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1009: boolean;
  neverFabricateMessages: true;
  neverLoseAcknowledgedMessages: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1009OrLater: true;
  neverExecuteBusinessLogic: true;
  neverReplaceWorkerImplementations: true;
  neverReplaceOrchestrationLogic: true;
  deterministicMessageRouting: true;
  preserveCompleteTraceability: true;
  preserveCommunicationHistory: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type Q1009ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "communication-runtime";
  missionId: "Q10-08";
  consumerMissionId: "Q10-09";
  exposedFields: string[];
  messageTypeCatalog: string[];
  channelTypeCatalog: string[];
  deliveryStatusCatalog: string[];
  notes: string[];
  neverImplementQ1009OrLater: true;
  structuralSignalOnly: true;
};

export type ComrtInput = {
  messageId?: string;
  sender?: string;
  receiver?: string;
  messageType?: MessageType;
  correlationId?: string | null;
  sessionId?: string | null;
  missionId?: string;
  priority?: Priority;
  channelId?: string;
  channelType?: ChannelType;
  participants?: string[];
  syncMode?: "sync" | "async";
  contextReference?: string;
  auditReference?: string;
  maxRetries?: number;
  highRisk?: boolean;
  pillowConfirmed?: boolean;
  grandKingApproved?: boolean;
  validated?: boolean;
  forceFail?: boolean;
  fabricateMessage?: boolean;
  simulateFailure?: boolean;
  exposeSecrets?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1009OrLater?: boolean;
  executeBusinessLogic?: boolean;
  replaceWorkerImplementations?: boolean;
  replaceOrchestrationLogic?: boolean;
  targetMissionId?: string | null;
  loseAcknowledgedMessages?: boolean;
};

export type ComrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ComrtRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: ComrtValidationReport;
  message: CommunicationMessage | null;
  messages: CommunicationMessage[];
  channel: CommunicationChannel | null;
  channels: CommunicationChannel[];
  session: CollaborationSession | null;
  sessions: CollaborationSession[];
  delivery: DeliveryRecord | null;
  deliveries: DeliveryRecord[];
  communicationRuntimeReport: CommunicationRuntimeReport | null;
  q1009Contract: Q1009ConsumableContract | null;
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type ComrtEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalChannels: number;
  totalMessages: number;
  totalSessions: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: ComrtCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ComrtDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalChannels: number;
  totalMessages: number;
  totalSessions: number;
  totalDeliveries: number;
  totalReports: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type CommunicationRuntimeState = {
  engineVersion: "PILLOW-COMRT-001";
  missionId: "Q10-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: CommunicationRuntimeConfiguration;
  latestReport: ComrtRunReport | null;
  engineRecord: ComrtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalChannels: number;
    totalMessages: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type CommunicationRuntimeCockpitSnapshot = {
  missionId: "Q10-08";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalChannels: number;
  totalMessages: number;
  totalSessions: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateMessages: true;
  neverLoseAcknowledgedMessages: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1009OrLater: true;
  structuralSignalOnly: true;
};
