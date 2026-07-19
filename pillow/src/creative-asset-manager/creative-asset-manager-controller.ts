/** R5-11 — Creative Asset Manager Controller. */

import { appendCraLog } from "./cra-logging.js";
import { CreativeAssetManagerCore } from "./creative-asset-manager-core.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CreativeAssetManagerConfiguration } from "./configuration.js";
import type {
  ApproveAssetInput,
  ClassifyAssetInput,
  ConnectCreativeAssetManagerInput,
  CreateAssetInput,
  CreateVersionInput,
  CreativePerformanceStats,
  CreativeRunReport,
  EngineStatus,
  SearchAssetsInput,
  TagAssetInput,
  TrackUsageInput,
  UpdateAssetInput,
} from "./types.js";

export class CreativeAssetManagerController {
  private config: CreativeAssetManagerConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CreativeRunReport | null = null;
  private readonly manager: CreativeAssetManagerCore;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CreativePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    assetsCreated: 0,
    versionsCreated: 0,
    approvalsProcessed: 0,
    usageEventsTracked: 0,
    searchesRun: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: CreativeAssetManagerCore, config: CreativeAssetManagerConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCraLog({
      event: "engine_initialization",
      level: "info",
      details: "Creative Asset Manager ready (R5-11)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CreativeAssetManagerConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CreativeAssetManagerConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CreativeRunReport | null {
    return this.latestReport;
  }

  getManager(): CreativeAssetManagerCore {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CreativePerformanceStats {
    return { ...this.performance };
  }

  connectCreativeAssetManager(
    input: ConnectCreativeAssetManagerInput = {},
  ): CreativeRunReport {
    if (!this.config.enabled) throw new Error("Creative Asset Manager is disabled");
    this.status = "connecting";
    const report = this.manager.connectCreativeAssetManager(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createAsset(input: CreateAssetInput): CreativeRunReport {
    this.performance.assetsCreated += 1;
    const report = this.manager.createAsset(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  updateAsset(input: UpdateAssetInput): CreativeRunReport {
    const report = this.manager.updateAsset(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createVersion(input: CreateVersionInput): CreativeRunReport {
    this.performance.versionsCreated += 1;
    const report = this.manager.createVersion(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  approveAsset(input: ApproveAssetInput): CreativeRunReport {
    this.performance.approvalsProcessed += 1;
    const report = this.manager.approveAsset(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  tagAsset(input: TagAssetInput): CreativeRunReport {
    const report = this.manager.tagAsset(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  trackUsage(input: TrackUsageInput): CreativeRunReport {
    this.performance.usageEventsTracked += 1;
    const report = this.manager.trackUsage(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  searchAssets(input: SearchAssetsInput = {}): CreativeRunReport {
    this.status = "indexing";
    this.performance.searchesRun += 1;
    const report = this.manager.searchAssets(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  classifyAsset(input: ClassifyAssetInput): CreativeRunReport {
    const report = this.manager.classifyAsset(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: CreativeRunReport): void {
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
    appendCraLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
