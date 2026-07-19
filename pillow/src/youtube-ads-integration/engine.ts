import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import {
  buildYouTubeAdsIntegrationConfiguration,
  type YouTubeAdsIntegrationConfiguration,
} from "./configuration.js";
import { appendYaiLog, getYaiLogs, resetYaiLogsForTesting } from "./yai-logging.js";
import { YOUTUBE_ADS_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectYouTubeAdsInput,
  CreateVideoAdvertisementInput,
  CreateAdGroupInput,
  CreateYouTubeCampaignInput,
  ManageAdvertiserAccountInput,
  ManageVideoAssetInput,
  YouTubeAdsIntegrationState,
  YouTubeAdsRunReport,
  YouTubeAdsCockpitSnapshot,
  RetrieveYouTubePerformanceInput,
  SyncYouTubeCampaignStatusInput,
} from "./types.js";
import { YouTubeAdsIntegrationController } from "./youtube-ads-integration-controller.js";
import { YouTubeAdsIntegrationManager } from "./youtube-ads-integration-manager.js";

export interface YouTubeAdsIntegrationOptions {
  configuration?: Partial<YouTubeAdsIntegrationConfiguration>;
}

/**
 * YouTube Ads Integration (PILLOW-YAI-001 / R5-05).
 * YouTube advertising via Google Ads APIs through Marketing Framework — structural API, no live HTTP.
 */
export class YouTubeAdsIntegration {
  private initializedAt: string | null = null;
  private readonly controller: YouTubeAdsIntegrationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketingFramework: MarketingFrameworkEngine,
    googleAdsIntegration: GoogleAdsIntegration | null,
    options: YouTubeAdsIntegrationOptions = {},
  ) {
    const config = buildYouTubeAdsIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new YouTubeAdsIntegrationManager(marketingFramework, googleAdsIntegration);
    this.controller = new YouTubeAdsIntegrationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<YouTubeAdsIntegrationState> {
    const doc = await this.reader.readText(YOUTUBE_ADS_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("YouTube Ads Integration")) {
      throw new Error(
        `${YOUTUBE_ADS_INTEGRATION_SYSTEM_PATH} missing — YouTube Ads Integration requires R5-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendYaiLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-05 YouTube Ads Integration initialized",
    });
    return this.getState();
  }

  getState(): YouTubeAdsIntegrationState {
    if (!this.initializedAt) {
      throw new Error("YouTube Ads Integration not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCampaigns: this.controller.getManager().getYouTubeAdsRecords().length,
      totalVideoAssets: this.controller.getManager().getVideoAssetCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-YAI-001",
      missionId: "R5-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectYouTubeAds(input: ConnectYouTubeAdsInput = {}): YouTubeAdsRunReport {
    return this.controller.connectYouTubeAds(input);
  }

  manageAdvertiserAccount(input: ManageAdvertiserAccountInput = {}): YouTubeAdsRunReport {
    return this.controller.manageAdvertiserAccount(input);
  }

  createCampaign(input: CreateYouTubeCampaignInput): YouTubeAdsRunReport {
    return this.controller.createCampaign(input);
  }

  createAdGroup(input: CreateAdGroupInput): YouTubeAdsRunReport {
    return this.controller.createAdGroup(input);
  }

  manageVideoAsset(input: ManageVideoAssetInput): YouTubeAdsRunReport {
    return this.controller.manageVideoAsset(input);
  }

  createVideoAdvertisement(input: CreateVideoAdvertisementInput): YouTubeAdsRunReport {
    return this.controller.createVideoAdvertisement(input);
  }

  retrievePerformance(input: RetrieveYouTubePerformanceInput = {}): YouTubeAdsRunReport {
    return this.controller.retrievePerformance(input);
  }

  syncCampaignStatus(input: SyncYouTubeCampaignStatusInput = {}): YouTubeAdsRunReport {
    return this.controller.syncCampaignStatus(input);
  }

  getLatestReport(): YouTubeAdsRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getYouTubeAdsRecords() {
    return this.controller.getManager().getYouTubeAdsRecords();
  }

  updateConfiguration(
    overrides: Partial<YouTubeAdsIntegrationConfiguration>,
  ): YouTubeAdsIntegrationState {
    const next = buildYouTubeAdsIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `YouTube Ads status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No YouTube Ads operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): YouTubeAdsCockpitSnapshot {
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
      videoAssetsManaged: state.performance.videoAssetsManaged,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      googleAdsDependencyPresent: Boolean(record?.googleAdsDependencyPresent),
      recentLogs: getYaiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createYouTubeAdsIntegration(
  bootstrap: EmpireBootstrapContext,
  marketingFramework: MarketingFrameworkEngine,
  googleAdsIntegration: GoogleAdsIntegration | null,
  options?: YouTubeAdsIntegrationOptions,
): YouTubeAdsIntegration {
  return new YouTubeAdsIntegration(
    bootstrap,
    marketingFramework,
    googleAdsIntegration,
    options,
  );
}

export function resetYouTubeAdsIntegrationForTesting(): void {
  resetYaiLogsForTesting();
  new YouTubeAdsIntegrationManager(null, null).resetForTesting();
}
