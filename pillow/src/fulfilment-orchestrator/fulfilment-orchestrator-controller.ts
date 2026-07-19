/** R2-10 — Fulfilment Orchestrator Controller. */

import { appendFoLog } from "./fo-logging.js";
import { FulfilmentOrchestratorManager } from "./fulfilment-orchestrator-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { FulfilmentOrchestratorConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  FulfilmentPerformanceStats,
  FulfilmentReport,
  ReceiveFulfilmentRequirementsInput,
  RouteFulfilmentInput,
} from "./types.js";

export class FulfilmentOrchestratorController {
  private config: FulfilmentOrchestratorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: FulfilmentReport | null = null;
  private readonly manager: FulfilmentOrchestratorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: FulfilmentPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    routingRuns: 0,
    ordersRouted: 0,
    fulfilmentsCompleted: 0,
    blockedWorkflowsDetected: 0,
    routingFailures: 0,
    invalidRequestsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: FulfilmentOrchestratorManager, config: FulfilmentOrchestratorConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFoLog({
      event: "engine_initialization",
      level: "info",
      details: "Fulfilment Orchestrator ready (R2-10)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): FulfilmentOrchestratorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: FulfilmentOrchestratorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): FulfilmentReport | null {
    return this.latestReport;
  }

  getManager(): FulfilmentOrchestratorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): FulfilmentPerformanceStats {
    return { ...this.performance };
  }

  routeFulfilment(input: RouteFulfilmentInput = {}): FulfilmentReport {
    if (!this.config.enabled) throw new Error("Fulfilment Orchestrator is disabled");
    this.status = "routing";
    this.performance.routingRuns += 1;
    appendFoLog({
      event: "routing_start",
      level: "info",
      details: "routeFulfilment started",
    });
    const report = this.manager.routeFulfilment(input, this.config);
    this.recordRoutingMetrics(report);
    this.finalizeOperation(report, "route");
    return report;
  }

  receiveFulfilmentRequirements(input: ReceiveFulfilmentRequirementsInput): FulfilmentReport {
    const report = this.manager.receiveFulfilmentRequirements(input, this.config);
    this.recordRoutingMetrics(report);
    this.finalizeOperation(report, "coordinate");
    return report;
  }

  private recordRoutingMetrics(report: FulfilmentReport): void {
    this.performance.ordersRouted += report.records.length;
    this.performance.fulfilmentsCompleted += report.records.filter(
      (r) => r.fulfilmentStatus === "fulfilled",
    ).length;
    this.performance.blockedWorkflowsDetected += report.failures.filter(
      (f) => f.failureType === "workflow_blocked",
    ).length;
    this.performance.routingFailures += report.failures.length;
    this.performance.invalidRequestsDetected += report.invalidRequests.length;
  }

  private finalizeOperation(report: FulfilmentReport, action: string): void {
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
      this.status = "active";
    }

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(
      report.validation.decision,
      report.failures,
      report.invalidRequests,
      report.records.filter((r) => r.fulfilmentStatus === "fulfilled").length,
    );
    appendFoLog({
      event: "routing_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
