import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AUTOMATION_STEP_TYPES,
  CONVERSATION_STATUSES,
  INTEGRATION_TARGETS,
  MESSAGE_DIRECTIONS,
  WAW_METADATA_VERSION,
  WHATSAPP_WORKER_IDENTITY,
} from "./paths.js";
import type {
  AutomationStepType,
  ConversationStatus,
  MessageDirection,
  WhatsAppReport,
} from "./types.js";

export type WhatsAppWorkerConfiguration = {
  enabled: boolean;
  whatsappRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  conversationStatuses: ConversationStatus[];
  messageDirections: MessageDirection[];
  automationStepTypes: AutomationStepType[];
  seedReports: WhatsAppReport[];
  defaultEvidenceMode: "fixture" | "sandbox" | "cached" | "live";
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-06 hard boundaries — force-locked true. */
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
};

export const DEFAULT_WHATSAPP_WORKER_CONFIGURATION: WhatsAppWorkerConfiguration = {
  enabled: true,
  whatsappRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: WHATSAPP_WORKER_IDENTITY.workerId,
  workerName: WHATSAPP_WORKER_IDENTITY.workerName,
  factory: WHATSAPP_WORKER_IDENTITY.factory,
  department: WHATSAPP_WORKER_IDENTITY.department,
  role: WHATSAPP_WORKER_IDENTITY.role,
  reportingLine: [...WHATSAPP_WORKER_IDENTITY.reportingLine],
  conversationStatuses: [...CONVERSATION_STATUSES],
  messageDirections: [...MESSAGE_DIRECTIONS],
  automationStepTypes: [...AUTOMATION_STEP_TYPES],
  seedReports: [],
  defaultEvidenceMode: "fixture",
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverReplaceCrm: true,
  neverReplaceBookingWorker: true,
  neverReplaceOperationsWorker: true,
  neverModifyUnrelatedPlatformComponents: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverFabricateMessageDeliveryResults: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ707OrLater: true,
  preserveCompleteTraceability: true,
  preserveConversationHistory: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeProhibitedPersonalData: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildWhatsAppWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WhatsAppWorkerConfiguration> = {},
): WhatsAppWorkerConfiguration {
  let file: Partial<WhatsAppWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "whatsapp-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WHATSAPP_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.WHATSAPP_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key:
      | "integrationTargets"
      | "conversationStatuses"
      | "messageDirections"
      | "automationStepTypes",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_WHATSAPP_WORKER_CONFIGURATION[key],
        ...((file[key] as string[] | undefined) ?? []),
        ...((overrides[key] as string[] | undefined) ?? []),
      ]),
    );

  return {
    ...DEFAULT_WHATSAPP_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    conversationStatuses: mergeList("conversationStatuses") as ConversationStatus[],
    messageDirections: mergeList("messageDirections") as MessageDirection[],
    automationStepTypes: mergeList("automationStepTypes") as AutomationStepType[],
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_WHATSAPP_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverReplaceCrm: true,
    neverReplaceBookingWorker: true,
    neverReplaceOperationsWorker: true,
    neverModifyUnrelatedPlatformComponents: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateMessageDeliveryResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ707OrLater: true,
    preserveCompleteTraceability: true,
    preserveConversationHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: WhatsAppReport): WhatsAppReport {
  return {
    ...report,
    templatesUsed: [...report.templatesUsed],
    automationSteps: report.automationSteps.map((s) => ({ ...s })),
    outstandingIssues: [...report.outstandingIssues],
    messages: report.messages.map((m) => ({
      ...m,
      mediaAttachments: m.mediaAttachments.map((a) => ({ ...a })),
      labels: [...m.labels],
      fabricated: false as const,
    })),
    labels: [...report.labels],
    mediaAttachments: report.mediaAttachments.map((a) => ({ ...a })),
    reminderSchedule: report.reminderSchedule.map((r) => ({ ...r })),
    traceabilityRefs: [...report.traceabilityRefs],
    metadataVersion: report.metadataVersion || WAW_METADATA_VERSION,
    consumableByQ707: true,
    neverReplaceCrm: true,
    neverReplaceBookingWorker: true,
    neverReplaceOperationsWorker: true,
    neverModifyUnrelatedPlatformComponents: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateMessageDeliveryResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ707OrLater: true,
    preserveCompleteTraceability: true,
    preserveConversationHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
