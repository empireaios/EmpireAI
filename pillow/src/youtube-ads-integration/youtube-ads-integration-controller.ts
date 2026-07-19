/** R5-05 — YouTube Ads Integration Controller. */

import { appendYaiLog } from "./yai-logging.js";
import { YouTubeAdsIntegrationManager } from "./youtube-ads-integration-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { YouTubeAdsIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectYouTubeAdsInput,
  CreateVideoAdvertisementInput,
  CreateAdGroupInput,
  CreateYouTubeCampaignInput,
  EngineStatus,
  ManageAdvertiserAccountInput,
  ManageVideoAssetInput,
  YouTubeAdsRunReport,
  YouTubeAdsPerformanceStats,
  RetrieveYouTubePerformanceInput,
  SyncYouTubeCampaignStatusInput,
} from "./types.js";

export class YouTubeAdsIntegrationController {
  private config: YouTubeAdsIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: YouTubeAdsRunReport | null = null;
  private readonly manager: YouTubeAdsIntegrationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: YouTubeAdsPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    authenticationAttempts: 0,
    campaignsCreated: 0,
    adGroupsCreated: 0,
    videoAdvertisementsCreated: 0,
    videoAssetsManaged: 0,
    performanceRetrievals: 0,
    statusSyncs: 0,
    rateLimitedOperations: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: YouTubeAdsIntegrationManager, config: YouTubeAdsIntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendYaiLog({
      event: "engine_initialization",
      level: "info",
      details: "YouTube Ads Integration ready (R5-05)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): YouTubeAdsIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: YouTubeAdsIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): YouTubeAdsRunReport | null {
    return this.latestReport;
  }

  getManager(): YouTubeAdsIntegrationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): YouTubeAdsPerformanceStats {
    return { ...this.performance };
  }

  connectYouTubeAds(input: ConnectYouTubeAdsInput = {}): YouTubeAdsRunReport {
    if (!this.config.enabled) throw new Error("YouTube Ads Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendYaiLog({
      event: "connection_attempt",
      level: "info",
      details: "connectYouTubeAds started",
    });
    const report = this.manager.connectYouTubeAds(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageAdvertiserAccount(input: ManageAdvertiserAccountInput = {}): YouTubeAdsRunReport {
    const report = this.manager.manageAdvertiserAccount(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createCampaign(input: CreateYouTubeCampaignInput): YouTubeAdsRunReport {
    this.status = "syncing";
    this.performance.campaignsCreated += 1;
    const report = this.manager.createCampaign(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedOperations += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  createAdGroup(input: CreateAdGroupInput): YouTubeAdsRunReport {
    this.performance.adGroupsCreated += 1;
    const report = this.manager.createAdGroup(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageVideoAsset(input: ManageVideoAssetInput): YouTubeAdsRunReport {
    this.performance.videoAssetsManaged += 1;
    const report = this.manager.manageVideoAsset(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createVideoAdvertisement(input: CreateVideoAdvertisementInput): YouTubeAdsRunReport {
    this.performance.videoAdvertisementsCreated += 1;
    const report = this.manager.createVideoAdvertisement(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  retrievePerformance(input: RetrieveYouTubePerformanceInput = {}): YouTubeAdsRunReport {
    this.performance.performanceRetrievals += 1;
    const report = this.manager.retrievePerformance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  syncCampaignStatus(input: SyncYouTubeCampaignStatusInput = {}): YouTubeAdsRunReport {
    this.performance.statusSyncs += 1;
    const report = this.manager.syncCampaignStatus(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: YouTubeAdsRunReport): void {
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
    appendYaiLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
