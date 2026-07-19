/** R5-03 — Google Ads Integration Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import {
  GAI_METADATA_VERSION,
  GOOGLE_ADS_INTEGRATION_ID,
  GOOGLE_ADS_API_ENDPOINTS,
} from "./paths.js";
import { appendGaiLog } from "./gai-logging.js";
import { GoogleAuthenticationManager } from "./google-authentication-manager.js";
import { GoogleAdsApiClient } from "./google-ads-api-client.js";
import { AdvertisingAccountManager } from "./advertising-account-manager.js";
import { CampaignSynchronizationEngine } from "./campaign-synchronization-engine.js";
import { PerformanceRetrievalEngine } from "./performance-retrieval-engine.js";
import { GoogleAdsValidator } from "./google-ads-validator.js";
import { GoogleAdsMetadataGenerator, mapAuthToValidation } from "./google-ads-metadata-generator.js";
import type { GoogleAdsIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectGoogleAdsInput,
  CreateGoogleAdvertisementInput,
  CreateAdGroupInput,
  CreateGoogleCampaignInput,
  ManageAdvertisingAccountInput,
  ManageCustomerAccountInput,
  GoogleAdsRunReport,
  GoogleAdsEngineRecord,
  RetrieveGooglePerformanceInput,
  SyncGoogleCampaignStatusInput,
} from "./types.js";

export class GoogleAdsIntegrationManager {
  private engineRecord: GoogleAdsEngineRecord | null = null;
  private readonly authManager = new GoogleAuthenticationManager();
  private readonly apiClient = new GoogleAdsApiClient();
  private readonly adAccountManager = new AdvertisingAccountManager();
  private readonly campaignEngine = new CampaignSynchronizationEngine();
  private readonly performanceEngine: PerformanceRetrievalEngine;
  private readonly validator = new GoogleAdsValidator();
  private readonly metadataGenerator = new GoogleAdsMetadataGenerator();
  private readonly rateWindows = new Map<string, { count: number; windowStart: number }>();

  constructor(private readonly framework: MarketingFrameworkEngine | null) {
    this.performanceEngine = new PerformanceRetrievalEngine(this.campaignEngine);
  }

  getEngineRecord(): GoogleAdsEngineRecord | null {
    return this.engineRecord;
  }

  getGoogleAdsRecords() {
    return this.campaignEngine.list();
  }

  private checkRateLimit(config: GoogleAdsIntegrationConfiguration): boolean {
    if (!config.rateLimitEnabled) return true;
    const key = GOOGLE_ADS_INTEGRATION_ID;
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

  private requireConnected(): GoogleAdsEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error("Google Ads Integration not connected — call connectGoogleAds first");
    }
    return this.engineRecord;
  }

  registerWithFramework(
    config: GoogleAdsIntegrationConfiguration,
  ): { frameworkModuleId: string | null; validation: GoogleAdsRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? GOOGLE_ADS_API_ENDPOINTS.sandbox
      : GOOGLE_ADS_API_ENDPOINTS.production;

    const report = this.framework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: GOOGLE_ADS_INTEGRATION_ID,
        moduleVersion: GAI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "R5-03",
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
            "google.campaign.created",
            "google.campaign.synced",
            "google.performance.retrieved",
            "google.ads.failed",
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

    appendGaiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Google Ads with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `gai-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: GAI_METADATA_VERSION,
      },
    };
  }

  connectGoogleAds(
    input: ConnectGoogleAdsInput,
    config: GoogleAdsIntegrationConfiguration,
  ): GoogleAdsRunReport {
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
        customerAccountId: null,
        advertisingAccountId: null,
      });
      this.engineRecord = record;
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        engineRecord: record,
        googleAdsRecords: [],
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
        customerAccountId: null,
        advertisingAccountId: null,
      });
      this.engineRecord = record;
      const validation = this.validator.validateEngineRecord(record);
      validation.decision = "fail";
      validation.errors.push("Google authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        engineRecord: record,
        googleAdsRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const accounts = this.adAccountManager.manageCustomerAccount(
      {
        customerAccountId: input.customerAccountId ?? config.defaultCustomerAccountId,
      },
      config,
    );
    this.adAccountManager.manageAdvertisingAccount(
      {
        advertisingAccountId: input.advertisingAccountId ?? config.defaultAdvertisingAccountId,
        customerAccountId: accounts.customerAccountId,
      },
      config,
    );

    if (this.framework) {
      this.framework.activateMarketingModule(GOOGLE_ADS_INTEGRATION_ID);
    }

    const connection = this.apiClient.testConnection(config);
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      auth,
      connection,
      operationalState: connection.passed ? "active" : "failed",
      validationStatus: mapAuthToValidation(auth, connection),
      credentialRefPresent: auth.credentialRefPresent,
      customerAccountId: accounts.customerAccountId,
      advertisingAccountId: accounts.advertisingAccountId,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendGaiLog({
      event: "connection_complete",
      level: "info",
      details: `Google Ads connected · auth=${auth.authenticationStatus}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      googleAdsRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  manageCustomerAccount(
    input: ManageCustomerAccountInput,
    config: GoogleAdsIntegrationConfiguration,
  ): GoogleAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const accounts = this.adAccountManager.manageCustomerAccount(input, config);
    engine.customerAccountId = accounts.customerAccountId;
    engine.timestamp = new Date().toISOString();
    this.engineRecord = engine;
    return this.metadataGenerator.buildRunReport({
      action: "manage_customer_account",
      engineRecord: engine,
      googleAdsRecords: [],
      validation: this.validator.validateEngineRecord(engine),
      durationMs: Date.now() - started,
    });
  }

  manageAdvertisingAccount(
    input: ManageAdvertisingAccountInput,
    config: GoogleAdsIntegrationConfiguration,
  ): GoogleAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const accounts = this.adAccountManager.manageAdvertisingAccount(input, config);
    engine.advertisingAccountId = accounts.advertisingAccountId;
    engine.customerAccountId = accounts.customerAccountId;
    engine.timestamp = new Date().toISOString();
    this.engineRecord = engine;
    return this.metadataGenerator.buildRunReport({
      action: "manage_advertising_account",
      engineRecord: engine,
      googleAdsRecords: [],
      validation: this.validator.validateEngineRecord(engine),
      durationMs: Date.now() - started,
    });
  }

  createCampaign(
    input: CreateGoogleCampaignInput,
    config: GoogleAdsIntegrationConfiguration,
  ): GoogleAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateCampaignCreation(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "create_campaign",
        engineRecord: engine,
        googleAdsRecords: [],
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
        googleAdsRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const accounts = this.adAccountManager.ensureDefaults(config);
    const record = this.campaignEngine.createCampaign({
      campaignName: input.campaignName,
      customerAccountId: input.customerAccountId ?? accounts.customerAccountId,
      objective: input.objective,
    });
    const recordValidation = this.validator.validateGoogleAdsRecord(record);
    if (recordValidation.decision === "fail") {
      validation.decision = "fail";
      validation.errors.push(...recordValidation.errors);
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_campaign",
      engineRecord: engine,
      googleAdsRecords: [record],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createAdGroup(
    input: CreateAdGroupInput,
    config: GoogleAdsIntegrationConfiguration,
  ): GoogleAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!this.checkRateLimit(config)) {
      return this.metadataGenerator.buildRunReport({
        action: "create_ad_group",
        engineRecord: engine,
        googleAdsRecords: [],
        validation: {
          validationReportId: `gai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Operation was rate limited"],
          durationMs: Date.now() - started,
          metadataVersion: GAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.campaignEngine.createAdGroup(input);
    if (!record) {
      return this.metadataGenerator.buildRunReport({
        action: "create_ad_group",
        engineRecord: engine,
        googleAdsRecords: [],
        validation: {
          validationReportId: `gai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Campaign not found for ad set creation"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: GAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_ad_group",
      engineRecord: engine,
      googleAdsRecords: [record],
      validation: this.validator.validateGoogleAdsRecord(record),
      durationMs: Date.now() - started,
    });
  }

  createAdvertisement(
    input: CreateGoogleAdvertisementInput,
    config: GoogleAdsIntegrationConfiguration,
  ): GoogleAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!this.checkRateLimit(config)) {
      return this.metadataGenerator.buildRunReport({
        action: "create_advertisement",
        engineRecord: engine,
        googleAdsRecords: [],
        validation: {
          validationReportId: `gai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Operation was rate limited"],
          durationMs: Date.now() - started,
          metadataVersion: GAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.campaignEngine.createAdvertisement(input);
    if (!record) {
      return this.metadataGenerator.buildRunReport({
        action: "create_advertisement",
        engineRecord: engine,
        googleAdsRecords: [],
        validation: {
          validationReportId: `gai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Campaign or ad set not found for advertisement creation"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: GAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_advertisement",
      engineRecord: engine,
      googleAdsRecords: [record],
      validation: this.validator.validateGoogleAdsRecord(record),
      durationMs: Date.now() - started,
    });
  }

  retrievePerformance(
    input: RetrieveGooglePerformanceInput,
    _config: GoogleAdsIntegrationConfiguration,
  ): GoogleAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.performanceEngine.retrieve(input.campaignReference);
    const validation =
      records.length === 0
        ? {
            validationReportId: `gai-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail" as const,
            errors: ["No campaigns available for performance retrieval"],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: GAI_METADATA_VERSION,
          }
        : this.validator.validateGoogleAdsRecord(records[0]!);

    return this.metadataGenerator.buildRunReport({
      action: "retrieve_performance",
      engineRecord: engine,
      googleAdsRecords: records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  syncCampaignStatus(
    input: SyncGoogleCampaignStatusInput,
    config: GoogleAdsIntegrationConfiguration,
  ): GoogleAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();

    if (!config.campaignSynchronizationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "sync_campaign_status",
        engineRecord: engine,
        googleAdsRecords: [],
        validation: {
          validationReportId: `gai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Campaign synchronization rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: GAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const records = this.campaignEngine.syncStatus(input.campaignReference);
    const validation =
      records.length === 0
        ? {
            validationReportId: `gai-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail" as const,
            errors: ["No campaigns available to synchronize"],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: GAI_METADATA_VERSION,
          }
        : this.validator.validateGoogleAdsRecord(records[0]!);

    return this.metadataGenerator.buildRunReport({
      action: "sync_campaign_status",
      engineRecord: engine,
      googleAdsRecords: records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.adAccountManager.resetForTesting();
    this.campaignEngine.resetForTesting();
    this.rateWindows.clear();
  }
}
