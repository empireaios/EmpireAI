/** X1-06 — Digital Asset Planning Controller. */

import { appendDapLog } from "./dap-logging.js";
import { DigitalAssetPlanningManager } from "./digital-asset-planning-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { DomainDigitalAssetPlannerConfiguration } from "./configuration.js";
import type {
  ConnectDomainDigitalAssetPlannerInput,
  CreateDigitalAssetPlanInput,
  DigitalAssetActionInput,
  DigitalAssetPerformanceStats,
  DigitalAssetRunReport,
  EngineStatus,
} from "./types.js";

export class DigitalAssetPlanningController {
  private config: DomainDigitalAssetPlannerConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: DigitalAssetRunReport | null = null;
  private readonly manager: DigitalAssetPlanningManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: DigitalAssetPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    plansCreated: 0,
    domainPlanningRuns: 0,
    socialPlanningRuns: 0,
    websitePlanningRuns: 0,
    conflictDetectionRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: DigitalAssetPlanningManager,
    config: DomainDigitalAssetPlannerConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendDapLog({
      event: "engine_initialization",
      level: "info",
      details: "Domain & Digital Asset Planner ready (X1-06)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): DomainDigitalAssetPlannerConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: DomainDigitalAssetPlannerConfiguration): void {
    this.config = config;
  }

  getLatestReport(): DigitalAssetRunReport | null {
    return this.latestReport;
  }

  getManager(): DigitalAssetPlanningManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): DigitalAssetPerformanceStats {
    return { ...this.performance };
  }

  connectDomainDigitalAssetPlanner(
    input: ConnectDomainDigitalAssetPlannerInput = {},
  ): DigitalAssetRunReport {
    if (!this.config.enabled) throw new Error("Domain & Digital Asset Planner is disabled");
    this.status = "connecting";
    const report = this.manager.connectDomainDigitalAssetPlanner(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createPlan(input: CreateDigitalAssetPlanInput = {}): DigitalAssetRunReport {
    this.status = "planning";
    this.performance.plansCreated += 1;
    const report = this.manager.createPlan(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  planCompanyDomains(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    this.performance.domainPlanningRuns += 1;
    const report = this.manager.planCompanyDomains(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  planDomainAlternatives(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    this.performance.domainPlanningRuns += 1;
    const report = this.manager.planDomainAlternatives(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  planSocialHandles(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    this.performance.socialPlanningRuns += 1;
    const report = this.manager.planSocialHandles(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  planEmailDomains(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    this.performance.domainPlanningRuns += 1;
    const report = this.manager.planEmailDomains(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  planBrandAssetStructure(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    const report = this.manager.planBrandAssetStructure(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  planWebsiteArchitecture(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    this.performance.websitePlanningRuns += 1;
    const report = this.manager.planWebsiteArchitecture(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  planDigitalIdentityConsistency(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    const report = this.manager.planDigitalIdentityConsistency(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectNamingConflicts(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    this.performance.conflictDetectionRuns += 1;
    const report = this.manager.detectNamingConflicts(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: DigitalAssetActionInput = {}): DigitalAssetRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: DigitalAssetRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `${report.action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
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
    appendDapLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
