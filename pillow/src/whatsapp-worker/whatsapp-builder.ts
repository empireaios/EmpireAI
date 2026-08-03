import type { WhatsAppWorkerConfiguration } from "./configuration.js";
import {
  WAW_METADATA_VERSION,
  WHATSAPP_REPORT_VERSION,
  WHATSAPP_WORKER_IDENTITY,
} from "./paths.js";
import type {
  AutomationStep,
  Conversation,
  ConversationStatus,
  EvidenceMode,
  IntegrationHandshake,
  MediaAttachment,
  Message,
  MessageDirection,
  MessageTemplate,
  ReminderScheduleEntry,
  WhatsAppInput,
  WhatsAppReport,
  WhatsAppWorkerCatalog,
  AutomationWorkflow,
  EscalationRecord,
} from "./types.js";

let conversationSeq = 0;
let messageSeq = 0;
let templateSeq = 0;
let workflowSeq = 0;
let stepSeq = 0;
let reminderSeq = 0;
let escalationSeq = 0;
let reportSeq = 0;
let engineSeq = 0;
let runSeq = 0;
let attachmentSeq = 0;

export function resetWawSequenceForTesting() {
  conversationSeq = 0;
  messageSeq = 0;
  templateSeq = 0;
  workflowSeq = 0;
  stepSeq = 0;
  reminderSeq = 0;
  escalationSeq = 0;
  reportSeq = 0;
  engineSeq = 0;
  runSeq = 0;
  attachmentSeq = 0;
}

export function nextConversationId() {
  conversationSeq += 1;
  return `waw-conv-${String(conversationSeq).padStart(4, "0")}`;
}

export function nextMessageId() {
  messageSeq += 1;
  return `waw-msg-${String(messageSeq).padStart(4, "0")}`;
}

export function nextTemplateId() {
  templateSeq += 1;
  return `waw-tpl-${String(templateSeq).padStart(4, "0")}`;
}

export function nextWorkflowId() {
  workflowSeq += 1;
  return `waw-wf-${String(workflowSeq).padStart(4, "0")}`;
}

export function nextStepId() {
  stepSeq += 1;
  return `waw-step-${String(stepSeq).padStart(4, "0")}`;
}

export function nextReminderId() {
  reminderSeq += 1;
  return `waw-rem-${String(reminderSeq).padStart(4, "0")}`;
}

export function nextEscalationId() {
  escalationSeq += 1;
  return `waw-esc-${String(escalationSeq).padStart(4, "0")}`;
}

export function nextReportId() {
  reportSeq += 1;
  return `waw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextEngineRecordId() {
  engineSeq += 1;
  return `waw-eng-${String(engineSeq).padStart(4, "0")}`;
}

export function nextRunReportId() {
  runSeq += 1;
  return `waw-run-${String(runSeq).padStart(4, "0")}`;
}

export function nextAttachmentId() {
  attachmentSeq += 1;
  return `waw-att-${String(attachmentSeq).padStart(4, "0")}`;
}

export function normalizeConversationStatus(
  value: string | null | undefined,
  allowed: ConversationStatus[],
): ConversationStatus {
  const v = (value ?? "open").trim().toLowerCase();
  return (allowed as readonly string[]).includes(v) ? (v as ConversationStatus) : "unknown";
}

export function normalizeMessageDirection(
  value: string | null | undefined,
  allowed: MessageDirection[],
): MessageDirection {
  const v = (value ?? "inbound").trim().toLowerCase();
  return (allowed as readonly string[]).includes(v) ? (v as MessageDirection) : "inbound";
}

export function normalizeEvidenceMode(
  value: string | null | undefined,
  fallback: EvidenceMode,
): EvidenceMode {
  const v = (value ?? fallback).trim().toLowerCase();
  if (v === "fixture" || v === "sandbox" || v === "cached" || v === "live") return v;
  return fallback;
}

export class WhatsAppBuilder {
  buildCatalog(
    config: WhatsAppWorkerConfiguration,
    reports: WhatsAppReport[],
    conversations: Conversation[],
    messages: Message[],
    templates: MessageTemplate[],
    workflows: AutomationWorkflow[],
    reminders: ReminderScheduleEntry[],
    escalations: EscalationRecord[],
    integrations: IntegrationHandshake[],
  ): WhatsAppWorkerCatalog {
    return {
      reportVersion: WHATSAPP_REPORT_VERSION,
      workerId: config.workerId,
      reports: reports.map((r) => ({ ...r })),
      conversations: conversations.map((c) => ({ ...c })),
      messages: messages.map((m) => ({ ...m })),
      templates: templates.map((t) => ({ ...t })),
      workflows: workflows.map((w) => ({ ...w })),
      reminders: reminders.map((r) => ({ ...r })),
      escalations: escalations.map((e) => ({ ...e })),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: WAW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverReplaceCrm: true,
      neverReplaceBookingWorker: true,
      neverReplaceOperationsWorker: true,
      neverFabricateMessageDeliveryResults: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ707OrLater: true,
      consumableByQ707: true,
    };
  }

  createConversation(
    input: WhatsAppInput,
    config: WhatsAppWorkerConfiguration,
  ): Conversation {
    const now = new Date().toISOString();
    const conversationId = input.conversationId?.trim() || nextConversationId();
    const customerReference =
      input.customerReference?.trim() ||
      input.customerId?.trim() ||
      `ref-${conversationId}`;
    return {
      conversationId,
      createdAt: now,
      updatedAt: now,
      businessProjectId: input.businessProjectId?.trim() || "unspecified",
      customerReference,
      status: normalizeConversationStatus(input.conversationStatus, config.conversationStatuses),
      assignedAgent: input.assignedAgent?.trim() || null,
      labels: [...(input.labels ?? [])],
      messageIds: [],
      templateIds: [],
      workflowIds: [],
      reminderIds: [],
      escalationIds: [],
      crmIntegrationStatus: "none",
      bookingIntegrationStatus: "none",
      outstandingIssues: [],
      auditStatus: "open",
      evidenceMode: normalizeEvidenceMode(input.evidenceMode, config.defaultEvidenceMode),
    };
  }

  assembleReport(params: {
    conversation: Conversation;
    messages: Message[];
    automationSteps: AutomationStep[];
    templatesUsed: string[];
    reminders: ReminderScheduleEntry[];
    config: WhatsAppWorkerConfiguration;
  }): WhatsAppReport {
    const { conversation, messages, automationSteps, templatesUsed, reminders, config } = params;
    const directions = new Set(messages.map((m) => m.direction));
    const messageDirection: WhatsAppReport["messageDirection"] =
      directions.size === 0
        ? "inbound"
        : directions.size > 1
          ? "mixed"
          : ([...directions][0] as MessageDirection);
    const delivered = messages.filter((m) => m.deliveryStatus === "delivered").length;
    const failed = messages.filter((m) => m.deliveryStatus === "failed").length;
    const confidence = Math.max(
      0.35,
      Math.min(
        0.95,
        0.5 +
          (messages.length ? 0.1 : 0) +
          (delivered ? 0.15 : 0) +
          (automationSteps.length ? 0.1 : 0) +
          (conversation.crmIntegrationStatus === "triggered" ||
          conversation.crmIntegrationStatus === "linked"
            ? 0.05
            : 0) +
          (conversation.bookingIntegrationStatus === "triggered" ||
          conversation.bookingIntegrationStatus === "linked"
            ? 0.05
            : 0) -
          (failed ? 0.1 : 0),
      ),
    );
    const mediaAttachments: MediaAttachment[] = messages.flatMap((m) =>
      m.mediaAttachments.map((a) => ({ ...a })),
    );
    return {
      reportId: nextReportId(),
      timestamp: new Date().toISOString(),
      businessProjectId: conversation.businessProjectId,
      conversationId: conversation.conversationId,
      customerReference: conversation.customerReference,
      messageDirection,
      conversationStatus: conversation.status,
      templatesUsed: [...templatesUsed],
      automationSteps: automationSteps.map((s) => ({ ...s })),
      crmIntegrationStatus: conversation.crmIntegrationStatus,
      bookingIntegrationStatus: conversation.bookingIntegrationStatus,
      auditStatus: conversation.auditStatus,
      outstandingIssues: [...conversation.outstandingIssues],
      confidenceScore: Number(confidence.toFixed(2)),
      metadataVersion: WAW_METADATA_VERSION,
      reportVersion: WHATSAPP_REPORT_VERSION,
      workerId: config.workerId || WHATSAPP_WORKER_IDENTITY.workerId,
      messages: messages.map((m) => ({
        ...m,
        mediaAttachments: m.mediaAttachments.map((a) => ({ ...a })),
        labels: [...m.labels],
        fabricated: false as const,
      })),
      labels: [...conversation.labels],
      assignedAgent: conversation.assignedAgent,
      mediaAttachments,
      reminderSchedule: reminders.map((r) => ({ ...r })),
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
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      evidenceMode: conversation.evidenceMode,
      traceabilityRefs: [
        `q7-06:whatsapp:${conversation.conversationId}`,
        ...messages.map((m) => `q7-06:message:${m.messageId}`),
      ],
    };
  }
}
