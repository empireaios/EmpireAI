import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { MetaAdsIntegration } from "../meta-ads-integration/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import type { TikTokAdsIntegration } from "../tiktok-ads-integration/engine.js";
import type { YouTubeAdsIntegration } from "../youtube-ads-integration/engine.js";
import type { SeoIntelligenceEngine } from "../seo-intelligence-engine/engine.js";
import {
  buildCampaignManagerConfiguration,
  type CampaignManagerConfiguration,
} from "./configuration.js";
import { appendCamLog, getCamLogs, resetCamLogsForTesting } from "./cam-logging.js";
import { CAMPAIGN_MANAGER_SYSTEM_PATH } from "./paths.js";
import type {
  ApproveCampaignInput,
  CampaignCockpitSnapshot,
  CampaignManagerState,
  CampaignRunReport,
  ConnectCampaignManagerInput,
  CoordinateChannelsInput,
  CreateCampaignInput,
  DetectFailuresInput,
  ScheduleCampaignInput,
  SetObjectiveInput,
  TrackExecutionInput,
  UpdateLifecycleInput,
  UpdateStatusInput,
} from "./types.js";
import { CampaignManagerController } from "./campaign-manager-controller.js";
import { CampaignManagerCore } from "./campaign-manager-core.js";

export interface CampaignManagerEngineOptions {
  configuration?: Partial<CampaignManagerConfiguration>;
}

export type CampaignManagerDependencies = {
  marketingFramework: MarketingFrameworkEngine;
  metaAds: MetaAdsIntegration | null;
  googleAds: GoogleAdsIntegration | null;
  tiktokAds: TikTokAdsIntegration | null;
  youtubeAds: YouTubeAdsIntegration | null;
  seoIntelligence: SeoIntelligenceEngine | null;
};

/**
 * Campaign Manager Engine (PILLOW-CAM-001 / R5-07).
 * Unified cross-platform campaign control — structural orchestration, no live ad launches.
 */
export class CampaignManagerEngine {
  private initializedAt: string | null = null;
  private readonly controller: CampaignManagerController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CampaignManagerDependencies,
    options: CampaignManagerEngineOptions = {},
  ) {
    const config = buildCampaignManagerConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CampaignManagerCore(dependencies.marketingFramework, {
      meta: dependencies.metaAds,
      google: dependencies.googleAds,
      tiktok: dependencies.tiktokAds,
      youtube: dependencies.youtubeAds,
      seo: dependencies.seoIntelligence,
    });
    this.controller = new CampaignManagerController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CampaignManagerState> {
    const doc = await this.reader.readText(CAMPAIGN_MANAGER_SYSTEM_PATH);
    if (!doc?.includes("Campaign Manager")) {
      throw new Error(
        `${CAMPAIGN_MANAGER_SYSTEM_PATH} missing — Campaign Manager requires R5-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCamLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-07 Campaign Manager initialized",
    });
    return this.getState();
  }

  getState(): CampaignManagerState {
    if (!this.initializedAt) {
      throw new Error("Campaign Manager not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const campaigns = this.controller.getManager().getCampaignRecords();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCampaigns: campaigns.length,
      runningCampaigns: campaigns.filter((c) => c.campaignStatus === "running").length,
      failedCampaigns: campaigns.filter((c) => c.campaignStatus === "failed").length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CAM-001",
      missionId: "R5-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCampaignManager(input: ConnectCampaignManagerInput = {}): CampaignRunReport {
    return this.controller.connectCampaignManager(input);
  }

  createCampaign(input: CreateCampaignInput): CampaignRunReport {
    return this.controller.createCampaign(input);
  }

  updateLifecycle(input: UpdateLifecycleInput): CampaignRunReport {
    return this.controller.updateLifecycle(input);
  }

  setObjective(input: SetObjectiveInput): CampaignRunReport {
    return this.controller.setObjective(input);
  }

  scheduleCampaign(input: ScheduleCampaignInput): CampaignRunReport {
    return this.controller.scheduleCampaign(input);
  }

  updateStatus(input: UpdateStatusInput): CampaignRunReport {
    return this.controller.updateStatus(input);
  }

  coordinateChannels(input: CoordinateChannelsInput): CampaignRunReport {
    return this.controller.coordinateChannels(input);
  }

  trackExecution(input: TrackExecutionInput = {}): CampaignRunReport {
    return this.controller.trackExecution(input);
  }

  detectFailures(input: DetectFailuresInput = {}): CampaignRunReport {
    return this.controller.detectFailures(input);
  }

  approveCampaign(input: ApproveCampaignInput): CampaignRunReport {
    return this.controller.approveCampaign(input);
  }

  getLatestReport(): CampaignRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCampaignRecords() {
    return this.controller.getManager().getCampaignRecords();
  }

  updateConfiguration(
    overrides: Partial<CampaignManagerConfiguration>,
  ): CampaignManagerState {
    const next = buildCampaignManagerConfiguration(this.bootstrap.repositoryRoot, {
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
        `Campaign Manager status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No campaign operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CampaignCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const channelsConnected = record
      ? Object.values(record.channelDependencies).filter(Boolean).length
      : 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      campaignsCreated: state.performance.campaignsCreated,
      runningCampaigns: state.health.runningCampaigns,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      channelsConnected,
      recentLogs: getCamLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCampaignManagerEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: CampaignManagerDependencies,
  options?: CampaignManagerEngineOptions,
): CampaignManagerEngine {
  return new CampaignManagerEngine(bootstrap, dependencies, options);
}

export function resetCampaignManagerForTesting(): void {
  resetCamLogsForTesting();
  new CampaignManagerCore(null, {
    meta: null,
    google: null,
    tiktok: null,
    youtube: null,
    seo: null,
  }).resetForTesting();
}
