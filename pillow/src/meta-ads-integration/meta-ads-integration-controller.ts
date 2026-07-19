/** R5-02 — Meta Ads Integration Controller. */

import { appendMaiLog } from "./mai-logging.js";
import { MetaAdsIntegrationManager } from "./meta-ads-integration-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { MetaAdsIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectMetaAdsInput,
  CreateAdvertisementInput,
  CreateAdSetInput,
  CreateCampaignInput,
  EngineStatus,
  ManageAdAccountInput,
  ManageBusinessAccountInput,
  MetaAdsRunReport,
  MetaPerformanceStats,
  RetrievePerformanceInput,
  SyncCampaignStatusInput,
} from "./types.js";

export class MetaAdsIntegrationController {
  private config: MetaAdsIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: MetaAdsRunReport | null = null;
  private readonly manager: MetaAdsIntegrationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: MetaPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    authenticationAttempts: 0,
    campaignsCreated: 0,
    adSetsCreated: 0,
    advertisementsCreated: 0,
    performanceRetrievals: 0,
    statusSyncs: 0,
    rateLimitedOperations: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: MetaAdsIntegrationManager, config: MetaAdsIntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendMaiLog({
      event: "engine_initialization",
      level: "info",
      details: "Meta Ads Integration ready (R5-02)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MetaAdsIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MetaAdsIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): MetaAdsRunReport | null {
    return this.latestReport;
  }

  getManager(): MetaAdsIntegrationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): MetaPerformanceStats {
    return { ...this.performance };
  }

  connectMetaAds(input: ConnectMetaAdsInput = {}): MetaAdsRunReport {
    if (!this.config.enabled) throw new Error("Meta Ads Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendMaiLog({
      event: "connection_attempt",
      level: "info",
      details: "connectMetaAds started",
    });
    const report = this.manager.connectMetaAds(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageBusinessAccount(input: ManageBusinessAccountInput = {}): MetaAdsRunReport {
    const report = this.manager.manageBusinessAccount(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageAdAccount(input: ManageAdAccountInput = {}): MetaAdsRunReport {
    const report = this.manager.manageAdAccount(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createCampaign(input: CreateCampaignInput): MetaAdsRunReport {
    this.status = "syncing";
    this.performance.campaignsCreated += 1;
    const report = this.manager.createCampaign(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedOperations += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  createAdSet(input: CreateAdSetInput): MetaAdsRunReport {
    this.performance.adSetsCreated += 1;
    const report = this.manager.createAdSet(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createAdvertisement(input: CreateAdvertisementInput): MetaAdsRunReport {
    this.performance.advertisementsCreated += 1;
    const report = this.manager.createAdvertisement(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  retrievePerformance(input: RetrievePerformanceInput = {}): MetaAdsRunReport {
    this.performance.performanceRetrievals += 1;
    const report = this.manager.retrievePerformance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  syncCampaignStatus(input: SyncCampaignStatusInput = {}): MetaAdsRunReport {
    this.performance.statusSyncs += 1;
    const report = this.manager.syncCampaignStatus(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: MetaAdsRunReport): void {
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
    appendMaiLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
