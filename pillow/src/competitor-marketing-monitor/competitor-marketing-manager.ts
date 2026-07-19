/** R5-15 — Competitor Marketing Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { MetaAdsIntegration } from "../meta-ads-integration/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import type { TikTokAdsIntegration } from "../tiktok-ads-integration/engine.js";
import type { YouTubeAdsIntegration } from "../youtube-ads-integration/engine.js";
import type { SeoIntelligenceEngine } from "../seo-intelligence-engine/engine.js";
import type { CampaignManagerEngine } from "../campaign-manager/engine.js";
import type { AudienceIntelligenceEngine } from "../audience-intelligence/engine.js";
import type { MarketingAnalyticsDashboard } from "../marketing-analytics-dashboard/engine.js";
import type { ConversionIntelligence } from "../conversion-intelligence/engine.js";
import {
  CMM_METADATA_VERSION,
  COMPETITOR_MARKETING_MONITOR_ID,
} from "./paths.js";
import { appendCmmLog } from "./cmm-logging.js";
import { CompetitorDiscoveryEngine } from "./competitor-discovery-engine.js";
import { CampaignMonitoringEngine } from "./campaign-monitoring-engine.js";
import { SeoMonitoringEngine } from "./seo-monitoring-engine.js";
import { CompetitiveAnalysisEngine } from "./competitive-analysis-engine.js";
import { CompetitiveRecommendationEngine } from "./competitive-recommendation-engine.js";
import { CompetitorValidator } from "./competitor-validator.js";
import { CompetitorMetadataGenerator } from "./competitor-metadata-generator.js";
import type { CompetitorMarketingMonitorConfiguration } from "./configuration.js";
import type {
  CompetitorEngineRecord,
  CompetitorRecord,
  CompetitorRunReport,
  ConnectCompetitorMarketingMonitorInput,
  DiscoverCompetitorsInput,
  GenerateIntelligenceInput,
  MarketingChannel,
  MonitorCompetitorsInput,
} from "./types.js";

export type CompetitorMarketingMonitorDependencies = {
  marketingFramework: MarketingFrameworkEngine | null;
  metaAds: MetaAdsIntegration | null;
  googleAds: GoogleAdsIntegration | null;
  tiktokAds: TikTokAdsIntegration | null;
  youtubeAds: YouTubeAdsIntegration | null;
  seoIntelligence: SeoIntelligenceEngine | null;
  campaignManager: CampaignManagerEngine | null;
  audienceIntelligence: AudienceIntelligenceEngine | null;
  marketingAnalyticsDashboard: MarketingAnalyticsDashboard | null;
  conversionIntelligence: ConversionIntelligence | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class CompetitorMarketingManager {
  private engineRecord: CompetitorEngineRecord | null = null;
  private readonly discovery = new CompetitorDiscoveryEngine();
  private readonly campaignMonitor = new CampaignMonitoringEngine();
  private readonly seoMonitor = new SeoMonitoringEngine();
  private readonly analysis = new CompetitiveAnalysisEngine();
  private readonly recommendations = new CompetitiveRecommendationEngine();
  private readonly validator = new CompetitorValidator();
  private readonly metadataGenerator = new CompetitorMetadataGenerator();

  constructor(private readonly deps: CompetitorMarketingMonitorDependencies) {}

  getEngineRecord(): CompetitorEngineRecord | null {
    return this.engineRecord;
  }

  getCompetitorRecords(): CompetitorRecord[] {
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

  private dependencyPresence(): CompetitorEngineRecord["dependencyPresence"] {
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
      marketingAnalyticsDashboard: this.deps.marketingAnalyticsDashboard
        ? this.probe(() => this.deps.marketingAnalyticsDashboard!.getState())
        : false,
      conversionIntelligence: this.deps.conversionIntelligence
        ? this.probe(() => this.deps.conversionIntelligence!.getState())
        : false,
    };
  }

  private requireConnected(): CompetitorEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Competitor Marketing Monitor not connected — call connectCompetitorMarketingMonitor first",
      );
    }
    return this.engineRecord;
  }

  private resolveCampaignReference(): string | null {
    const campaigns = safe(() => this.deps.campaignManager?.getCampaignRecords() ?? [], []);
    return campaigns[0]?.campaignId ?? null;
  }

  private seoHint(): number {
    return safe(() => {
      const state = this.deps.seoIntelligence?.getState();
      const score = (state as { health?: { healthScore?: number } } | undefined)?.health
        ?.healthScore;
      return typeof score === "number" ? score : 55;
    }, 55);
  }

  private audienceOverlap(): number {
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

  private conversionPressure(): number {
    return safe(() => {
      const records = this.deps.conversionIntelligence?.getConversionRecords() ?? [];
      if (records.length === 0) return 40;
      return (
        records.reduce((sum, r) => sum + r.conversionEfficiencyScore, 0) / records.length
      );
    }, 40);
  }

  private channelPresence(channel: MarketingChannel): number {
    const map: Record<MarketingChannel, () => boolean> = {
      meta_ads: () => safe(() => Boolean(this.deps.metaAds?.getState()), false),
      google_ads: () => safe(() => Boolean(this.deps.googleAds?.getState()), false),
      tiktok_ads: () => safe(() => Boolean(this.deps.tiktokAds?.getState()), false),
      youtube_ads: () => safe(() => Boolean(this.deps.youtubeAds?.getState()), false),
      seo: () => safe(() => Boolean(this.deps.seoIntelligence?.getState()), false),
      cross_channel: () => true,
    };
    return map[channel]() ? 70 : 40;
  }

  registerWithFramework(
    config: CompetitorMarketingMonitorConfiguration,
  ): { frameworkModuleId: string | null; validation: CompetitorRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: COMPETITOR_MARKETING_MONITOR_ID,
        moduleVersion: CMM_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-15",
        authenticationMethod: "none",
        credentialRef: "vault://competitor-marketing-monitor",
        apiEndpointConfig: {
          baseUrl: "internal://competitor-marketing-monitor",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "competitor.discovered",
            "competitor.monitored",
            "competitor.strategy_change",
            "competitor.failed",
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

    appendCmmLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Competitor Marketing Monitor with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `cmm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CMM_METADATA_VERSION,
      },
    };
  }

  connectCompetitorMarketingMonitor(
    _input: ConnectCompetitorMarketingMonitorInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(COMPETITOR_MARKETING_MONITOR_ID);
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

    appendCmmLog({
      event: "engine_connect",
      level: "info",
      details: `Competitor Marketing Monitor connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      competitorRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  discoverCompetitors(
    input: DiscoverCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateDiscover(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "discover_competitors",
        engineRecord: engine,
        competitorRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const channel: MarketingChannel = input.marketingChannel ?? "cross_channel";
    const identifier = (input.seedIdentifier ?? "competitor-alpha").trim();
    const competitiveScore = this.analysis.calculateScore({
      channelPresence: this.channelPresence(channel),
      seoHint: this.seoHint(),
      audienceOverlap: this.audienceOverlap(),
      conversionPressure: this.conversionPressure(),
    });

    let draft = this.discovery.discover({
      competitorIdentifier: identifier,
      marketingChannel: channel,
      campaignReference: this.resolveCampaignReference(),
      keywordReference: `kw-${identifier}`,
      promotionSummary: `Authorized public signal for ${identifier}`,
      competitiveScore,
      recommendationSummary: "Initial discovery",
      strategyChangeDetected: false,
      emergingCompetitor: competitiveScore >= config.emergingCompetitorScoreThreshold,
    });
    draft.recommendationSummary = this.recommendations.recommend(draft);
    this.discovery.persist(draft);

    // Seed a second public competitor for market awareness coverage.
    if (this.discovery.list().length === 1) {
      const secondaryScore = Math.max(20, competitiveScore - 12);
      let secondary = this.discovery.discover({
        competitorIdentifier: `${identifier}-rival`,
        marketingChannel: channel === "cross_channel" ? "google_ads" : channel,
        campaignReference: this.resolveCampaignReference(),
        keywordReference: `kw-${identifier}-rival`,
        promotionSummary: `Authorized public signal for ${identifier}-rival`,
        competitiveScore: secondaryScore,
        recommendationSummary: "Secondary discovery",
        strategyChangeDetected: false,
        emergingCompetitor: secondaryScore >= config.emergingCompetitorScoreThreshold,
      });
      secondary.recommendationSummary = this.recommendations.recommend(secondary);
      this.discovery.persist(secondary);
    }

    const records = this.discovery.list();
    appendCmmLog({
      event: "competitor_discovery",
      level: "info",
      details: `Discovered competitor signals · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "discover_competitors",
      engineRecord: engine,
      competitorRecords: records,
      validation: this.validator.validateCompetitorRecord(draft),
      durationMs: Date.now() - started,
    });
  }

  private selectRecords(input: MonitorCompetitorsInput): CompetitorRecord[] {
    let records = this.discovery.list();
    if (input.competitorRecordId) {
      const one = this.discovery.get(input.competitorRecordId);
      records = one ? [one] : [];
    } else if (input.competitorIdentifier) {
      records = records.filter((r) => r.competitorIdentifier === input.competitorIdentifier);
    } else if (input.marketingChannel) {
      records = records.filter((r) => r.marketingChannel === input.marketingChannel);
    }
    return records;
  }

  private persistAll(records: CompetitorRecord[]): CompetitorRecord[] {
    const recommended = this.recommendations.recommendForSet(records);
    for (const record of recommended) this.discovery.persist(record);
    return recommended;
  }

  private ensureRecords(
    input: MonitorCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRecord[] {
    let records = this.selectRecords(input);
    if (records.length === 0) {
      this.discoverCompetitors(
        {
          seedIdentifier: input.competitorIdentifier ?? "competitor-alpha",
          marketingChannel: input.marketingChannel,
        },
        config,
      );
      records = this.selectRecords(input);
    }
    return records;
  }

  monitorCampaigns(
    input: MonitorCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.persistAll(
      this.campaignMonitor.monitorCampaigns(this.ensureRecords(input, config)),
    );

    appendCmmLog({
      event: "campaign_monitoring",
      level: "info",
      details: `Monitored competitor campaigns · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "monitor_campaigns",
      engineRecord: engine,
      competitorRecords: records,
      validation: {
        validationReportId: `cmm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No competitor records to monitor"] : [],
        durationMs: Date.now() - started,
        metadataVersion: CMM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  monitorAdvertisements(
    input: MonitorCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.persistAll(
      this.campaignMonitor.monitorAdvertisements(this.ensureRecords(input, config)),
    );
    return this.metadataGenerator.buildRunReport({
      action: "monitor_advertisements",
      engineRecord: engine,
      competitorRecords: records,
      validation: {
        validationReportId: `cmm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CMM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  monitorKeywords(
    input: MonitorCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.persistAll(
      this.seoMonitor.monitorKeywords(this.ensureRecords(input, config)),
    );

    appendCmmLog({
      event: "seo_monitoring",
      level: "info",
      details: `Monitored competitor keywords · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "monitor_keywords",
      engineRecord: engine,
      competitorRecords: records,
      validation: {
        validationReportId: `cmm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CMM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  monitorSeoRankings(
    input: MonitorCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.persistAll(
      this.seoMonitor.monitorSeoRankings(this.ensureRecords(input, config), this.seoHint()),
    );

    appendCmmLog({
      event: "seo_monitoring",
      level: "info",
      details: `Monitored competitor SEO rankings · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "monitor_seo_rankings",
      engineRecord: engine,
      competitorRecords: records,
      validation: {
        validationReportId: `cmm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CMM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  monitorLandingPages(
    input: MonitorCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.persistAll(
      this.campaignMonitor.monitorLandingPages(this.ensureRecords(input, config)),
    );
    return this.metadataGenerator.buildRunReport({
      action: "monitor_landing_pages",
      engineRecord: engine,
      competitorRecords: records,
      validation: {
        validationReportId: `cmm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CMM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  monitorPromotions(
    input: MonitorCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.persistAll(
      this.campaignMonitor.monitorPromotions(this.ensureRecords(input, config)),
    );
    return this.metadataGenerator.buildRunReport({
      action: "monitor_promotions",
      engineRecord: engine,
      competitorRecords: records,
      validation: {
        validationReportId: `cmm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CMM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  detectStrategyChanges(
    input: MonitorCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const base = this.ensureRecords(input, config);
    const changed = this.analysis.detectStrategyChanges(base, config);
    const records = this.persistAll(changed.length > 0 ? changed : base.map((r) => ({
      ...r,
      strategyChangeDetected: r.competitiveScore >= config.competitiveAlertThreshold,
    })).filter((r) => r.strategyChangeDetected));

    appendCmmLog({
      event: "competitive_analysis",
      level: "info",
      details: `Detected strategy changes · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "detect_strategy_changes",
      engineRecord: engine,
      competitorRecords: records,
      validation: {
        validationReportId: `cmm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: records.length > 0 ? [`${records.length} strategy change(s)`] : [],
        durationMs: Date.now() - started,
        metadataVersion: CMM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  detectEmergingCompetitors(
    input: MonitorCompetitorsInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.persistAll(
      this.analysis.detectEmerging(this.ensureRecords(input, config), config),
    );

    return this.metadataGenerator.buildRunReport({
      action: "detect_emerging_competitors",
      engineRecord: engine,
      competitorRecords: records,
      validation: {
        validationReportId: `cmm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length > 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length > 0 ? [`${records.length} emerging competitor(s)`] : [],
        durationMs: Date.now() - started,
        metadataVersion: CMM_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  generateCompetitiveIntelligence(
    input: GenerateIntelligenceInput,
    config: CompetitorMarketingMonitorConfiguration,
  ): CompetitorRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let records = this.ensureRecords(
      { competitorRecordId: input.competitorRecordId },
      config,
    );
    records = this.campaignMonitor.monitorCampaigns(records);
    records = this.seoMonitor.monitorKeywords(records);
    records = this.seoMonitor.monitorSeoRankings(records, this.seoHint());
    records = this.persistAll(records);

    appendCmmLog({
      event: "competitive_analysis",
      level: "info",
      details: `Generated competitive intelligence · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_competitive_intelligence",
      engineRecord: engine,
      competitorRecords: records,
      validation:
        records.length === 0
          ? {
              validationReportId: `cmm-val-${Date.now()}`,
              validationTimestamp: new Date().toISOString(),
              decision: "partial",
              errors: [],
              warnings: ["No competitor records for intelligence generation"],
              durationMs: Date.now() - started,
              metadataVersion: CMM_METADATA_VERSION,
            }
          : this.validator.validateCompetitorRecord(records[0]!),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.discovery.resetForTesting();
  }
}
