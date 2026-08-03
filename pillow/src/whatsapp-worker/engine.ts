import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWhatsAppWorkerConfiguration,
  type WhatsAppWorkerConfiguration,
} from "./configuration.js";
import type { WhatsAppWorkerDependencies } from "./integrations.js";
import { resetWawSequenceForTesting } from "./whatsapp-builder.js";
import { WhatsAppManager } from "./whatsapp-manager.js";
import { WHATSAPP_WORKER_SYSTEM_PATH } from "./paths.js";
import { WhatsAppWorkerController } from "./whatsapp-worker-controller.js";
import { resetWawLogsForTesting } from "./waw-logging.js";
import type {
  Q707ConsumableContract,
  WhatsAppInput,
  WhatsAppWorkerCockpitSnapshot,
  WhatsAppWorkerState,
} from "./types.js";

export interface WhatsAppWorkerOptions {
  configuration?: Partial<WhatsAppWorkerConfiguration>;
  dependencies?: WhatsAppWorkerDependencies;
}

/** Authoritative Q7-06 WhatsApp Worker — structural WhatsApp communications signals only. */
export class WhatsAppWorker {
  private initializedAt: string | null = null;
  private readonly controller: WhatsAppWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WhatsAppWorkerOptions = {},
  ) {
    const manager = new WhatsAppManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new WhatsAppWorkerController(
      manager,
      buildWhatsAppWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WHATSAPP_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("WhatsApp Worker")) {
      throw new Error(
        `${WHATSAPP_WORKER_SYSTEM_PATH} missing — Q7-06 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: WhatsAppWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): WhatsAppWorkerState {
    if (!this.initializedAt) {
      throw new Error("WhatsApp Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WAW-001",
      missionId: "Q7-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        totalConversations: engineRecord?.totalConversations ?? 0,
        totalMessages: engineRecord?.totalMessages ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastConversationId: engineRecord?.lastConversationId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "WhatsApp Worker produces structural conversation, message, template, and automation signals only: does not replace CRM, booking, or operations workers; never fabricates message delivery results; never overrides approved architecture, Pillow, or Grand King; never implements Q7-07 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveInboundEnquiry(input: WhatsAppInput = {}) {
    return this.controller.receiveInboundEnquiry(input);
  }

  sendOutboundMessage(input: WhatsAppInput = {}) {
    return this.controller.sendOutboundMessage(input);
  }

  applyTemplate(input: WhatsAppInput = {}) {
    return this.controller.applyTemplate(input);
  }

  runAutomatedWorkflow(input: WhatsAppInput = {}) {
    return this.controller.runAutomatedWorkflow(input);
  }

  triggerCrmWorkflow(input: WhatsAppInput = {}) {
    return this.controller.triggerCrmWorkflow(input);
  }

  triggerBookingWorkflow(input: WhatsAppInput = {}) {
    return this.controller.triggerBookingWorkflow(input);
  }

  scheduleReminder(input: WhatsAppInput = {}) {
    return this.controller.scheduleReminder(input);
  }

  scheduleFollowUpMessage(input: WhatsAppInput = {}) {
    return this.controller.scheduleFollowUpMessage(input);
  }

  escalateToHuman(input: WhatsAppInput = {}) {
    return this.controller.escalateToHuman(input);
  }

  assignConversation(input: WhatsAppInput = {}) {
    return this.controller.assignConversation(input);
  }

  labelConversation(input: WhatsAppInput = {}) {
    return this.controller.labelConversation(input);
  }

  getConversationHistory(input: WhatsAppInput = {}) {
    return this.controller.getConversationHistory(input);
  }

  produceWhatsAppReport(input: WhatsAppInput = {}) {
    return this.controller.produceWhatsAppReport(input);
  }

  produceReport(input: WhatsAppInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: WhatsAppInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getConversations() {
    return this.controller.getManager().getConversations();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  validate(input: WhatsAppInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestReportId() {
    return this.controller.getManager().getLatestReportId();
  }

  getLatestConversationId() {
    return this.controller.getManager().getLatestConversationId();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `WhatsApp reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WhatsAppWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-06",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalConversations: state.health.totalConversations,
      totalMessages: state.health.totalMessages,
      latestReportId: this.getLatestReportId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverReplaceCrm: true,
      neverReplaceBookingWorker: true,
      neverReplaceOperationsWorker: true,
      neverFabricateMessageDeliveryResults: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ707OrLater: true,
      consumableByQ707: true,
    };
  }

  getQ707ConsumableContract(): Q707ConsumableContract {
    return {
      contractVersion: "WAW-Q707-v1",
      consumableByQ707: true,
      fields: [
        "reportId",
        "businessProjectId",
        "conversationId",
        "customerReference",
        "messageDirection",
        "conversationStatus",
        "templatesUsed",
        "automationSteps",
        "crmIntegrationStatus",
        "bookingIntegrationStatus",
        "messages",
        "labels",
        "assignedAgent",
        "reminderSchedule",
        "confidenceScore",
        "evidenceMode",
        "traceabilityRefs",
      ] as const,
      types: {
        WhatsAppReport: "WhatsAppReport",
        Conversation: "Conversation",
        Message: "Message",
        MessageTemplate: "MessageTemplate",
        AutomationWorkflow: "AutomationWorkflow",
        EscalationRecord: "EscalationRecord",
        ReminderScheduleEntry: "ReminderScheduleEntry",
      },
      notes: [
        "Q7-07 may consume structural WhatsApp conversation records and reports only.",
        "WAW never replaces CRM/booking/ops, never fabricates delivery results, never implements Q7-07 itself.",
      ],
      neverReplaceCrm: true,
      neverReplaceBookingWorker: true,
      neverFabricateMessageDeliveryResults: true,
      neverImplementQ707OrLater: true,
    };
  }
}

export function createWhatsAppWorker(
  bootstrap: EmpireBootstrapContext,
  options?: WhatsAppWorkerOptions,
) {
  return new WhatsAppWorker(bootstrap, options);
}

export function resetWhatsAppWorkerForTesting() {
  resetWawLogsForTesting();
  resetWawSequenceForTesting();
}
