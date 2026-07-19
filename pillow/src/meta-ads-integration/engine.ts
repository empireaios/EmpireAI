import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import {
  buildMetaAdsIntegrationConfiguration,
  type MetaAdsIntegrationConfiguration,
} from "./configuration.js";
import { appendMaiLog, getMaiLogs, resetMaiLogsForTesting } from "./mai-logging.js";
import { META_ADS_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectMetaAdsInput,
  CreateAdvertisementInput,
  CreateAdSetInput,
  CreateCampaignInput,
  ManageAdAccountInput,
  ManageBusinessAccountInput,
  MetaAdsIntegrationState,
  MetaAdsRunReport,
  MetaCockpitSnapshot,
  RetrievePerformanceInput,
  SyncCampaignStatusInput,
} from "./types.js";
import { MetaAdsIntegrationController } from "./meta-ads-integration-controller.js";
import { MetaAdsIntegrationManager } from "./meta-ads-integration-manager.js";

export interface MetaAdsIntegrationOptions {
  configuration?: Partial<MetaAdsIntegrationConfiguration>;
}

/**
 * Meta Ads Integration (PILLOW-MAI-001 / R5-02).
 * Facebook & Instagram advertising through the Marketing Framework — structural API, no live HTTP.
 */
export class MetaAdsIntegration {
  private initializedAt: string | null = null;
  private readonly controller: MetaAdsIntegrationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketingFramework: MarketingFrameworkEngine,
    options: MetaAdsIntegrationOptions = {},
  ) {
    const config = buildMetaAdsIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MetaAdsIntegrationManager(marketingFramework);
    this.controller = new MetaAdsIntegrationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MetaAdsIntegrationState> {
    const doc = await this.reader.readText(META_ADS_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("Meta Ads Integration")) {
      throw new Error(
        `${META_ADS_INTEGRATION_SYSTEM_PATH} missing — Meta Ads Integration requires R5-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMaiLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-02 Meta Ads Integration initialized",
    });
    return this.getState();
  }

  getState(): MetaAdsIntegrationState {
    if (!this.initializedAt) {
      throw new Error("Meta Ads Integration not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCampaigns: this.controller.getManager().getMetaRecords().length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-MAI-001",
      missionId: "R5-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectMetaAds(input: ConnectMetaAdsInput = {}): MetaAdsRunReport {
    return this.controller.connectMetaAds(input);
  }

  manageBusinessAccount(input: ManageBusinessAccountInput = {}): MetaAdsRunReport {
    return this.controller.manageBusinessAccount(input);
  }

  manageAdAccount(input: ManageAdAccountInput = {}): MetaAdsRunReport {
    return this.controller.manageAdAccount(input);
  }

  createCampaign(input: CreateCampaignInput): MetaAdsRunReport {
    return this.controller.createCampaign(input);
  }

  createAdSet(input: CreateAdSetInput): MetaAdsRunReport {
    return this.controller.createAdSet(input);
  }

  createAdvertisement(input: CreateAdvertisementInput): MetaAdsRunReport {
    return this.controller.createAdvertisement(input);
  }

  retrievePerformance(input: RetrievePerformanceInput = {}): MetaAdsRunReport {
    return this.controller.retrievePerformance(input);
  }

  syncCampaignStatus(input: SyncCampaignStatusInput = {}): MetaAdsRunReport {
    return this.controller.syncCampaignStatus(input);
  }

  getLatestReport(): MetaAdsRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getMetaRecords() {
    return this.controller.getManager().getMetaRecords();
  }

  updateConfiguration(
    overrides: Partial<MetaAdsIntegrationConfiguration>,
  ): MetaAdsIntegrationState {
    const next = buildMetaAdsIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Meta Ads status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No Meta Ads operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MetaCockpitSnapshot {
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
      recentLogs: getMaiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createMetaAdsIntegration(
  bootstrap: EmpireBootstrapContext,
  marketingFramework: MarketingFrameworkEngine,
  options?: MetaAdsIntegrationOptions,
): MetaAdsIntegration {
  return new MetaAdsIntegration(bootstrap, marketingFramework, options);
}

export function resetMetaAdsIntegrationForTesting(): void {
  resetMaiLogsForTesting();
  new MetaAdsIntegrationManager(null).resetForTesting();
}
