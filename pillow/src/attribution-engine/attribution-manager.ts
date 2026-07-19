/** R5-09 — Attribution Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { MetaAdsIntegration } from "../meta-ads-integration/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import type { TikTokAdsIntegration } from "../tiktok-ads-integration/engine.js";
import type { YouTubeAdsIntegration } from "../youtube-ads-integration/engine.js";
import type { CampaignManagerEngine } from "../campaign-manager/engine.js";
import type { AudienceIntelligenceEngine } from "../audience-intelligence/engine.js";
import { ATT_METADATA_VERSION, ATTRIBUTION_ENGINE_ID } from "./paths.js";
import { appendAttLog } from "./att-logging.js";
import { TouchpointTrackingEngine } from "./touchpoint-tracking-engine.js";
import { ConversionAttributionEngine } from "./conversion-attribution-engine.js";
import { MultiTouchAttributionEngine } from "./multi-touch-attribution-engine.js";
import { RoiCalculationEngine } from "./roi-calculation-engine.js";
import { AttributionAnalyticsEngine } from "./attribution-analytics-engine.js";
import { AttributionValidator } from "./attribution-validator.js";
import { AttributionMetadataGenerator } from "./attribution-metadata-generator.js";
import type { AttributionEngineConfiguration } from "./configuration.js";
import type {
  AttributeInput,
  AttributionEngineRecord,
  AttributionRecord,
  AttributionRunReport,
  CalculateRoiInput,
  ConnectAttributionEngineInput,
  MeasureContributionInput,
  TrackAcquisitionSourceInput,
  TrackConversionJourneyInput,
  TrackTouchpointInput,
} from "./types.js";

export type AttributionEngineDependencies = {
  marketingFramework: MarketingFrameworkEngine | null;
  metaAds: MetaAdsIntegration | null;
  googleAds: GoogleAdsIntegration | null;
  tiktokAds: TikTokAdsIntegration | null;
  youtubeAds: YouTubeAdsIntegration | null;
  campaignManager: CampaignManagerEngine | null;
  audienceIntelligence: AudienceIntelligenceEngine | null;
};

export class AttributionManager {
  private engineRecord: AttributionEngineRecord | null = null;
  private readonly touchpoints = new TouchpointTrackingEngine();
  private readonly conversion = new ConversionAttributionEngine();
  private readonly multiTouch = new MultiTouchAttributionEngine();
  private readonly roiEngine = new RoiCalculationEngine();
  private readonly analytics = new AttributionAnalyticsEngine();
  private readonly validator = new AttributionValidator();
  private readonly metadataGenerator = new AttributionMetadataGenerator();

  constructor(private readonly deps: AttributionEngineDependencies) {}

  getEngineRecord(): AttributionEngineRecord | null {
    return this.engineRecord;
  }

  getAttributionRecords(): AttributionRecord[] {
    return this.conversion.list();
  }

  getTouchpoints() {
    return this.touchpoints.listAll();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): AttributionEngineRecord["dependencyPresence"] {
    return {
      marketingFramework: this.deps.marketingFramework
        ? this.probe(() => this.deps.marketingFramework!.getState())
        : false,
      metaAds: this.deps.metaAds ? this.probe(() => this.deps.metaAds!.getState()) : false,
      googleAds: this.deps.googleAds ? this.probe(() => this.deps.googleAds!.getState()) : false,
      tiktokAds: this.deps.tiktokAds ? this.probe(() => this.deps.tiktokAds!.getState()) : false,
      youtubeAds: this.deps.youtubeAds
        ? this.probe(() => this.deps.youtubeAds!.getState())
        : false,
      campaignManager: this.deps.campaignManager
        ? this.probe(() => this.deps.campaignManager!.getState())
        : false,
      audienceIntelligence: this.deps.audienceIntelligence
        ? this.probe(() => this.deps.audienceIntelligence!.getState())
        : false,
    };
  }

  private requireConnected(): AttributionEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error("Attribution Engine not connected — call connectAttributionEngine first");
    }
    return this.engineRecord;
  }

  private resolveCampaignReference(preferred?: string | null): string | null {
    if (preferred?.trim()) return preferred.trim();
    if (!this.deps.campaignManager) return null;
    try {
      const campaigns = this.deps.campaignManager.getCampaignRecords();
      return campaigns[0]?.campaignId ?? null;
    } catch {
      return null;
    }
  }

  registerWithFramework(
    config: AttributionEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: AttributionRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: ATTRIBUTION_ENGINE_ID,
        moduleVersion: ATT_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-09",
        authenticationMethod: "none",
        credentialRef: "vault://attribution-engine",
        apiEndpointConfig: {
          baseUrl: "internal://attribution-engine",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "attribution.touchpoint",
            "attribution.calculated",
            "attribution.roi",
            "attribution.failed",
          ],
          maxEventsPerMinute: 120,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: true,
          requestsPerMinute: 120,
          burstLimit: 20,
          windowMs: 60000,
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

    appendAttLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Attribution Engine with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `att-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: ATT_METADATA_VERSION,
      },
    };
  }

  connectAttributionEngine(
    _input: ConnectAttributionEngineInput,
    config: AttributionEngineConfiguration,
  ): AttributionRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(ATTRIBUTION_ENGINE_ID);
    }

    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: frameworkReg.validation.decision === "fail" ? "failed" : "active",
      validationStatus:
        frameworkReg.validation.decision === "fail"
          ? "failed"
          : frameworkReg.validation.decision === "partial"
            ? "partial"
            : "passed",
      dependencyPresence: deps,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendAttLog({
      event: "engine_connect",
      level: "info",
      details: `Attribution Engine connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      attributionRecords: [],
      touchpoints: [],
      contributions: [],
      roi: null,
      validation,
      durationMs: Date.now() - started,
    });
  }

  trackAcquisitionSource(
    input: TrackAcquisitionSourceInput,
    config: AttributionEngineConfiguration,
  ): AttributionRunReport {
    return this.trackTouchpoint(
      {
        customerRef: input.customerRef,
        marketingChannel: input.marketingChannel,
        campaignReference: input.campaignReference,
        sourceLabel: input.sourceLabel ?? "acquisition_source",
      },
      config,
      "track_acquisition_source",
    );
  }

  trackTouchpoint(
    input: TrackTouchpointInput,
    config: AttributionEngineConfiguration,
    action: AttributionRunReport["action"] = "track_touchpoint",
  ): AttributionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateTouchpoint(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord: engine,
        attributionRecords: [],
        touchpoints: [],
        contributions: [],
        roi: null,
        validation,
        durationMs: Date.now() - started,
      });
    }

    const campaignReference = this.resolveCampaignReference(input.campaignReference);
    const touchpoint = this.touchpoints.track({
      ...input,
      campaignReference: campaignReference ?? undefined,
    });

    appendAttLog({
      event: "touchpoint_tracking",
      level: "info",
      details: `Tracked ${action} · channel=${touchpoint.marketingChannel} · seq=${touchpoint.sequenceIndex}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      attributionRecords: [],
      touchpoints: [touchpoint],
      contributions: [],
      roi: null,
      validation,
      durationMs: Date.now() - started,
    });
  }

  trackConversionJourney(
    input: TrackConversionJourneyInput,
    config: AttributionEngineConfiguration,
  ): AttributionRunReport {
    return this.attribute(
      {
        customerRef: input.customerRef,
        conversionValue: input.conversionValue,
        attributionModel: input.attributionModel,
        campaignReference: input.campaignReference,
      },
      config,
      "track_conversion_journey",
    );
  }

  attribute(
    input: AttributeInput,
    config: AttributionEngineConfiguration,
    action: AttributionRunReport["action"] = "attribute",
  ): AttributionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateAttribute(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord: engine,
        attributionRecords: [],
        touchpoints: [],
        contributions: [],
        roi: null,
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (!config.attributionModelRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord: engine,
        attributionRecords: [],
        touchpoints: this.touchpoints.listForCustomer(input.customerRef),
        contributions: [],
        roi: null,
        validation: this.validator.validateConfiguration({
          ...config,
          attributionModelRulesEnabled: false,
        }),
        durationMs: Date.now() - started,
      });
    }

    const model = input.attributionModel ?? config.defaultAttributionModel;
    if (!this.multiTouch.isSupportedModel(model)) {
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord: engine,
        attributionRecords: [],
        touchpoints: [],
        contributions: [],
        roi: null,
        validation: {
          validationReportId: `att-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Invalid attribution model: ${model}`],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: ATT_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let journey = this.touchpoints.listForCustomer(input.customerRef);
    if (journey.length === 0) {
      journey = [
        this.touchpoints.track({
          customerRef: input.customerRef,
          marketingChannel: "unknown",
          campaignReference: this.resolveCampaignReference(input.campaignReference) ?? undefined,
          sourceLabel: "inferred_missing_journey",
        }),
      ];
    }

    const weights = this.multiTouch.computeWeights(model, journey);
    const records = this.conversion.attribute({
      customerRef: journey[0]!.customerRef,
      conversionValue: input.conversionValue,
      model,
      touchpoints: journey,
      weights,
      campaignReference: this.resolveCampaignReference(input.campaignReference),
    });

    appendAttLog({
      event: "attribution_calculations",
      level: "info",
      details: `Attributed conversion · model=${model} · touchpoints=${journey.length}`,
    });

    const recordValidation = this.validator.validateAttributionRecord(records[0]!);
    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      attributionRecords: records,
      touchpoints: journey,
      contributions: this.analytics.byChannel(records),
      roi: null,
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  measureCampaignContribution(
    input: MeasureContributionInput,
    config: AttributionEngineConfiguration,
  ): AttributionRunReport {
    return this.measure("measure_campaign_contribution", input, config, (records) =>
      this.analytics.byCampaign(records),
    );
  }

  measureChannelContribution(
    input: MeasureContributionInput,
    config: AttributionEngineConfiguration,
  ): AttributionRunReport {
    return this.measure("measure_channel_contribution", input, config, (records) =>
      this.analytics.byChannel(records),
    );
  }

  measureAdvertisementContribution(
    input: MeasureContributionInput,
    config: AttributionEngineConfiguration,
  ): AttributionRunReport {
    return this.measure("measure_advertisement_contribution", input, config, (records) =>
      this.analytics.byAdvertisement(records),
    );
  }

  private measure(
    action: AttributionRunReport["action"],
    input: MeasureContributionInput,
    _config: AttributionEngineConfiguration,
    projector: (records: AttributionRecord[]) => AttributionRunReport["contributions"],
  ): AttributionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const touchpoints = input.customerRef
      ? this.touchpoints.listForCustomer(input.customerRef)
      : this.touchpoints.listAll();
    const customerRefs = new Set(touchpoints.map((t) => t.customerRef));
    const finalRecords = input.customerRef
      ? this.conversion.list().filter((r) => customerRefs.has(r.customerId))
      : this.conversion.list();

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      attributionRecords: finalRecords,
      touchpoints,
      contributions: projector(finalRecords),
      roi: null,
      validation: {
        validationReportId: `att-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: finalRecords.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: finalRecords.length === 0 ? ["No attribution records available"] : [],
        durationMs: Date.now() - started,
        metadataVersion: ATT_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  calculateRoas(
    input: CalculateRoiInput,
    config: AttributionEngineConfiguration,
  ): AttributionRunReport {
    return this.calculateRoiMetrics(input, config, "calculate_roas");
  }

  calculateMarketingRoi(
    input: CalculateRoiInput,
    config: AttributionEngineConfiguration,
  ): AttributionRunReport {
    return this.calculateRoiMetrics(input, config, "calculate_marketing_roi");
  }

  private calculateRoiMetrics(
    input: CalculateRoiInput,
    config: AttributionEngineConfiguration,
    action: AttributionRunReport["action"],
  ): AttributionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();

    if (!config.roiCalculationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord: engine,
        attributionRecords: [],
        touchpoints: [],
        contributions: [],
        roi: null,
        validation: {
          validationReportId: `att-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["ROI calculation rules disabled"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: ATT_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const records = input.customerRef
      ? this.conversion
          .list()
          .filter((r) =>
            this.touchpoints
              .listForCustomer(input.customerRef!)
              .some((t) => t.customerRef === r.customerId),
          )
      : this.conversion.list();

    const spend =
      input.spend ?? this.roiEngine.estimateSpendFromAttributions(records);
    const revenue =
      input.revenue ?? this.roiEngine.estimateRevenueFromAttributions(records);
    const model = input.attributionModel ?? config.defaultAttributionModel;
    const roi = this.roiEngine.calculate({ spend, revenue, model });

    appendAttLog({
      event: "roi_calculations",
      level: "info",
      details: `${action} · roas=${roi.roas} · roi%=${roi.marketingRoiPercent}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      attributionRecords: records,
      touchpoints: input.customerRef
        ? this.touchpoints.listForCustomer(input.customerRef)
        : this.touchpoints.listAll(),
      contributions: this.analytics.byChannel(records),
      roi,
      validation: {
        validationReportId: `att-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: records.length === 0 ? ["ROI estimated without attribution records"] : [],
        durationMs: Date.now() - started,
        metadataVersion: ATT_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.touchpoints.resetForTesting();
    this.conversion.resetForTesting();
  }
}
