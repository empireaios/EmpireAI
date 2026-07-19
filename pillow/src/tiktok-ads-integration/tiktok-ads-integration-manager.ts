/** R5-04 — TikTok Ads Integration Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import {
  TAI_METADATA_VERSION,
  TIKTOK_ADS_INTEGRATION_ID,
  TIKTOK_ADS_API_ENDPOINTS,
} from "./paths.js";
import { appendTaiLog } from "./tai-logging.js";
import { TikTokAuthenticationManager } from "./tiktok-authentication-manager.js";
import { TikTokAdsApiClient } from "./tiktok-ads-api-client.js";
import { AdvertiserAccountManager } from "./advertiser-account-manager.js";
import { CampaignSynchronizationEngine } from "./campaign-synchronization-engine.js";
import { PerformanceRetrievalEngine } from "./performance-retrieval-engine.js";
import { TikTokAdsValidator } from "./tiktok-ads-validator.js";
import { TikTokAdsMetadataGenerator, mapAuthToValidation } from "./tiktok-ads-metadata-generator.js";
import type { TikTokAdsIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectTikTokAdsInput,
  CreateTikTokAdvertisementInput,
  CreateAdGroupInput,
  CreateTikTokCampaignInput,
  ManageAdvertiserAccountInput,
  TikTokAdsRunReport,
  TikTokAdsEngineRecord,
  RetrieveTikTokPerformanceInput,
  SyncTikTokCampaignStatusInput,
  SyncTikTokAudienceInput,
} from "./types.js";

export class TikTokAdsIntegrationManager {
  private engineRecord: TikTokAdsEngineRecord | null = null;
  private readonly authManager = new TikTokAuthenticationManager();
  private readonly apiClient = new TikTokAdsApiClient();
  private readonly advertiserAccountManager = new AdvertiserAccountManager();
  private readonly campaignEngine = new CampaignSynchronizationEngine();
  private readonly performanceEngine: PerformanceRetrievalEngine;
  private readonly validator = new TikTokAdsValidator();
  private readonly metadataGenerator = new TikTokAdsMetadataGenerator();
  private readonly rateWindows = new Map<string, { count: number; windowStart: number }>();

  constructor(private readonly framework: MarketingFrameworkEngine | null) {
    this.performanceEngine = new PerformanceRetrievalEngine(this.campaignEngine);
  }

  getEngineRecord(): TikTokAdsEngineRecord | null {
    return this.engineRecord;
  }

  getTikTokAdsRecords() {
    return this.campaignEngine.list();
  }

  private checkRateLimit(config: TikTokAdsIntegrationConfiguration): boolean {
    if (!config.rateLimitEnabled) return true;
    const key = TIKTOK_ADS_INTEGRATION_ID;
    const now = Date.now();
    let state = this.rateWindows.get(key);
    if (!state || now - state.windowStart >= config.rateLimitWindowMs) {
      state = { count: 0, windowStart: now };
      this.rateWindows.set(key, state);
    }
    if (state.count >= config.operationsPerMinute) return false;
    state.count += 1;
    return true;
  }

  private requireConnected(): TikTokAdsEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error("TikTok Ads Integration not connected — call connectTikTokAds first");
    }
    return this.engineRecord;
  }

  registerWithFramework(
    config: TikTokAdsIntegrationConfiguration,
  ): { frameworkModuleId: string | null; validation: TikTokAdsRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? TIKTOK_ADS_API_ENDPOINTS.sandbox
      : TIKTOK_ADS_API_ENDPOINTS.production;

    const report = this.framework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: TIKTOK_ADS_INTEGRATION_ID,
        moduleVersion: TAI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "R5-04",
        authenticationMethod: "oauth2",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1.3",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "tiktok.campaign.created",
            "tiktok.campaign.synced",
            "tiktok.audience.synced",
            "tiktok.performance.retrieved",
            "tiktok.ads.failed",
          ],
          maxEventsPerMinute: config.operationsPerMinute,
          windowMs: config.rateLimitWindowMs,
        },
        rateLimitConfig: {
          enabled: config.rateLimitEnabled,
          requestsPerMinute: config.operationsPerMinute,
          burstLimit: config.burstLimit,
          windowMs: config.rateLimitWindowMs,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "marketing_module_registration",
          "marketing_module_activation",
          "marketing_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendTaiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered TikTok Ads with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `tai-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: TAI_METADATA_VERSION,
      },
    };
  }

  connectTikTokAds(
    input: ConnectTikTokAdsInput,
    config: TikTokAdsIntegrationConfiguration,
  ): TikTokAdsRunReport {
    const started = Date.now();
    const credentialRef = input.credentialRef ?? config.credentialRef;

    const frameworkReg = this.registerWithFramework(config);
    if (frameworkReg.validation.decision === "fail") {
      const auth = this.authManager.authenticate(credentialRef, config);
      const record = this.metadataGenerator.buildEngineRecord({
        frameworkModuleId: null,
        auth,
        connection: null,
        operationalState: "failed",
        validationStatus: "failed",
        credentialRefPresent: auth.credentialRefPresent,
        advertiserAccountId: null,
      });
      this.engineRecord = record;
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        engineRecord: record,
        tiktokAdsRecords: [],
        validation: frameworkReg.validation,
        durationMs: Date.now() - started,
      });
    }

    const auth = this.authManager.authenticate(credentialRef, config);
    if (!auth.authenticated) {
      const record = this.metadataGenerator.buildEngineRecord({
        frameworkModuleId: frameworkReg.frameworkModuleId,
        auth,
        connection: null,
        operationalState: "failed",
        validationStatus: "failed",
        credentialRefPresent: auth.credentialRefPresent,
        advertiserAccountId: null,
      });
      this.engineRecord = record;
      const validation = this.validator.validateEngineRecord(record);
      validation.decision = "fail";
      validation.errors.push("TikTok authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        engineRecord: record,
        tiktokAdsRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const accounts = this.advertiserAccountManager.manageAdvertiserAccount(
      {
        advertiserAccountId: input.advertiserAccountId ?? config.defaultAdvertiserAccountId,
      },
      config,
    );

    if (this.framework) {
      this.framework.activateMarketingModule(TIKTOK_ADS_INTEGRATION_ID);
    }

    const connection = this.apiClient.testConnection(config);
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      auth,
      connection,
      operationalState: connection.passed ? "active" : "failed",
      validationStatus: mapAuthToValidation(auth, connection),
      credentialRefPresent: auth.credentialRefPresent,
      advertiserAccountId: accounts.advertiserAccountId,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendTaiLog({
      event: "connection_complete",
      level: "info",
      details: `TikTok Ads connected · auth=${auth.authenticationStatus}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      tiktokAdsRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  manageAdvertiserAccount(
    input: ManageAdvertiserAccountInput,
    config: TikTokAdsIntegrationConfiguration,
  ): TikTokAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const accounts = this.advertiserAccountManager.manageAdvertiserAccount(input, config);
    engine.advertiserAccountId = accounts.advertiserAccountId;
    engine.timestamp = new Date().toISOString();
    this.engineRecord = engine;
    return this.metadataGenerator.buildRunReport({
      action: "manage_advertiser_account",
      engineRecord: engine,
      tiktokAdsRecords: [],
      validation: this.validator.validateEngineRecord(engine),
      durationMs: Date.now() - started,
    });
  }

  createCampaign(
    input: CreateTikTokCampaignInput,
    config: TikTokAdsIntegrationConfiguration,
  ): TikTokAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateCampaignCreation(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "create_campaign",
        engineRecord: engine,
        tiktokAdsRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (!this.checkRateLimit(config)) {
      validation.decision = "partial";
      validation.warnings.push("Operation was rate limited");
      return this.metadataGenerator.buildRunReport({
        action: "create_campaign",
        engineRecord: engine,
        tiktokAdsRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const accounts = this.advertiserAccountManager.ensureDefaults(config);
    const record = this.campaignEngine.createCampaign({
      campaignName: input.campaignName,
      advertiserAccountId: input.advertiserAccountId ?? accounts.advertiserAccountId,
      objective: input.objective,
    });
    const recordValidation = this.validator.validateTikTokAdsRecord(record);
    if (recordValidation.decision === "fail") {
      validation.decision = "fail";
      validation.errors.push(...recordValidation.errors);
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_campaign",
      engineRecord: engine,
      tiktokAdsRecords: [record],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createAdGroup(
    input: CreateAdGroupInput,
    config: TikTokAdsIntegrationConfiguration,
  ): TikTokAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!this.checkRateLimit(config)) {
      return this.metadataGenerator.buildRunReport({
        action: "create_ad_group",
        engineRecord: engine,
        tiktokAdsRecords: [],
        validation: {
          validationReportId: `tai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Operation was rate limited"],
          durationMs: Date.now() - started,
          metadataVersion: TAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.campaignEngine.createAdGroup(input);
    if (!record) {
      return this.metadataGenerator.buildRunReport({
        action: "create_ad_group",
        engineRecord: engine,
        tiktokAdsRecords: [],
        validation: {
          validationReportId: `tai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Campaign not found for ad group creation"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: TAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_ad_group",
      engineRecord: engine,
      tiktokAdsRecords: [record],
      validation: this.validator.validateTikTokAdsRecord(record),
      durationMs: Date.now() - started,
    });
  }

  createAdvertisement(
    input: CreateTikTokAdvertisementInput,
    config: TikTokAdsIntegrationConfiguration,
  ): TikTokAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!this.checkRateLimit(config)) {
      return this.metadataGenerator.buildRunReport({
        action: "create_advertisement",
        engineRecord: engine,
        tiktokAdsRecords: [],
        validation: {
          validationReportId: `tai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Operation was rate limited"],
          durationMs: Date.now() - started,
          metadataVersion: TAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.campaignEngine.createAdvertisement(input);
    if (!record) {
      return this.metadataGenerator.buildRunReport({
        action: "create_advertisement",
        engineRecord: engine,
        tiktokAdsRecords: [],
        validation: {
          validationReportId: `tai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Campaign or ad group not found for advertisement creation"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: TAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_advertisement",
      engineRecord: engine,
      tiktokAdsRecords: [record],
      validation: this.validator.validateTikTokAdsRecord(record),
      durationMs: Date.now() - started,
    });
  }

  retrievePerformance(
    input: RetrieveTikTokPerformanceInput,
    _config: TikTokAdsIntegrationConfiguration,
  ): TikTokAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.performanceEngine.retrieve(input.campaignReference);
    const validation =
      records.length === 0
        ? {
            validationReportId: `tai-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail" as const,
            errors: ["No campaigns available for performance retrieval"],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: TAI_METADATA_VERSION,
          }
        : this.validator.validateTikTokAdsRecord(records[0]!);

    return this.metadataGenerator.buildRunReport({
      action: "retrieve_performance",
      engineRecord: engine,
      tiktokAdsRecords: records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  syncCampaignStatus(
    input: SyncTikTokCampaignStatusInput,
    config: TikTokAdsIntegrationConfiguration,
  ): TikTokAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();

    if (!config.campaignSynchronizationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "sync_campaign_status",
        engineRecord: engine,
        tiktokAdsRecords: [],
        validation: {
          validationReportId: `tai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Campaign synchronization rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: TAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const records = this.campaignEngine.syncStatus(input.campaignReference);
    const validation =
      records.length === 0
        ? {
            validationReportId: `tai-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail" as const,
            errors: ["No campaigns available to synchronize"],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: TAI_METADATA_VERSION,
          }
        : this.validator.validateTikTokAdsRecord(records[0]!);

    return this.metadataGenerator.buildRunReport({
      action: "sync_campaign_status",
      engineRecord: engine,
      tiktokAdsRecords: records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  syncAudience(
    input: SyncTikTokAudienceInput,
    config: TikTokAdsIntegrationConfiguration,
  ): TikTokAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();

    if (!config.audienceSynchronizationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "sync_audience",
        engineRecord: engine,
        tiktokAdsRecords: [],
        validation: {
          validationReportId: `tai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Audience synchronization rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: TAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const records = this.campaignEngine.syncAudience(input);
    const validation =
      records.length === 0
        ? {
            validationReportId: `tai-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail" as const,
            errors: ["No campaigns available for audience synchronization"],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: TAI_METADATA_VERSION,
          }
        : this.validator.validateTikTokAdsRecord(records[0]!);

    return this.metadataGenerator.buildRunReport({
      action: "sync_audience",
      engineRecord: engine,
      tiktokAdsRecords: records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.advertiserAccountManager.resetForTesting();
    this.campaignEngine.resetForTesting();
    this.rateWindows.clear();
  }
}
