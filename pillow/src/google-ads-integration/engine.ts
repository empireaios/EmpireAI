import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import {
  buildGoogleAdsIntegrationConfiguration,
  type GoogleAdsIntegrationConfiguration,
} from "./configuration.js";
import { appendGaiLog, getGaiLogs, resetGaiLogsForTesting } from "./gai-logging.js";
import { GOOGLE_ADS_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectGoogleAdsInput,
  CreateGoogleAdvertisementInput,
  CreateAdGroupInput,
  CreateGoogleCampaignInput,
  ManageAdvertisingAccountInput,
  ManageCustomerAccountInput,
  GoogleAdsIntegrationState,
  GoogleAdsRunReport,
  GoogleAdsCockpitSnapshot,
  RetrieveGooglePerformanceInput,
  SyncGoogleCampaignStatusInput,
} from "./types.js";
import { GoogleAdsIntegrationController } from "./google-ads-integration-controller.js";
import { GoogleAdsIntegrationManager } from "./google-ads-integration-manager.js";

export interface GoogleAdsIntegrationOptions {
  configuration?: Partial<GoogleAdsIntegrationConfiguration>;
}

/**
 * Google Ads Integration (PILLOW-GAI-001 / R5-03).
 * Google advertising through the Marketing Framework — structural API, no live HTTP.
 */
export class GoogleAdsIntegration {
  private initializedAt: string | null = null;
  private readonly controller: GoogleAdsIntegrationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketingFramework: MarketingFrameworkEngine,
    options: GoogleAdsIntegrationOptions = {},
  ) {
    const config = buildGoogleAdsIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new GoogleAdsIntegrationManager(marketingFramework);
    this.controller = new GoogleAdsIntegrationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<GoogleAdsIntegrationState> {
    const doc = await this.reader.readText(GOOGLE_ADS_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("Google Ads Integration")) {
      throw new Error(
        `${GOOGLE_ADS_INTEGRATION_SYSTEM_PATH} missing — Google Ads Integration requires R5-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendGaiLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-03 Google Ads Integration initialized",
    });
    return this.getState();
  }

  getState(): GoogleAdsIntegrationState {
    if (!this.initializedAt) {
      throw new Error("Google Ads Integration not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCampaigns: this.controller.getManager().getGoogleAdsRecords().length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-GAI-001",
      missionId: "R5-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectGoogleAds(input: ConnectGoogleAdsInput = {}): GoogleAdsRunReport {
    return this.controller.connectGoogleAds(input);
  }

  manageCustomerAccount(input: ManageCustomerAccountInput = {}): GoogleAdsRunReport {
    return this.controller.manageCustomerAccount(input);
  }

  manageAdvertisingAccount(input: ManageAdvertisingAccountInput = {}): GoogleAdsRunReport {
    return this.controller.manageAdvertisingAccount(input);
  }

  createCampaign(input: CreateGoogleCampaignInput): GoogleAdsRunReport {
    return this.controller.createCampaign(input);
  }

  createAdGroup(input: CreateAdGroupInput): GoogleAdsRunReport {
    return this.controller.createAdGroup(input);
  }

  createAdvertisement(input: CreateGoogleAdvertisementInput): GoogleAdsRunReport {
    return this.controller.createAdvertisement(input);
  }

  retrievePerformance(input: RetrieveGooglePerformanceInput = {}): GoogleAdsRunReport {
    return this.controller.retrievePerformance(input);
  }

  syncCampaignStatus(input: SyncGoogleCampaignStatusInput = {}): GoogleAdsRunReport {
    return this.controller.syncCampaignStatus(input);
  }

  getLatestReport(): GoogleAdsRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getGoogleAdsRecords() {
    return this.controller.getManager().getGoogleAdsRecords();
  }

  updateConfiguration(
    overrides: Partial<GoogleAdsIntegrationConfiguration>,
  ): GoogleAdsIntegrationState {
    const next = buildGoogleAdsIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Google Ads status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No Google Ads operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): GoogleAdsCockpitSnapshot {
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
      recentLogs: getGaiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createGoogleAdsIntegration(
  bootstrap: EmpireBootstrapContext,
  marketingFramework: MarketingFrameworkEngine,
  options?: GoogleAdsIntegrationOptions,
): GoogleAdsIntegration {
  return new GoogleAdsIntegration(bootstrap, marketingFramework, options);
}

export function resetGoogleAdsIntegrationForTesting(): void {
  resetGaiLogsForTesting();
  new GoogleAdsIntegrationManager(null).resetForTesting();
}
