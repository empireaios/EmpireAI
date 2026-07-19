/** R5-16 — Viral Trend Intelligence Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { MetaAdsIntegration } from "../meta-ads-integration/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import type { TikTokAdsIntegration } from "../tiktok-ads-integration/engine.js";
import type { YouTubeAdsIntegration } from "../youtube-ads-integration/engine.js";
import type { SeoIntelligenceEngine } from "../seo-intelligence-engine/engine.js";
import type { AudienceIntelligenceEngine } from "../audience-intelligence/engine.js";
import type { MarketingAnalyticsDashboard } from "../marketing-analytics-dashboard/engine.js";
import type { CompetitorMarketingMonitor } from "../competitor-marketing-monitor/engine.js";
import {
  VIRAL_TREND_INTELLIGENCE_ID,
  VTI_METADATA_VERSION,
} from "./paths.js";
import { appendVtiLog } from "./vti-logging.js";
import { TrendDiscoveryEngine } from "./trend-discovery-engine.js";
import { TrendMonitoringEngine } from "./trend-monitoring-engine.js";
import { TrendAnalyticsEngine } from "./trend-analytics-engine.js";
import { TrendPredictionEngine } from "./trend-prediction-engine.js";
import { TrendRecommendationEngine } from "./trend-recommendation-engine.js";
import { TrendValidator } from "./trend-validator.js";
import { TrendMetadataGenerator } from "./trend-metadata-generator.js";
import type { ViralTrendIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectViralTrendIntelligenceInput,
  DiscoverTrendsInput,
  MonitorTrendsInput,
  PredictTrendsInput,
  RecommendTrendsInput,
  TrendCategory,
  TrendEngineRecord,
  TrendRecord,
  TrendRunReport,
  TrendSource,
} from "./types.js";

export type ViralTrendIntelligenceDependencies = {
  marketingFramework: MarketingFrameworkEngine | null;
  metaAds: MetaAdsIntegration | null;
  googleAds: GoogleAdsIntegration | null;
  tiktokAds: TikTokAdsIntegration | null;
  youtubeAds: YouTubeAdsIntegration | null;
  seoIntelligence: SeoIntelligenceEngine | null;
  audienceIntelligence: AudienceIntelligenceEngine | null;
  marketingAnalyticsDashboard: MarketingAnalyticsDashboard | null;
  competitorMarketingMonitor: CompetitorMarketingMonitor | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class ViralTrendIntelligenceManager {
  private engineRecord: TrendEngineRecord | null = null;
  private readonly discovery = new TrendDiscoveryEngine();
  private readonly monitoring = new TrendMonitoringEngine();
  private readonly analytics = new TrendAnalyticsEngine();
  private readonly prediction = new TrendPredictionEngine();
  private readonly recommendations = new TrendRecommendationEngine();
  private readonly validator = new TrendValidator();
  private readonly metadataGenerator = new TrendMetadataGenerator();

  constructor(private readonly deps: ViralTrendIntelligenceDependencies) {}

  getEngineRecord(): TrendEngineRecord | null {
    return this.engineRecord;
  }

  getTrendRecords(): TrendRecord[] {
    return this.discovery.list();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): TrendEngineRecord["dependencyPresence"] {
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
      audienceIntelligence: this.deps.audienceIntelligence
        ? this.probe(() => this.deps.audienceIntelligence!.getState())
        : false,
      marketingAnalyticsDashboard: this.deps.marketingAnalyticsDashboard
        ? this.probe(() => this.deps.marketingAnalyticsDashboard!.getState())
        : false,
      competitorMarketingMonitor: this.deps.competitorMarketingMonitor
        ? this.probe(() => this.deps.competitorMarketingMonitor!.getState())
        : false,
    };
  }

  private requireConnected(): TrendEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Viral Trend Intelligence not connected — call connectViralTrendIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private seoHint(): number {
    return safe(() => {
      const state = this.deps.seoIntelligence?.getState();
      const score = (state as { health?: { healthScore?: number } } | undefined)?.health
        ?.healthScore;
      return typeof score === "number" ? score : 55;
    }, 55);
  }

  private audienceMomentum(): number {
    const audiences = safe(
      () => this.deps.audienceIntelligence?.getAudienceRecords() ?? [],
      [],
    );
    if (audiences.length === 0) return 45;
    return Math.min(
      100,
      audiences.reduce((sum, a) => sum + a.audienceQualityScore, 0) / audiences.length,
    );
  }

  private competitorPressure(): number {
    return safe(() => {
      const records = this.deps.competitorMarketingMonitor?.getCompetitorRecords() ?? [];
      if (records.length === 0) return 40;
      return records.reduce((sum, r) => sum + r.competitiveScore, 0) / records.length;
    }, 40);
  }

  private channelSignal(source: TrendSource): number {
    const map: Partial<Record<TrendSource, () => boolean>> = {
      meta_ads: () => safe(() => Boolean(this.deps.metaAds?.getState()), false),
      google_ads: () => safe(() => Boolean(this.deps.googleAds?.getState()), false),
      tiktok_ads: () => safe(() => Boolean(this.deps.tiktokAds?.getState()), false),
      youtube_ads: () => safe(() => Boolean(this.deps.youtubeAds?.getState()), false),
      seo: () => safe(() => Boolean(this.deps.seoIntelligence?.getState()), false),
      audience: () => safe(() => Boolean(this.deps.audienceIntelligence?.getState()), false),
      competitor: () =>
        safe(() => Boolean(this.deps.competitorMarketingMonitor?.getState()), false),
      cross_source: () => true,
    };
    return map[source]?.() ? 72 : 42;
  }

  registerWithFramework(
    config: ViralTrendIntelligenceConfiguration,
  ): { frameworkModuleId: string | null; validation: TrendRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: VIRAL_TREND_INTELLIGENCE_ID,
        moduleVersion: VTI_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-16",
        authenticationMethod: "none",
        credentialRef: "vault://viral-trend-intelligence",
        apiEndpointConfig: {
          baseUrl: "internal://viral-trend-intelligence",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "trend.discovered",
            "trend.accelerating",
            "trend.declining",
            "trend.failed",
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

    appendVtiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Viral Trend Intelligence with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `vti-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: VTI_METADATA_VERSION,
      },
    };
  }

  connectViralTrendIntelligence(
    _input: ConnectViralTrendIntelligenceInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(VIRAL_TREND_INTELLIGENCE_ID);
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

    appendVtiLog({
      event: "engine_connect",
      level: "info",
      details: `Viral Trend Intelligence connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      trendRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  discoverTrends(
    input: DiscoverTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateDiscover(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "discover_trends",
        engineRecord: engine,
        trendRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const category: TrendCategory = input.trendCategory ?? "keyword";
    const source: TrendSource = input.trendSource ?? "cross_source";
    const seed = (input.seedKeyword ?? "emerging-signal").trim();
    const trendScore = this.analytics.calculateScore({
      channelSignal: this.channelSignal(source),
      seoHint: this.seoHint(),
      audienceMomentum: this.audienceMomentum(),
      competitorPressure: this.competitorPressure(),
    });
    const growthRate = this.analytics.estimateGrowthRate(trendScore, 48);

    let draft = this.discovery.discover({
      trendCategory: category,
      trendSource: source,
      keywordReference: seed,
      hashtagReference: `#${seed.replace(/\s+/g, "")}`,
      trendScore,
      growthRate,
      accelerationDetected: growthRate >= config.accelerationThresholdPercent,
      declineDetected: growthRate <= config.declineThresholdPercent,
      predictedScore: Math.min(100, trendScore + Math.max(0, growthRate * 0.2)),
      recommendationSummary: "Initial trend discovery",
    });
    draft.recommendationSummary = this.recommendations.recommend(draft);
    this.discovery.persist(draft);

    if (this.discovery.list().length === 1) {
      const secondaryScore = Math.max(20, trendScore - 10);
      const secondaryGrowth = this.analytics.estimateGrowthRate(secondaryScore, 55);
      let secondary = this.discovery.discover({
        trendCategory: "hashtag",
        trendSource: source === "cross_source" ? "tiktok_ads" : source,
        keywordReference: `${seed}-alt`,
        hashtagReference: `#${seed.replace(/\s+/g, "")}Alt`,
        trendScore: secondaryScore,
        growthRate: secondaryGrowth,
        accelerationDetected: secondaryGrowth >= config.accelerationThresholdPercent,
        declineDetected: secondaryGrowth <= config.declineThresholdPercent,
        predictedScore: Math.min(100, secondaryScore + 3),
        recommendationSummary: "Secondary trend discovery",
      });
      secondary.recommendationSummary = this.recommendations.recommend(secondary);
      this.discovery.persist(secondary);
    }

    const records = this.discovery.list();
    appendVtiLog({
      event: "trend_discovery",
      level: "info",
      details: `Discovered trend signals · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "discover_trends",
      engineRecord: engine,
      trendRecords: records,
      validation: this.validator.validateTrendRecord(draft),
      durationMs: Date.now() - started,
    });
  }

  private selectRecords(input: MonitorTrendsInput): TrendRecord[] {
    let records = this.discovery.list();
    if (input.trendRecordId) {
      const one = this.discovery.get(input.trendRecordId);
      records = one ? [one] : [];
    } else if (input.trendCategory) {
      records = records.filter((r) => r.trendCategory === input.trendCategory);
    } else if (input.trendSource) {
      records = records.filter((r) => r.trendSource === input.trendSource);
    }
    return records;
  }

  private persistAll(records: TrendRecord[]): TrendRecord[] {
    const recommended = this.recommendations.recommendForSet(records);
    for (const record of recommended) this.discovery.persist(record);
    return recommended;
  }

  private ensureRecords(
    input: MonitorTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRecord[] {
    let records = this.selectRecords(input);
    if (records.length === 0) {
      this.discoverTrends(
        {
          seedKeyword: "emerging-signal",
          trendCategory: input.trendCategory,
          trendSource: input.trendSource,
        },
        config,
      );
      records = this.selectRecords(input);
    }
    return records;
  }

  private monitorPass(
    action: TrendRunReport["action"],
    transform: (records: TrendRecord[]) => TrendRecord[],
    input: MonitorTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
    event: string,
  ): TrendRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.persistAll(transform(this.ensureRecords(input, config)));

    appendVtiLog({
      event,
      level: "info",
      details: `${action} · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      trendRecords: records,
      validation: {
        validationReportId: `vti-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No trend records to monitor"] : [],
        durationMs: Date.now() - started,
        metadataVersion: VTI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  monitorKeywords(
    input: MonitorTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    return this.monitorPass(
      "monitor_keywords",
      (r) => this.monitoring.monitorKeywords(r),
      input,
      config,
      "trend_monitoring",
    );
  }

  monitorHashtags(
    input: MonitorTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    return this.monitorPass(
      "monitor_hashtags",
      (r) => this.monitoring.monitorHashtags(r),
      input,
      config,
      "trend_monitoring",
    );
  }

  monitorProducts(
    input: MonitorTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    return this.monitorPass(
      "monitor_products",
      (r) => this.monitoring.monitorProducts(r),
      input,
      config,
      "trend_monitoring",
    );
  }

  monitorContent(
    input: MonitorTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    return this.monitorPass(
      "monitor_content",
      (r) => this.monitoring.monitorContent(r),
      input,
      config,
      "trend_monitoring",
    );
  }

  monitorCreators(
    input: MonitorTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    return this.monitorPass(
      "monitor_creators",
      (r) => this.monitoring.monitorCreators(r),
      input,
      config,
      "trend_monitoring",
    );
  }

  detectAcceleration(
    input: MonitorTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.persistAll(
      this.analytics.detectAcceleration(this.ensureRecords(input, config), config),
    );

    appendVtiLog({
      event: "trend_analysis",
      level: "info",
      details: `Detected acceleration · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "detect_acceleration",
      engineRecord: engine,
      trendRecords: records,
      validation: {
        validationReportId: `vti-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: records.length > 0 ? [`${records.length} accelerating trend(s)`] : [],
        durationMs: Date.now() - started,
        metadataVersion: VTI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  detectDecline(
    input: MonitorTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const base = this.ensureRecords(input, config).map((r) =>
      r.growthRate > 0 ? { ...r, growthRate: -18 } : r,
    );
    const records = this.persistAll(this.analytics.detectDecline(base, config));

    appendVtiLog({
      event: "trend_analysis",
      level: "info",
      details: `Detected decline · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "detect_decline",
      engineRecord: engine,
      trendRecords: records,
      validation: {
        validationReportId: `vti-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length > 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length > 0 ? [`${records.length} declining trend(s)`] : [],
        durationMs: Date.now() - started,
        metadataVersion: VTI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  predictTrends(
    input: PredictTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.predictionRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "predict_trends",
        engineRecord: engine,
        trendRecords: [],
        validation: {
          validationReportId: `vti-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Prediction rules disabled"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: VTI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let records = this.ensureRecords(
      { trendRecordId: input.trendRecordId },
      config,
    );
    records = this.persistAll(this.prediction.predictSet(records));

    appendVtiLog({
      event: "trend_prediction",
      level: "info",
      details: `Predicted ${records.length} trend(s)`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "predict_trends",
      engineRecord: engine,
      trendRecords: records,
      validation: {
        validationReportId: `vti-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No trend records for prediction"] : [],
        durationMs: Date.now() - started,
        metadataVersion: VTI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  recommendTrends(
    input: RecommendTrendsInput,
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let records = this.ensureRecords(
      { trendRecordId: input.trendRecordId },
      config,
    );
    records = this.persistAll(records);

    appendVtiLog({
      event: "trend_analysis",
      level: "info",
      details: `Generated ${records.length} trend recommendation(s)`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "recommend_trends",
      engineRecord: engine,
      trendRecords: records,
      validation: {
        validationReportId: `vti-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No trend records for recommendations"] : [],
        durationMs: Date.now() - started,
        metadataVersion: VTI_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.discovery.resetForTesting();
  }
}
