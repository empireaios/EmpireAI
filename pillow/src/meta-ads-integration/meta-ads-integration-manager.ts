/** R5-02 — Meta Ads Integration Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import {
  MAI_METADATA_VERSION,
  META_ADS_INTEGRATION_ID,
  META_API_ENDPOINTS,
} from "./paths.js";
import { appendMaiLog } from "./mai-logging.js";
import { MetaAuthenticationManager } from "./meta-authentication-manager.js";
import { MetaApiClient } from "./meta-api-client.js";
import { AdAccountManager } from "./ad-account-manager.js";
import { CampaignSynchronizationEngine } from "./campaign-synchronization-engine.js";
import { PerformanceRetrievalEngine } from "./performance-retrieval-engine.js";
import { MetaValidator } from "./meta-validator.js";
import { MetaMetadataGenerator, mapAuthToValidation } from "./meta-metadata-generator.js";
import type { MetaAdsIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectMetaAdsInput,
  CreateAdvertisementInput,
  CreateAdSetInput,
  CreateCampaignInput,
  ManageAdAccountInput,
  ManageBusinessAccountInput,
  MetaAdsRunReport,
  MetaEngineRecord,
  RetrievePerformanceInput,
  SyncCampaignStatusInput,
} from "./types.js";

export class MetaAdsIntegrationManager {
  private engineRecord: MetaEngineRecord | null = null;
  private readonly authManager = new MetaAuthenticationManager();
  private readonly apiClient = new MetaApiClient();
  private readonly adAccountManager = new AdAccountManager();
  private readonly campaignEngine = new CampaignSynchronizationEngine();
  private readonly performanceEngine: PerformanceRetrievalEngine;
  private readonly validator = new MetaValidator();
  private readonly metadataGenerator = new MetaMetadataGenerator();
  private readonly rateWindows = new Map<string, { count: number; windowStart: number }>();

  constructor(private readonly framework: MarketingFrameworkEngine | null) {
    this.performanceEngine = new PerformanceRetrievalEngine(this.campaignEngine);
  }

  getEngineRecord(): MetaEngineRecord | null {
    return this.engineRecord;
  }

  getMetaRecords() {
    return this.campaignEngine.list();
  }

  private checkRateLimit(config: MetaAdsIntegrationConfiguration): boolean {
    if (!config.rateLimitEnabled) return true;
    const key = META_ADS_INTEGRATION_ID;
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

  private requireConnected(): MetaEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error("Meta Ads Integration not connected — call connectMetaAds first");
    }
    return this.engineRecord;
  }

  registerWithFramework(
    config: MetaAdsIntegrationConfiguration,
  ): { frameworkModuleId: string | null; validation: MetaAdsRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox
      ? META_API_ENDPOINTS.sandbox
      : META_API_ENDPOINTS.production;

    const report = this.framework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: META_ADS_INTEGRATION_ID,
        moduleVersion: MAI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "R5-02",
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
            "meta.campaign.created",
            "meta.campaign.synced",
            "meta.performance.retrieved",
            "meta.ads.failed",
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

    appendMaiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Meta Ads with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `mai-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: MAI_METADATA_VERSION,
      },
    };
  }

  connectMetaAds(
    input: ConnectMetaAdsInput,
    config: MetaAdsIntegrationConfiguration,
  ): MetaAdsRunReport {
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
        businessAccountId: null,
        adAccountId: null,
      });
      this.engineRecord = record;
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        engineRecord: record,
        metaRecords: [],
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
        businessAccountId: null,
        adAccountId: null,
      });
      this.engineRecord = record;
      const validation = this.validator.validateEngineRecord(record);
      validation.decision = "fail";
      validation.errors.push("Meta authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        engineRecord: record,
        metaRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const accounts = this.adAccountManager.manageBusinessAccount(
      {
        businessAccountId: input.businessAccountId ?? config.defaultBusinessAccountId,
      },
      config,
    );
    this.adAccountManager.manageAdAccount(
      {
        adAccountId: input.adAccountId ?? config.defaultAdAccountId,
        businessAccountId: accounts.businessAccountId,
      },
      config,
    );

    if (this.framework) {
      this.framework.activateMarketingModule(META_ADS_INTEGRATION_ID);
    }

    const connection = this.apiClient.testConnection(config);
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      auth,
      connection,
      operationalState: connection.passed ? "active" : "failed",
      validationStatus: mapAuthToValidation(auth, connection),
      credentialRefPresent: auth.credentialRefPresent,
      businessAccountId: accounts.businessAccountId,
      adAccountId: accounts.adAccountId,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendMaiLog({
      event: "connection_complete",
      level: "info",
      details: `Meta Ads connected · auth=${auth.authenticationStatus}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      metaRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  manageBusinessAccount(
    input: ManageBusinessAccountInput,
    config: MetaAdsIntegrationConfiguration,
  ): MetaAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const accounts = this.adAccountManager.manageBusinessAccount(input, config);
    engine.businessAccountId = accounts.businessAccountId;
    engine.timestamp = new Date().toISOString();
    this.engineRecord = engine;
    return this.metadataGenerator.buildRunReport({
      action: "manage_business_account",
      engineRecord: engine,
      metaRecords: [],
      validation: this.validator.validateEngineRecord(engine),
      durationMs: Date.now() - started,
    });
  }

  manageAdAccount(
    input: ManageAdAccountInput,
    config: MetaAdsIntegrationConfiguration,
  ): MetaAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const accounts = this.adAccountManager.manageAdAccount(input, config);
    engine.adAccountId = accounts.adAccountId;
    engine.businessAccountId = accounts.businessAccountId;
    engine.timestamp = new Date().toISOString();
    this.engineRecord = engine;
    return this.metadataGenerator.buildRunReport({
      action: "manage_ad_account",
      engineRecord: engine,
      metaRecords: [],
      validation: this.validator.validateEngineRecord(engine),
      durationMs: Date.now() - started,
    });
  }

  createCampaign(
    input: CreateCampaignInput,
    config: MetaAdsIntegrationConfiguration,
  ): MetaAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateCampaignCreation(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "create_campaign",
        engineRecord: engine,
        metaRecords: [],
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
        metaRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const accounts = this.adAccountManager.ensureDefaults(config);
    const record = this.campaignEngine.createCampaign({
      campaignName: input.campaignName,
      businessAccountId: input.businessAccountId ?? accounts.businessAccountId,
      adAccountId: input.adAccountId ?? accounts.adAccountId,
      objective: input.objective,
    });
    const recordValidation = this.validator.validateMetaRecord(record);
    if (recordValidation.decision === "fail") {
      validation.decision = "fail";
      validation.errors.push(...recordValidation.errors);
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_campaign",
      engineRecord: engine,
      metaRecords: [record],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createAdSet(
    input: CreateAdSetInput,
    config: MetaAdsIntegrationConfiguration,
  ): MetaAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!this.checkRateLimit(config)) {
      return this.metadataGenerator.buildRunReport({
        action: "create_ad_set",
        engineRecord: engine,
        metaRecords: [],
        validation: {
          validationReportId: `mai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Operation was rate limited"],
          durationMs: Date.now() - started,
          metadataVersion: MAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.campaignEngine.createAdSet(input);
    if (!record) {
      return this.metadataGenerator.buildRunReport({
        action: "create_ad_set",
        engineRecord: engine,
        metaRecords: [],
        validation: {
          validationReportId: `mai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Campaign not found for ad set creation"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: MAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_ad_set",
      engineRecord: engine,
      metaRecords: [record],
      validation: this.validator.validateMetaRecord(record),
      durationMs: Date.now() - started,
    });
  }

  createAdvertisement(
    input: CreateAdvertisementInput,
    config: MetaAdsIntegrationConfiguration,
  ): MetaAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!this.checkRateLimit(config)) {
      return this.metadataGenerator.buildRunReport({
        action: "create_advertisement",
        engineRecord: engine,
        metaRecords: [],
        validation: {
          validationReportId: `mai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Operation was rate limited"],
          durationMs: Date.now() - started,
          metadataVersion: MAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.campaignEngine.createAdvertisement(input);
    if (!record) {
      return this.metadataGenerator.buildRunReport({
        action: "create_advertisement",
        engineRecord: engine,
        metaRecords: [],
        validation: {
          validationReportId: `mai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Campaign or ad set not found for advertisement creation"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: MAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "create_advertisement",
      engineRecord: engine,
      metaRecords: [record],
      validation: this.validator.validateMetaRecord(record),
      durationMs: Date.now() - started,
    });
  }

  retrievePerformance(
    input: RetrievePerformanceInput,
    _config: MetaAdsIntegrationConfiguration,
  ): MetaAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.performanceEngine.retrieve(input.campaignReference);
    const validation =
      records.length === 0
        ? {
            validationReportId: `mai-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail" as const,
            errors: ["No campaigns available for performance retrieval"],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: MAI_METADATA_VERSION,
          }
        : this.validator.validateMetaRecord(records[0]!);

    return this.metadataGenerator.buildRunReport({
      action: "retrieve_performance",
      engineRecord: engine,
      metaRecords: records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  syncCampaignStatus(
    input: SyncCampaignStatusInput,
    config: MetaAdsIntegrationConfiguration,
  ): MetaAdsRunReport {
    const started = Date.now();
    const engine = this.requireConnected();

    if (!config.campaignSynchronizationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "sync_campaign_status",
        engineRecord: engine,
        metaRecords: [],
        validation: {
          validationReportId: `mai-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "partial",
          errors: [],
          warnings: ["Campaign synchronization rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: MAI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const records = this.campaignEngine.syncStatus(input.campaignReference);
    const validation =
      records.length === 0
        ? {
            validationReportId: `mai-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail" as const,
            errors: ["No campaigns available to synchronize"],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: MAI_METADATA_VERSION,
          }
        : this.validator.validateMetaRecord(records[0]!);

    return this.metadataGenerator.buildRunReport({
      action: "sync_campaign_status",
      engineRecord: engine,
      metaRecords: records,
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
