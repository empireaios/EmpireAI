import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { LiveChatIntegration } from "../live-chat-integration/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import {
  buildTicketManagementEngineConfiguration,
  type TicketManagementEngineConfiguration,
} from "./configuration.js";
import { appendTmeLog, getTmeLogs, resetTmeLogsForTesting } from "./tme-logging.js";
import { TICKET_MANAGEMENT_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AssignTicketOwnershipInput,
  AssignTicketPriorityInput,
  ClassifyTicketCategoryInput,
  ConnectTicketManagementEngineInput,
  CreateSupportTicketInput,
  DetectOverdueTicketsInput,
  DetectStalledTicketsInput,
  DetectTicketFailuresInput,
  LinkTicketToConversationInput,
  LinkTicketToCustomerInput,
  LinkTicketToTimelineInput,
  TicketCockpitSnapshot,
  TicketManagementEngineState,
  TicketRunReport,
  TrackTicketLifecycleInput,
} from "./types.js";
import { TicketManagementController } from "./ticket-management-controller.js";
import { TicketManagementManager } from "./ticket-management-manager.js";
import { TicketWorkflowEngine } from "./ticket-workflow-engine.js";

export interface TicketManagementEngineOptions {
  configuration?: Partial<TicketManagementEngineConfiguration>;
}

/**
 * Ticket Management Engine (PILLOW-TME-001 / R4-09).
 * Centralized customer support ticket management consuming R4-01, R4-02, R4-03, R4-07, R4-08.
 */
export class TicketManagementEngine {
  private initializedAt: string | null = null;
  private readonly controller: TicketManagementController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    liveChatIntegration: LiveChatIntegration,
    aiCustomerSupport: AiCustomerSupport,
    options: TicketManagementEngineOptions = {},
  ) {
    const config = buildTicketManagementEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new TicketManagementManager(
      identityEngine,
      crmFoundation,
      timelineEngine,
      liveChatIntegration,
      aiCustomerSupport,
    );
    this.controller = new TicketManagementController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<TicketManagementEngineState> {
    const doc = await this.reader.readText(TICKET_MANAGEMENT_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Ticket Management Engine")) {
      throw new Error(
        `${TICKET_MANAGEMENT_ENGINE_SYSTEM_PATH} missing — Ticket Management Engine requires R4-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendTmeLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-09 Ticket Management Engine initialized",
    });
    return this.getState();
  }

  getState(): TicketManagementEngineState {
    if (!this.initializedAt) {
      throw new Error("Ticket Management Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const ticketRecords = this.controller.getManager().getTicketRecords();
    const summary = this.controller.getManager().getAnalyticsEngine().summarize(ticketRecords);

    const workflowEngine = new TicketWorkflowEngine();
    const registry = this.controller.getManager().getRegistry();
    const overdueTickets = ticketRecords.filter((t) => workflowEngine.isOverdue(t, config)).length;
    const stalledTickets = ticketRecords.filter((t) =>
      workflowEngine.isStalled(t, registry, config),
    ).length;

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalTickets: summary.total,
      openTickets: summary.open,
      assignedTickets: summary.assigned + summary.inProgress,
      resolvedTickets: summary.resolved + summary.closed,
      overdueTickets,
      stalledTickets,
      failedTickets: summary.failed,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-TME-001",
      missionId: "R4-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectTicketManagementEngine(
    input: ConnectTicketManagementEngineInput = {},
  ): TicketRunReport {
    return this.controller.connectTicketManagementEngine(input);
  }

  createSupportTicket(input: CreateSupportTicketInput): TicketRunReport {
    return this.controller.createSupportTicket(input);
  }

  classifyTicketCategory(input: ClassifyTicketCategoryInput): TicketRunReport {
    return this.controller.classifyTicketCategory(input);
  }

  assignTicketPriority(input: AssignTicketPriorityInput): TicketRunReport {
    return this.controller.assignTicketPriority(input);
  }

  assignTicketOwnership(input: AssignTicketOwnershipInput): TicketRunReport {
    return this.controller.assignTicketOwnership(input);
  }

  trackTicketLifecycle(input: TrackTicketLifecycleInput): TicketRunReport {
    return this.controller.trackTicketLifecycle(input);
  }

  linkTicketToCustomer(input: LinkTicketToCustomerInput): TicketRunReport {
    return this.controller.linkTicketToCustomer(input);
  }

  linkTicketToConversation(input: LinkTicketToConversationInput): TicketRunReport {
    return this.controller.linkTicketToConversation(input);
  }

  linkTicketToTimeline(input: LinkTicketToTimelineInput): TicketRunReport {
    return this.controller.linkTicketToTimeline(input);
  }

  detectOverdueTickets(input: DetectOverdueTicketsInput = {}): TicketRunReport {
    return this.controller.detectOverdueTickets(input);
  }

  detectStalledTickets(input: DetectStalledTicketsInput = {}): TicketRunReport {
    return this.controller.detectStalledTickets(input);
  }

  detectTicketFailures(input: DetectTicketFailuresInput = {}): TicketRunReport {
    return this.controller.detectTicketFailures(input);
  }

  getLatestReport(): TicketRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getTicketRecords() {
    return this.controller.getManager().getTicketRecords();
  }

  getMachineReadableRecord(ticketId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getRecord(ticketId);
    if (!record) return null;
    return this.controller.getManager().getAnalyticsEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<TicketManagementEngineConfiguration>,
  ): TicketManagementEngineState {
    const next = buildTicketManagementEngineConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Ticket management status: ${state.status}`,
        `Tickets: ${state.health.totalTickets} total · ${state.health.resolvedTickets} resolved`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No ticket operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TicketCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalTickets: state.health.totalTickets,
      openTickets: state.health.openTickets,
      assignedTickets: state.health.assignedTickets,
      resolvedTickets: state.health.resolvedTickets,
      overdueTickets: state.health.overdueTickets,
      stalledTickets: state.health.stalledTickets,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      aiCustomerSupportConnected: record?.aiCustomerSupportConnected ?? false,
      recentLogs: getTmeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createTicketManagementEngine(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  liveChatIntegration: LiveChatIntegration,
  aiCustomerSupport: AiCustomerSupport,
  options?: TicketManagementEngineOptions,
): TicketManagementEngine {
  return new TicketManagementEngine(
    bootstrap,
    identityEngine,
    crmFoundation,
    timelineEngine,
    liveChatIntegration,
    aiCustomerSupport,
    options,
  );
}

export function resetTicketManagementEngineForTesting(): void {
  resetTmeLogsForTesting();
  new TicketManagementManager(null, null, null, null, null).resetForTesting();
}
