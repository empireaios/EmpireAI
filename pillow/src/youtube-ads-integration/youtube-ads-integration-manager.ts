/** R5-05 — YouTube Ads Integration Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import {
  YAI_METADATA_VERSION,
  YOUTUBE_ADS_INTEGRATION_ID,
  YOUTUBE_ADS_API_ENDPOINTS,
} from "./paths.js";
import { appendYaiLog } from "./yai-logging.js";
import { GoogleAuthenticationManager } from "./google-authentication-manager.js";
import { YouTubeAdsApiClient } from "./youtube-ads-api-client.js";
import { AdvertiserAccountManager } from "./advertiser-account-manager.js";
import { VideoCampaignManager } from "./video-campaign-manager.js";
import { VideoAssetManager } from "./video-asset-manager.js";
import { CampaignSynchronizationEngine } from "./campaign-synchronization-engine.js";
import { PerformanceRetrievalEngine } from "./performance-retrieval-engine.js";
import { YouTubeAdsValidator } from "./youtube-ads-validator.js";
import { YouTubeAdsMetadataGenerator, mapAuthToValidation } from "./youtube-ads-metadata-generator.js";
import type { YouTubeAdsIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectYouTubeAdsInput,
  CreateVideoAdvertisementInput,
  CreateAdGroupInput,
  CreateYouTubeCampaignInput,
  ManageAdvertiserAccountInput,
  ManageVideoAssetInput,
  YouTubeAdsRunReport,
  YouTubeAdsEngineRecord,
  RetrieveYouTubePerformanceInput,
  SyncYouTubeCampaignStatusInput,
} from "./types.js";

export class YouTubeAdsIntegrationManager {
  private engineRecord: YouTubeAdsEngineRecord | null = null;
  private readonly authManager = new GoogleAuthenticationManager();
  private readonly apiClient = new YouTubeAdsApiClient();
  private readonly advertiserAccountManager = new AdvertiserAccountManager();
  private readonly videoCampaignManager = new VideoCampaignManager();
  private readonly videoAssetManager = new VideoAssetManager();
  private readonly campaignSync: CampaignSynchronizationEngine;
  private readonly performanceEngine: PerformanceRetrievalEngine;
  private readonly validator = new YouTubeAdsValidator();
  private readonly metadataGenerator = new YouTubeAdsMetadataGenerator();
  private readonly rateWindows = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private readonly framework: MarketingFrameworkEngine | null,
    private readonly googleAds: GoogleAdsIntegration | null,
  ) {
    this.campaignSync = new CampaignSynchronizationEngine(this.videoCampaignManager);
    this.performanceEngine = new PerformanceRetrievalEngine(this.videoCampaignManager);
  }

  getEngineRecord(): YouTubeAdsEngineRecord | null {
    return this.engineRecord;
  }

  getYouTubeAdsRecords() {
    return this.videoCampaignManager.list();
  }

  getVideoAssetCount(): number {
    return this.videoAssetManager.count();
  }

  private googleAdsDependencyPresent(): boolean {
    if (!this.googleAds) return false;
    try {
      const state = this.googleAds.getState();
      return state.engineVersion === "PILLOW-GAI-001";
    } catch {
      return false;
    }
  }

  private resolveCredentialRef(
    input: ConnectYouTubeAdsInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): string {
    if (input.credentialRef) return input.credentialRef;
    if (this.googleAds) {
      try {
        const googleConfig = this.googleAds.getState().configuration;
        if (googleConfig.credentialRef) return googleConfig.credentialRef;
      } catch {
        /* use local default */
      }
    }
    return config.credentialRef;
  }

  private checkRateLimit(config: YouTubeAdsIntegrationConfiguration): boolean {
    if (!config.rateLimitEnabled) return true;
    const key = YOUTUBE_ADS_INTEGRATION_ID;
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

  private requireConnected(): YouTubeAdsEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error("YouTube Ads Integration not connected — call connectYouTubeAds first");
    }
    return this.engineRecord;
  }

  registerWithFramework(
    config: YouTubeAdsIntegrationConfiguration,
  ): { frameworkModuleId: string | null; validation: YouTubeAdsRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? YOUTUBE_ADS_API_ENDPOINTS.sandbox
      : YOUTUBE_ADS_API_ENDPOINTS.production;

    const report = this.framework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: YOUTUBE_ADS_INTEGRATION_ID,
        moduleVersion: YAI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "R5-05",
        authenticationMethod: "oauth2",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v19.0",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "youtube.campaign.created",
            "youtube.campaign.synced",
            "youtube.video_asset.synced",
            "youtube.performance.retrieved",
            "youtube.ads.failed",
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

    appendYaiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered YouTube Ads with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `yai-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: YAI_METADATA_VERSION,
      },
    };
  }

  connectYouTubeAds(
    input: ConnectYouTubeAdsInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsRunReport {
    const started = Date.now();
    const credentialRef = this.resolveCredentialRef(input, config);
    const googleAdsDependencyPresent = this.googleAdsDependencyPresent();

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
        googleAdsDependencyPresent,
        advertiserAccountId: null,
      });
      this.engineRecord = record;
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        engineRecord: record,
        youtubeAdsRecords: [],
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
        googleAdsDependencyPresent,
        advertiserAccountId: null,
      });
      this.engineRecord = record;
      const validation = this.validator.validateEngineRecord(record);
      validation.decision = "fail";
      validation.errors.push("Google authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        engineRecord: record,
        youtubeAdsRecords: [],
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
      this.framework.activateMarketingModule(YOUTUBE_ADS_INTEGRATION_ID);
    }

    const connection = this.apiClient.testConnection(config);
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      auth,
      connection,
      operationalState: connection.passed ? "active" : "failed",
      validationStatus: mapAuthToValidation(auth, connection),
      credentialRefPresent: auth.credentialRefPresent,
      googleAdsDependencyPresent,
      advertiserAccountId: accounts.advertiserAccountId,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }
    if (!googleAdsDependencyPresent) {
      validation.warnings.push("Operating without live Google Ads Integration (R5-03) dependency");
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendYaiLog({
      event: "connection_complete",
      level: "info",
      details: `YouTube Ads connected · auth=${auth.authenticationStatus} · googleAds=${googleAdsDependencyPresent}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      youtubeAdsRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  manageAdvertiserAccount(
    input: ManageAdvertiserAccountInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const accounts = this.advertiserAccountManager.manageAdvertiserAccount(input, config);
    engine.advertiserAccountId = accounts.advertiserAccountId;
    engine.timestamp = new Date().toISOString();
    this.engineRecord = engine;
    return this.metadataGenerator.buildRunReport({
      action: "manage_advertiser_account",
      engineRecord: engine,
      youtubeAdsRecords: [],
      validation: this.validator.validateEngineRecord(engine),
      durationMs: Date.now() - started,
    });
  }

  createCampaign(
    input: CreateYouTubeCampaignInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateCampaignCreation(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "create_campaign",
        engineRecord: engine,
        youtubeAdsRecords: [],
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
        youtubeAdsRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const accounts = this.advertiserAccountManager.ensureDefaults(config);
    const record = this.videoCampaignManager.createCampaign({
      campaignName: input.campaignName,
      advertiserAccountId: input.advertiserAccountId ?? accounts.advertiserAccountId,
      objective: input.objective,
    });
    const recordValidation = this.validator.validateYouTubeAdsRecord(record);
    if (recordValidation.decision === "fail") {
      validation.decision = "fail";
      validation.errors.push(...recordValidation.errors);
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_campaign",
      engineRecord: engine,
      youtubeAdsRecords: [record],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createAdGroup(
    input: CreateAdGroupInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!this.checkRateLimit(config)) {
      return this.metadataGenerator.buildRunReport({
        action: "create_ad_group",
        engineRecord: engine,
        youtubeAdsRecords: [],
        validation: {
          validationReportId: `yai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Operation was rate limited"],
          durationMs: Date.now() - started,
          metadataVersion: YAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.videoCampaignManager.createAdGroup(input);
    if (!record) {
      return this.metadataGenerator.buildRunReport({
        action: "create_ad_group",
        engineRecord: engine,
        youtubeAdsRecords: [],
        validation: {
          validationReportId: `yai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Campaign not found for ad group creation"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: YAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_ad_group",
      engineRecord: engine,
      youtubeAdsRecords: [record],
      validation: this.validator.validateYouTubeAdsRecord(record),
      durationMs: Date.now() - started,
    });
  }

  manageVideoAsset(
    input: ManageVideoAssetInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateVideoAsset(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "manage_video_asset",
        engineRecord: engine,
        youtubeAdsRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const asset = this.videoAssetManager.manageVideoAsset(input);
    let records = this.videoCampaignManager.list().filter(
      (r) => !input.campaignReference || r.campaignReference === input.campaignReference,
    );
    if (input.campaignReference) {
      const attached = this.videoCampaignManager.attachVideoAsset(
        input.campaignReference,
        asset.videoAssetReference,
      );
      records = attached ? [attached] : [];
    }

    return this.metadataGenerator.buildRunReport({
      action: "manage_video_asset",
      engineRecord: engine,
      youtubeAdsRecords: records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  createVideoAdvertisement(
    input: CreateVideoAdvertisementInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateVideoAdvertisement(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "create_video_advertisement",
        engineRecord: engine,
        youtubeAdsRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (!this.videoAssetManager.get(input.videoAssetReference)) {
      validation.decision = "fail";
      validation.errors.push("Video asset not found — manage video asset first");
      return this.metadataGenerator.buildRunReport({
        action: "create_video_advertisement",
        engineRecord: engine,
        youtubeAdsRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (!this.checkRateLimit(config)) {
      validation.decision = "partial";
      validation.warnings.push("Operation was rate limited");
      return this.metadataGenerator.buildRunReport({
        action: "create_video_advertisement",
        engineRecord: engine,
        youtubeAdsRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.videoCampaignManager.createVideoAdvertisement(input);
    if (!record) {
      return this.metadataGenerator.buildRunReport({
        action: "create_video_advertisement",
        engineRecord: engine,
        youtubeAdsRecords: [],
        validation: {
          validationReportId: `yai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Campaign or ad group not found for video advertisement creation"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: YAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_video_advertisement",
      engineRecord: engine,
      youtubeAdsRecords: [record],
      validation: this.validator.validateYouTubeAdsRecord(record),
      durationMs: Date.now() - started,
    });
  }

  retrievePerformance(
    input: RetrieveYouTubePerformanceInput,
    _config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.performanceEngine.retrieve(input.campaignReference);
    const validation =
      records.length === 0
        ? {
            validationReportId: `yai-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail" as const,
            errors: ["No campaigns available for performance retrieval"],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: YAI_METADATA_VERSION,
          }
        : this.validator.validateYouTubeAdsRecord(records[0]!);

    return this.metadataGenerator.buildRunReport({
      action: "retrieve_performance",
      engineRecord: engine,
      youtubeAdsRecords: records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  syncCampaignStatus(
    input: SyncYouTubeCampaignStatusInput,
    config: YouTubeAdsIntegrationConfiguration,
  ): YouTubeAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();

    if (!config.campaignSynchronizationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "sync_campaign_status",
        engineRecord: engine,
        youtubeAdsRecords: [],
        validation: {
          validationReportId: `yai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Campaign synchronization rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: YAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const records = this.campaignSync.syncStatus(input.campaignReference);
    const validation =
      records.length === 0
        ? {
            validationReportId: `yai-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail" as const,
            errors: ["No campaigns available to synchronize"],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: YAI_METADATA_VERSION,
          }
        : this.validator.validateYouTubeAdsRecord(records[0]!);

    return this.metadataGenerator.buildRunReport({
      action: "sync_campaign_status",
      engineRecord: engine,
      youtubeAdsRecords: records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.advertiserAccountManager.resetForTesting();
    this.videoCampaignManager.resetForTesting();
    this.videoAssetManager.resetForTesting();
    this.rateWindows.clear();
  }
}
