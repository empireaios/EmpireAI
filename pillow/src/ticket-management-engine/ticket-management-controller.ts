/** R4-09 — Ticket Management Controller. */

import { appendTmeLog } from "./tme-logging.js";
import { TicketManagementManager } from "./ticket-management-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { TicketManagementEngineConfiguration } from "./configuration.js";
import type {
  AssignTicketOwnershipInput,
  AssignTicketPriorityInput,
  ClassifyTicketCategoryInput,
  ConnectTicketManagementEngineInput,
  CreateSupportTicketInput,
  DetectOverdueTicketsInput,
  DetectStalledTicketsInput,
  DetectTicketFailuresInput,
  EngineStatus,
  LinkTicketToConversationInput,
  LinkTicketToCustomerInput,
  LinkTicketToTimelineInput,
  TicketPerformanceStats,
  TicketRunReport,
  TrackTicketLifecycleInput,
} from "./types.js";

export class TicketManagementController {
  private config: TicketManagementEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: TicketRunReport | null = null;
  private readonly manager: TicketManagementManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: TicketPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    ticketsCreated: 0,
    categoriesClassified: 0,
    prioritiesAssigned: 0,
    ownershipAssigned: 0,
    lifecycleUpdates: 0,
    customerLinks: 0,
    conversationLinks: 0,
    timelineLinks: 0,
    overdueDetected: 0,
    stalledDetected: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: TicketManagementManager, config: TicketManagementEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendTmeLog({
      event: "engine_initialization",
      level: "info",
      details: "Ticket Management Engine ready (R4-09)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): TicketManagementEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: TicketManagementEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): TicketRunReport | null {
    return this.latestReport;
  }

  getManager(): TicketManagementManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): TicketPerformanceStats {
    return { ...this.performance };
  }

  connectTicketManagementEngine(
    input: ConnectTicketManagementEngineInput = {},
  ): TicketRunReport {
    if (!this.config.enabled) throw new Error("Ticket Management Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectTicketManagementEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  createSupportTicket(input: CreateSupportTicketInput): TicketRunReport {
    this.performance.ticketsCreated += 1;
    const report = this.manager.createSupportTicket(input, this.config);
    this.finalizeOperation(report, "create_ticket");
    return report;
  }

  classifyTicketCategory(input: ClassifyTicketCategoryInput): TicketRunReport {
    this.performance.categoriesClassified += 1;
    const report = this.manager.classifyTicketCategory(input, this.config);
    this.finalizeOperation(report, "classify_category");
    return report;
  }

  assignTicketPriority(input: AssignTicketPriorityInput): TicketRunReport {
    this.performance.prioritiesAssigned += 1;
    const report = this.manager.assignTicketPriority(input, this.config);
    this.finalizeOperation(report, "assign_priority");
    return report;
  }

  assignTicketOwnership(input: AssignTicketOwnershipInput): TicketRunReport {
    this.performance.ownershipAssigned += 1;
    const report = this.manager.assignTicketOwnership(input, this.config);
    this.finalizeOperation(report, "assign_ownership");
    return report;
  }

  trackTicketLifecycle(input: TrackTicketLifecycleInput): TicketRunReport {
    this.performance.lifecycleUpdates += 1;
    const report = this.manager.trackTicketLifecycle(input, this.config);
    this.finalizeOperation(report, "track_lifecycle");
    return report;
  }

  linkTicketToCustomer(input: LinkTicketToCustomerInput): TicketRunReport {
    this.performance.customerLinks += 1;
    const report = this.manager.linkTicketToCustomer(input, this.config);
    this.finalizeOperation(report, "link_customer");
    return report;
  }

  linkTicketToConversation(input: LinkTicketToConversationInput): TicketRunReport {
    this.performance.conversationLinks += 1;
    const report = this.manager.linkTicketToConversation(input, this.config);
    this.finalizeOperation(report, "link_conversation");
    return report;
  }

  linkTicketToTimeline(input: LinkTicketToTimelineInput): TicketRunReport {
    this.performance.timelineLinks += 1;
    const report = this.manager.linkTicketToTimeline(input, this.config);
    this.finalizeOperation(report, "link_timeline");
    return report;
  }

  detectOverdueTickets(input: DetectOverdueTicketsInput = {}): TicketRunReport {
    const report = this.manager.detectOverdueTickets(input, this.config);
    this.performance.overdueDetected += report.failures.length;
    this.finalizeOperation(report, "detect_overdue");
    return report;
  }

  detectStalledTickets(input: DetectStalledTicketsInput = {}): TicketRunReport {
    const report = this.manager.detectStalledTickets(input, this.config);
    this.performance.stalledDetected += report.failures.length;
    this.finalizeOperation(report, "detect_stalled");
    return report;
  }

  detectTicketFailures(input: DetectTicketFailuresInput = {}): TicketRunReport {
    const report = this.manager.detectTicketFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  private finalizeOperation(report: TicketRunReport, action: string): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `${action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status =
        report.engineRecord.currentOperationalState === "active" ? "active" : "connected";
    }

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(report.validation.decision);
    appendTmeLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
