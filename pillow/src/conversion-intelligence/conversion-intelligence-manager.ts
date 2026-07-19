/** R5-14 — Conversion Intelligence Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { MetaAdsIntegration } from "../meta-ads-integration/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import type { TikTokAdsIntegration } from "../tiktok-ads-integration/engine.js";
import type { YouTubeAdsIntegration } from "../youtube-ads-integration/engine.js";
import type { SeoIntelligenceEngine } from "../seo-intelligence-engine/engine.js";
import type { CampaignManagerEngine } from "../campaign-manager/engine.js";
import type { AudienceIntelligenceEngine } from "../audience-intelligence/engine.js";
import type { AttributionEngine } from "../attribution-engine/engine.js";
import type { MarketingAnalyticsDashboard } from "../marketing-analytics-dashboard/engine.js";
import type { AiCampaignGenerator } from "../ai-campaign-generator/engine.js";
import type { BudgetOptimizationEngine } from "../budget-optimization-engine/engine.js";
import {
  CONVERSION_INTELLIGENCE_ID,
  CVI_METADATA_VERSION,
} from "./paths.js";
import { appendCviLog } from "./cvi-logging.js";
import { ConversionTrackingEngine } from "./conversion-tracking-engine.js";
import { FunnelAnalysisEngine } from "./funnel-analysis-engine.js";
import { ConversionAnalyticsEngine } from "./conversion-analytics-engine.js";
import { RecommendationEngine } from "./recommendation-engine.js";
import { FunnelOptimizationEngine } from "./funnel-optimization-engine.js";
import { ConversionValidator } from "./conversion-validator.js";
import { ConversionMetadataGenerator } from "./conversion-metadata-generator.js";
import type { ConversionIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectConversionIntelligenceInput,
  ConversionEngineRecord,
  ConversionRecord,
  ConversionRunReport,
  FunnelStage,
  MeasureConversionInput,
  OptimizeFunnelInput,
  RecommendImprovementsInput,
  TrackFunnelInput,
} from "./types.js";

export type ConversionIntelligenceDependencies = {
  marketingFramework: MarketingFrameworkEngine | null;
  metaAds: MetaAdsIntegration | null;
  googleAds: GoogleAdsIntegration | null;
  tiktokAds: TikTokAdsIntegration | null;
  youtubeAds: YouTubeAdsIntegration | null;
  seoIntelligence: SeoIntelligenceEngine | null;
  campaignManager: CampaignManagerEngine | null;
  audienceIntelligence: AudienceIntelligenceEngine | null;
  attributionEngine: AttributionEngine | null;
  marketingAnalyticsDashboard: MarketingAnalyticsDashboard | null;
  aiCampaignGenerator: AiCampaignGenerator | null;
  budgetOptimizationEngine: BudgetOptimizationEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class ConversionIntelligenceManager {
  private engineRecord: ConversionEngineRecord | null = null;
  private readonly tracking = new ConversionTrackingEngine();
  private readonly funnelAnalysis = new FunnelAnalysisEngine();
  private readonly analytics = new ConversionAnalyticsEngine();
  private readonly recommendations = new RecommendationEngine();
  private readonly funnelOptimization = new FunnelOptimizationEngine();
  private readonly validator = new ConversionValidator();
  private readonly metadataGenerator = new ConversionMetadataGenerator();

  constructor(private readonly deps: ConversionIntelligenceDependencies) {}

  getEngineRecord(): ConversionEngineRecord | null {
    return this.engineRecord;
  }

  getConversionRecords(): ConversionRecord[] {
    return this.tracking.list();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): ConversionEngineRecord["dependencyPresence"] {
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
      seoIntelligence: this.deps.seoIntelligence
        ? this.probe(() => this.deps.seoIntelligence!.getState())
        : false,
      campaignManager: this.deps.campaignManager
        ? this.probe(() => this.deps.campaignManager!.getState())
        : false,
      audienceIntelligence: this.deps.audienceIntelligence
        ? this.probe(() => this.deps.audienceIntelligence!.getState())
        : false,
      attributionEngine: this.deps.attributionEngine
        ? this.probe(() => this.deps.attributionEngine!.getState())
        : false,
      marketingAnalyticsDashboard: this.deps.marketingAnalyticsDashboard
        ? this.probe(() => this.deps.marketingAnalyticsDashboard!.getState())
        : false,
      aiCampaignGenerator: this.deps.aiCampaignGenerator
        ? this.probe(() => this.deps.aiCampaignGenerator!.getState())
        : false,
      budgetOptimizationEngine: this.deps.budgetOptimizationEngine
        ? this.probe(() => this.deps.budgetOptimizationEngine!.getState())
        : false,
    };
  }

  private requireConnected(): ConversionEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Conversion Intelligence not connected — call connectConversionIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private resolveCampaignReference(preferred?: string): string | null {
    if (preferred?.trim()) return preferred.trim();
    const aiCampaigns = safe(() => this.deps.aiCampaignGenerator?.getCampaignRecords() ?? [], []);
    if (aiCampaigns[0]?.aiCampaignId) return aiCampaigns[0].aiCampaignId;
    const campaigns = safe(() => this.deps.campaignManager?.getCampaignRecords() ?? [], []);
    return campaigns[0]?.campaignId ?? null;
  }

  private audienceQuality(): number {
    const audiences = safe(
      () => this.deps.audienceIntelligence?.getAudienceRecords() ?? [],
      [],
    );
    if (audiences.length === 0) return 50;
    return audiences.reduce((sum, a) => sum + a.audienceQualityScore, 0) / audiences.length;
  }

  private attributedConversions(): number {
    const records = safe(() => this.deps.attributionEngine?.getAttributionRecords() ?? [], []);
    return records.length;
  }

  private seoLandingHint(): number {
    return safe(() => {
      const state = this.deps.seoIntelligence?.getState();
      const score = (state as { health?: { healthScore?: number } } | undefined)?.health
        ?.healthScore;
      return typeof score === "number" ? score : 55;
    }, 55);
  }

  private budgetEfficiencyHint(): number {
    return safe(() => {
      const budgets = this.deps.budgetOptimizationEngine?.getBudgetRecords() ?? [];
      if (budgets.length === 0) return 50;
      return budgets.reduce((sum, b) => sum + b.efficiencyScore, 0) / budgets.length;
    }, 50);
  }

  registerWithFramework(
    config: ConversionIntelligenceConfiguration,
  ): { frameworkModuleId: string | null; validation: ConversionRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: CONVERSION_INTELLIGENCE_ID,
        moduleVersion: CVI_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-14",
        authenticationMethod: "none",
        credentialRef: "vault://conversion-intelligence",
        apiEndpointConfig: {
          baseUrl: "internal://conversion-intelligence",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "conversion.funnel_tracked",
            "conversion.bottleneck",
            "conversion.optimized",
            "conversion.failed",
          ],
          maxEventsPerMinute: 60,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: true,
          requestsPerMinute: 60,
          burstLimit: 10,
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

    appendCviLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Conversion Intelligence with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `cvi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CVI_METADATA_VERSION,
      },
    };
  }

  connectConversionIntelligence(
    _input: ConnectConversionIntelligenceInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(CONVERSION_INTELLIGENCE_ID);
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

    appendCviLog({
      event: "engine_connect",
      level: "info",
      details: `Conversion Intelligence connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      conversionRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  trackFunnel(
    input: TrackFunnelInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateTrackFunnel(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "track_funnel",
        engineRecord: engine,
        conversionRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const conversionRate = input.conversionRate ?? 8 + (this.attributedConversions() % 7);
    const dropOffRate = input.dropOffRate ?? Math.max(5, 100 - conversionRate * 4);
    const landingPageScore =
      input.landingPageScore ?? this.analytics.measureLandingPage(this.seoLandingHint(), conversionRate);
    const funnelStage: FunnelStage = input.funnelStage ?? "landing";
    const efficiency = this.analytics.calculateEfficiency({
      conversionRate,
      dropOffRate,
      landingPageScore,
      audienceQuality: this.audienceQuality(),
      attributedConversions: this.attributedConversions(),
    });

    let draft = this.tracking.track({
      campaignReference: this.resolveCampaignReference(input.campaignReference),
      marketingChannel: input.marketingChannel,
      funnelStage,
      conversionRate,
      dropOffRate,
      conversionEfficiencyScore: efficiency,
      landingPageScore,
      bottleneckDetected: false,
      abandonmentDetected: false,
      recommendedOptimization: "Initial funnel tracking",
    });
    draft = this.funnelAnalysis.refresh(draft, config);
    draft.recommendedOptimization = this.recommendations.recommend(draft);
    this.tracking.persist(draft);

    appendCviLog({
      event: "funnel_tracking",
      level: "info",
      details: `Tracked funnel ${draft.funnelStage} on ${draft.marketingChannel}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "track_funnel",
      engineRecord: engine,
      conversionRecords: [draft],
      validation: this.validator.validateConversionRecord(draft),
      durationMs: Date.now() - started,
    });
  }

  private refreshAll(config: ConversionIntelligenceConfiguration): ConversionRecord[] {
    return this.tracking.list().map((record) => {
      let refreshed = this.funnelAnalysis.refresh(record, config);
      const efficiency = this.analytics.calculateEfficiency({
        conversionRate: refreshed.conversionRate,
        dropOffRate: refreshed.dropOffRate,
        landingPageScore: refreshed.landingPageScore,
        audienceQuality: this.audienceQuality(),
        attributedConversions: this.attributedConversions(),
      });
      refreshed = {
        ...refreshed,
        conversionEfficiencyScore: efficiency,
        recommendedOptimization: this.recommendations.recommend({
          ...refreshed,
          conversionEfficiencyScore: efficiency,
        }),
      };
      this.tracking.persist(refreshed);
      return refreshed;
    });
  }

  private selectRecords(
    input: MeasureConversionInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRecord[] {
    let records = this.refreshAll(config);
    if (input.conversionRecordId) {
      const one = this.tracking.get(input.conversionRecordId);
      records = one ? [this.funnelAnalysis.refresh(one, config)] : [];
    } else if (input.marketingChannel) {
      records = records.filter((r) => r.marketingChannel === input.marketingChannel);
    } else if (input.campaignReference) {
      records = records.filter((r) => r.campaignReference === input.campaignReference);
    }
    return records;
  }

  trackDropOff(
    input: MeasureConversionInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.selectRecords(input, config);

    appendCviLog({
      event: "funnel_tracking",
      level: "info",
      details: `Tracked drop-off · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "track_drop_off",
      engineRecord: engine,
      conversionRecords: records,
      validation: {
        validationReportId: `cvi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No conversion records for drop-off tracking"] : [],
        durationMs: Date.now() - started,
        metadataVersion: CVI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  measureLandingPage(
    input: MeasureConversionInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.selectRecords(input, config).map((record) => {
      const landingPageScore = this.analytics.measureLandingPage(
        this.seoLandingHint(),
        record.conversionRate,
      );
      const updated = this.funnelAnalysis.refresh({ ...record, landingPageScore }, config);
      updated.recommendedOptimization = this.recommendations.recommend(updated);
      this.tracking.persist(updated);
      return updated;
    });

    appendCviLog({
      event: "conversion_analysis",
      level: "info",
      details: `Measured landing page performance · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "measure_landing_page",
      engineRecord: engine,
      conversionRecords: records,
      validation: {
        validationReportId: `cvi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No conversion records for landing page measurement"] : [],
        durationMs: Date.now() - started,
        metadataVersion: CVI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  measureCampaignConversion(
    input: MeasureConversionInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const campaignRef = this.resolveCampaignReference(input.campaignReference);
    const records = this.selectRecords(
      { ...input, campaignReference: campaignRef ?? undefined },
      config,
    );

    appendCviLog({
      event: "conversion_analysis",
      level: "info",
      details: `Measured campaign conversion · campaign=${campaignRef ?? "none"}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "measure_campaign_conversion",
      engineRecord: engine,
      conversionRecords: records,
      validation: {
        validationReportId: `cvi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No conversion records for campaign measurement"] : [],
        durationMs: Date.now() - started,
        metadataVersion: CVI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  measureChannelConversion(
    input: MeasureConversionInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.selectRecords(input, config);

    appendCviLog({
      event: "conversion_analysis",
      level: "info",
      details: `Measured channel conversion · channel=${input.marketingChannel ?? "all"}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "measure_channel_conversion",
      engineRecord: engine,
      conversionRecords: records,
      validation: {
        validationReportId: `cvi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No conversion records for channel measurement"] : [],
        durationMs: Date.now() - started,
        metadataVersion: CVI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  detectBottlenecks(
    input: MeasureConversionInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.funnelAnalysis.detectBottlenecks(this.selectRecords(input, config));

    return this.metadataGenerator.buildRunReport({
      action: "detect_bottlenecks",
      engineRecord: engine,
      conversionRecords: records,
      validation: {
        validationReportId: `cvi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: records.length > 0 ? [`${records.length} bottleneck(s) detected`] : [],
        durationMs: Date.now() - started,
        metadataVersion: CVI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  detectAbandonment(
    input: MeasureConversionInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.funnelAnalysis.detectAbandonment(this.selectRecords(input, config));

    return this.metadataGenerator.buildRunReport({
      action: "detect_abandonment",
      engineRecord: engine,
      conversionRecords: records,
      validation: {
        validationReportId: `cvi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length > 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length > 0 ? [`${records.length} abandonment alert(s)`] : [],
        durationMs: Date.now() - started,
        metadataVersion: CVI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  calculateEfficiency(
    input: MeasureConversionInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const budgetHint = this.budgetEfficiencyHint();
    const records = this.selectRecords(input, config).map((record) => {
      const conversionEfficiencyScore = this.analytics.calculateEfficiency({
        conversionRate: record.conversionRate,
        dropOffRate: record.dropOffRate,
        landingPageScore: record.landingPageScore,
        audienceQuality: (this.audienceQuality() + budgetHint) / 2,
        attributedConversions: this.attributedConversions(),
      });
      const updated = this.funnelAnalysis.refresh(
        { ...record, conversionEfficiencyScore },
        config,
      );
      updated.recommendedOptimization = this.recommendations.recommend(updated);
      this.tracking.persist(updated);
      return updated;
    });

    return this.metadataGenerator.buildRunReport({
      action: "calculate_efficiency",
      engineRecord: engine,
      conversionRecords: records,
      validation: {
        validationReportId: `cvi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No conversion records for efficiency calculation"] : [],
        durationMs: Date.now() - started,
        metadataVersion: CVI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  recommendImprovements(
    input: RecommendImprovementsInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let records = this.refreshAll(config);
    if (input.conversionRecordId) {
      const one = this.tracking.get(input.conversionRecordId);
      records = one ? [this.funnelAnalysis.refresh(one, config)] : [];
    }
    records = this.recommendations.recommendForSet(records);
    for (const record of records) this.tracking.persist(record);

    appendCviLog({
      event: "recommendation_generation",
      level: "info",
      details: `Generated ${records.length} funnel recommendation(s)`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "recommend_improvements",
      engineRecord: engine,
      conversionRecords: records,
      validation: {
        validationReportId: `cvi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No conversion records for recommendations"] : [],
        durationMs: Date.now() - started,
        metadataVersion: CVI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  optimizeFunnel(
    input: OptimizeFunnelInput,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateOptimize(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "optimize_funnel",
        engineRecord: engine,
        conversionRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    // Structural optimization only — never applies to production campaigns.
    let records = this.refreshAll(config);
    if (records.length === 0) {
      const tracked = this.trackFunnel(
        {
          campaignReference: input.campaignReference,
          marketingChannel: "cross_channel",
          funnelStage: "landing",
          conversionRate: 6,
          dropOffRate: 55,
        },
        config,
      );
      records = tracked.conversionRecords;
    }

    records = this.funnelOptimization.optimizeSet(records).map((r) => ({
      ...r,
      campaignReference:
        this.resolveCampaignReference(input.campaignReference) ?? r.campaignReference,
      appliedToProductionCampaign: false as const,
      recommendedOptimization: this.recommendations.recommend(r),
    }));
    for (const record of records) this.tracking.persist(record);

    appendCviLog({
      event: "funnel_optimization",
      level: "info",
      details: `Optimized ${records.length} funnel record(s) · appliedToProductionCampaign=false`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "optimize_funnel",
      engineRecord: engine,
      conversionRecords: records,
      validation:
        records.length === 0
          ? validation
          : this.validator.validateConversionRecord(records[0]!),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.tracking.resetForTesting();
  }
}
