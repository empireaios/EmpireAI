import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import {
  buildTikTokAdsIntegrationConfiguration,
  type TikTokAdsIntegrationConfiguration,
} from "./configuration.js";
import { appendTaiLog, getTaiLogs, resetTaiLogsForTesting } from "./tai-logging.js";
import { TIKTOK_ADS_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectTikTokAdsInput,
  CreateTikTokAdvertisementInput,
  CreateAdGroupInput,
  CreateTikTokCampaignInput,
  ManageAdvertiserAccountInput,
  TikTokAdsIntegrationState,
  TikTokAdsRunReport,
  TikTokAdsCockpitSnapshot,
  RetrieveTikTokPerformanceInput,
  SyncTikTokCampaignStatusInput,
  SyncTikTokAudienceInput,
} from "./types.js";
import { TikTokAdsIntegrationController } from "./tiktok-ads-integration-controller.js";
import { TikTokAdsIntegrationManager } from "./tiktok-ads-integration-manager.js";

export interface TikTokAdsIntegrationOptions {
  configuration?: Partial<TikTokAdsIntegrationConfiguration>;
}

/**
 * TikTok Ads Integration (PILLOW-TAI-001 / R5-04).
 * TikTok advertising through the Marketing Framework — structural API, no live HTTP.
 */
export class TikTokAdsIntegration {
  private initializedAt: string | null = null;
  private readonly controller: TikTokAdsIntegrationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketingFramework: MarketingFrameworkEngine,
    options: TikTokAdsIntegrationOptions = {},
  ) {
    const config = buildTikTokAdsIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new TikTokAdsIntegrationManager(marketingFramework);
    this.controller = new TikTokAdsIntegrationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<TikTokAdsIntegrationState> {
    const doc = await this.reader.readText(TIKTOK_ADS_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("TikTok Ads Integration")) {
      throw new Error(
        `${TIKTOK_ADS_INTEGRATION_SYSTEM_PATH} missing — TikTok Ads Integration requires R5-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendTaiLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-04 TikTok Ads Integration initialized",
    });
    return this.getState();
  }

  getState(): TikTokAdsIntegrationState {
    if (!this.initializedAt) {
      throw new Error("TikTok Ads Integration not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCampaigns: this.controller.getManager().getTikTokAdsRecords().length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-TAI-001",
      missionId: "R5-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectTikTokAds(input: ConnectTikTokAdsInput = {}): TikTokAdsRunReport {
    return this.controller.connectTikTokAds(input);
  }

  manageAdvertiserAccount(input: ManageAdvertiserAccountInput = {}): TikTokAdsRunReport {
    return this.controller.manageAdvertiserAccount(input);
  }

  createCampaign(input: CreateTikTokCampaignInput): TikTokAdsRunReport {
    return this.controller.createCampaign(input);
  }

  createAdGroup(input: CreateAdGroupInput): TikTokAdsRunReport {
    return this.controller.createAdGroup(input);
  }

  createAdvertisement(input: CreateTikTokAdvertisementInput): TikTokAdsRunReport {
    return this.controller.createAdvertisement(input);
  }

  retrievePerformance(input: RetrieveTikTokPerformanceInput = {}): TikTokAdsRunReport {
    return this.controller.retrievePerformance(input);
  }

  syncCampaignStatus(input: SyncTikTokCampaignStatusInput = {}): TikTokAdsRunReport {
    return this.controller.syncCampaignStatus(input);
  }

  syncAudience(input: SyncTikTokAudienceInput = {}): TikTokAdsRunReport {
    return this.controller.syncAudience(input);
  }

  getLatestReport(): TikTokAdsRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getTikTokAdsRecords() {
    return this.controller.getManager().getTikTokAdsRecords();
  }

  updateConfiguration(
    overrides: Partial<TikTokAdsIntegrationConfiguration>,
  ): TikTokAdsIntegrationState {
    const next = buildTikTokAdsIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `TikTok Ads status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No TikTok Ads operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TikTokAdsCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      authenticationStatus: record?.authenticationStatus ?? null,
      connectionStatus: record?.connectionStatus ?? null,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      campaignsCreated: state.performance.campaignsCreated,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getTaiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createTikTokAdsIntegration(
  bootstrap: EmpireBootstrapContext,
  marketingFramework: MarketingFrameworkEngine,
  options?: TikTokAdsIntegrationOptions,
): TikTokAdsIntegration {
  return new TikTokAdsIntegration(bootstrap, marketingFramework, options);
}

export function resetTikTokAdsIntegrationForTesting(): void {
  resetTaiLogsForTesting();
  new TikTokAdsIntegrationManager(null).resetForTesting();
}
