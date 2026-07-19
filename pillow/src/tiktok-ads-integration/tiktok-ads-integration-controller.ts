/** R5-04 — TikTok Ads Integration Controller. */

import { appendTaiLog } from "./tai-logging.js";
import { TikTokAdsIntegrationManager } from "./tiktok-ads-integration-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { TikTokAdsIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectTikTokAdsInput,
  CreateTikTokAdvertisementInput,
  CreateAdGroupInput,
  CreateTikTokCampaignInput,
  EngineStatus,
  ManageAdvertiserAccountInput,
  TikTokAdsRunReport,
  TikTokAdsPerformanceStats,
  RetrieveTikTokPerformanceInput,
  SyncTikTokCampaignStatusInput,
  SyncTikTokAudienceInput,
} from "./types.js";

export class TikTokAdsIntegrationController {
  private config: TikTokAdsIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: TikTokAdsRunReport | null = null;
  private readonly manager: TikTokAdsIntegrationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: TikTokAdsPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    authenticationAttempts: 0,
    campaignsCreated: 0,
    adGroupsCreated: 0,
    advertisementsCreated: 0,
    performanceRetrievals: 0,
    statusSyncs: 0,
    audienceSyncs: 0,
    rateLimitedOperations: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: TikTokAdsIntegrationManager, config: TikTokAdsIntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendTaiLog({
      event: "engine_initialization",
      level: "info",
      details: "TikTok Ads Integration ready (R5-04)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): TikTokAdsIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: TikTokAdsIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): TikTokAdsRunReport | null {
    return this.latestReport;
  }

  getManager(): TikTokAdsIntegrationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): TikTokAdsPerformanceStats {
    return { ...this.performance };
  }

  connectTikTokAds(input: ConnectTikTokAdsInput = {}): TikTokAdsRunReport {
    if (!this.config.enabled) throw new Error("TikTok Ads Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendTaiLog({
      event: "connection_attempt",
      level: "info",
      details: "connectTikTokAds started",
    });
    const report = this.manager.connectTikTokAds(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageAdvertiserAccount(input: ManageAdvertiserAccountInput = {}): TikTokAdsRunReport {
    const report = this.manager.manageAdvertiserAccount(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createCampaign(input: CreateTikTokCampaignInput): TikTokAdsRunReport {
    this.status = "syncing";
    this.performance.campaignsCreated += 1;
    const report = this.manager.createCampaign(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedOperations += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  createAdGroup(input: CreateAdGroupInput): TikTokAdsRunReport {
    this.performance.adGroupsCreated += 1;
    const report = this.manager.createAdGroup(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createAdvertisement(input: CreateTikTokAdvertisementInput): TikTokAdsRunReport {
    this.performance.advertisementsCreated += 1;
    const report = this.manager.createAdvertisement(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  retrievePerformance(input: RetrieveTikTokPerformanceInput = {}): TikTokAdsRunReport {
    this.performance.performanceRetrievals += 1;
    const report = this.manager.retrievePerformance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  syncCampaignStatus(input: SyncTikTokCampaignStatusInput = {}): TikTokAdsRunReport {
    this.performance.statusSyncs += 1;
    const report = this.manager.syncCampaignStatus(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  syncAudience(input: SyncTikTokAudienceInput = {}): TikTokAdsRunReport {
    this.performance.audienceSyncs += 1;
    const report = this.manager.syncAudience(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: TikTokAdsRunReport): void {
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
    appendTaiLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
