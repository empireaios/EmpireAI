/** R5-07 — Campaign Manager Controller. */

import { appendCamLog } from "./cam-logging.js";
import { CampaignManagerCore } from "./campaign-manager-core.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CampaignManagerConfiguration } from "./configuration.js";
import type {
  ApproveCampaignInput,
  CampaignPerformanceStats,
  CampaignRunReport,
  ConnectCampaignManagerInput,
  CoordinateChannelsInput,
  CreateCampaignInput,
  DetectFailuresInput,
  EngineStatus,
  ScheduleCampaignInput,
  SetObjectiveInput,
  TrackExecutionInput,
  UpdateLifecycleInput,
  UpdateStatusInput,
} from "./types.js";

export class CampaignManagerController {
  private config: CampaignManagerConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CampaignRunReport | null = null;
  private readonly manager: CampaignManagerCore;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CampaignPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    campaignsCreated: 0,
    campaignsScheduled: 0,
    campaignsApproved: 0,
    coordinationsRun: 0,
    executionsTracked: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: CampaignManagerCore, config: CampaignManagerConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCamLog({
      event: "engine_initialization",
      level: "info",
      details: "Campaign Manager ready (R5-07)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CampaignManagerConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CampaignManagerConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CampaignRunReport | null {
    return this.latestReport;
  }

  getManager(): CampaignManagerCore {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CampaignPerformanceStats {
    return { ...this.performance };
  }

  connectCampaignManager(input: ConnectCampaignManagerInput = {}): CampaignRunReport {
    if (!this.config.enabled) throw new Error("Campaign Manager is disabled");
    this.status = "connecting";
    const report = this.manager.connectCampaignManager(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createCampaign(input: CreateCampaignInput): CampaignRunReport {
    this.performance.campaignsCreated += 1;
    const report = this.manager.createCampaign(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  updateLifecycle(input: UpdateLifecycleInput): CampaignRunReport {
    const report = this.manager.updateLifecycle(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  setObjective(input: SetObjectiveInput): CampaignRunReport {
    const report = this.manager.setObjective(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  scheduleCampaign(input: ScheduleCampaignInput): CampaignRunReport {
    this.performance.campaignsScheduled += 1;
    const report = this.manager.scheduleCampaign(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  updateStatus(input: UpdateStatusInput): CampaignRunReport {
    const report = this.manager.updateStatus(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  coordinateChannels(input: CoordinateChannelsInput): CampaignRunReport {
    this.status = "coordinating";
    this.performance.coordinationsRun += 1;
    const report = this.manager.coordinateChannels(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  trackExecution(input: TrackExecutionInput = {}): CampaignRunReport {
    this.performance.executionsTracked += 1;
    const report = this.manager.trackExecution(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectFailures(input: DetectFailuresInput = {}): CampaignRunReport {
    this.performance.failuresDetected += 1;
    const report = this.manager.detectFailures(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  approveCampaign(input: ApproveCampaignInput): CampaignRunReport {
    this.performance.campaignsApproved += 1;
    const report = this.manager.approveCampaign(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: CampaignRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `${report.action} failed: ${report.validation.errors.join("; ")}`,
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
    appendCamLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
