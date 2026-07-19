/** R5-03 — Google Ads Integration Controller. */

import { appendGaiLog } from "./gai-logging.js";
import { GoogleAdsIntegrationManager } from "./google-ads-integration-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { GoogleAdsIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectGoogleAdsInput,
  CreateGoogleAdvertisementInput,
  CreateAdGroupInput,
  CreateGoogleCampaignInput,
  EngineStatus,
  ManageAdvertisingAccountInput,
  ManageCustomerAccountInput,
  GoogleAdsRunReport,
  GoogleAdsPerformanceStats,
  RetrieveGooglePerformanceInput,
  SyncGoogleCampaignStatusInput,
} from "./types.js";

export class GoogleAdsIntegrationController {
  private config: GoogleAdsIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: GoogleAdsRunReport | null = null;
  private readonly manager: GoogleAdsIntegrationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: GoogleAdsPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    authenticationAttempts: 0,
    campaignsCreated: 0,
    adGroupsCreated: 0,
    advertisementsCreated: 0,
    performanceRetrievals: 0,
    statusSyncs: 0,
    rateLimitedOperations: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: GoogleAdsIntegrationManager, config: GoogleAdsIntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendGaiLog({
      event: "engine_initialization",
      level: "info",
      details: "Google Ads Integration ready (R5-03)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): GoogleAdsIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: GoogleAdsIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): GoogleAdsRunReport | null {
    return this.latestReport;
  }

  getManager(): GoogleAdsIntegrationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): GoogleAdsPerformanceStats {
    return { ...this.performance };
  }

  connectGoogleAds(input: ConnectGoogleAdsInput = {}): GoogleAdsRunReport {
    if (!this.config.enabled) throw new Error("Google Ads Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendGaiLog({
      event: "connection_attempt",
      level: "info",
      details: "connectGoogleAds started",
    });
    const report = this.manager.connectGoogleAds(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageCustomerAccount(input: ManageCustomerAccountInput = {}): GoogleAdsRunReport {
    const report = this.manager.manageCustomerAccount(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageAdvertisingAccount(input: ManageAdvertisingAccountInput = {}): GoogleAdsRunReport {
    const report = this.manager.manageAdvertisingAccount(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createCampaign(input: CreateGoogleCampaignInput): GoogleAdsRunReport {
    this.status = "syncing";
    this.performance.campaignsCreated += 1;
    const report = this.manager.createCampaign(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedOperations += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  createAdGroup(input: CreateAdGroupInput): GoogleAdsRunReport {
    this.performance.adGroupsCreated += 1;
    const report = this.manager.createAdGroup(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createAdvertisement(input: CreateGoogleAdvertisementInput): GoogleAdsRunReport {
    this.performance.advertisementsCreated += 1;
    const report = this.manager.createAdvertisement(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  retrievePerformance(input: RetrieveGooglePerformanceInput = {}): GoogleAdsRunReport {
    this.performance.performanceRetrievals += 1;
    const report = this.manager.retrievePerformance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  syncCampaignStatus(input: SyncGoogleCampaignStatusInput = {}): GoogleAdsRunReport {
    this.performance.statusSyncs += 1;
    const report = this.manager.syncCampaignStatus(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: GoogleAdsRunReport): void {
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
    appendGaiLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
