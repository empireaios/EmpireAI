/** R5-10 — Marketing Analytics Dashboard Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { MetaAdsIntegration } from "../meta-ads-integration/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import type { TikTokAdsIntegration } from "../tiktok-ads-integration/engine.js";
import type { YouTubeAdsIntegration } from "../youtube-ads-integration/engine.js";
import type { SeoIntelligenceEngine } from "../seo-intelligence-engine/engine.js";
import type { CampaignManagerEngine } from "../campaign-manager/engine.js";
import type { AudienceIntelligenceEngine } from "../audience-intelligence/engine.js";
import type { AttributionEngine } from "../attribution-engine/engine.js";
import { MAD_METADATA_VERSION, MARKETING_ANALYTICS_DASHBOARD_ID } from "./paths.js";
import { appendMadLog } from "./mad-logging.js";
import { MarketingAnalyticsAggregator } from "./marketing-analytics-aggregator.js";
import { MarketingDashboardEngine } from "./marketing-dashboard-engine.js";
import { DashboardValidator } from "./dashboard-validator.js";
import { DashboardMetadataGenerator } from "./dashboard-metadata-generator.js";
import type { MarketingAnalyticsDashboardConfiguration } from "./configuration.js";
import type {
  AggregateKpisInput,
  ConnectDashboardInput,
  DashboardEngineRecord,
  DashboardRunReport,
  DashboardSnapshot,
  GenerateExecutiveSummaryInput,
  RefreshDashboardInput,
} from "./types.js";

export type MarketingAnalyticsDashboardDependencies = {
  marketingFramework: MarketingFrameworkEngine | null;
  metaAds: MetaAdsIntegration | null;
  googleAds: GoogleAdsIntegration | null;
  tiktokAds: TikTokAdsIntegration | null;
  youtubeAds: YouTubeAdsIntegration | null;
  seoIntelligence: SeoIntelligenceEngine | null;
  campaignManager: CampaignManagerEngine | null;
  audienceIntelligence: AudienceIntelligenceEngine | null;
  attributionEngine: AttributionEngine | null;
};

export class MarketingAnalyticsDashboardManager {
  private engineRecord: DashboardEngineRecord | null = null;
  private latestSnapshot: DashboardSnapshot | null = null;
  private readonly aggregator: MarketingAnalyticsAggregator;
  private readonly dashboardEngine: MarketingDashboardEngine;
  private readonly validator = new DashboardValidator();
  private readonly metadataGenerator = new DashboardMetadataGenerator();

  constructor(private readonly deps: MarketingAnalyticsDashboardDependencies) {
    this.aggregator = new MarketingAnalyticsAggregator(deps);
    this.dashboardEngine = new MarketingDashboardEngine(this.aggregator);
  }

  getEngineRecord(): DashboardEngineRecord | null {
    return this.engineRecord;
  }

  getLatestSnapshot(): DashboardSnapshot | null {
    return this.latestSnapshot;
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): DashboardEngineRecord["dependencyPresence"] {
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
    };
  }

  private requireConnected(): DashboardEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Marketing Analytics Dashboard not connected — call connectDashboard first",
      );
    }
    return this.engineRecord;
  }

  registerWithFramework(
    config: MarketingAnalyticsDashboardConfiguration,
  ): { frameworkModuleId: string | null; validation: DashboardRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: MARKETING_ANALYTICS_DASHBOARD_ID,
        moduleVersion: MAD_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-10",
        authenticationMethod: "none",
        credentialRef: "vault://marketing-analytics-dashboard",
        apiEndpointConfig: {
          baseUrl: "internal://marketing-analytics-dashboard",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "dashboard.refresh",
            "dashboard.kpi",
            "dashboard.executive_summary",
            "dashboard.failed",
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

    appendMadLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Marketing Analytics Dashboard with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `mad-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: MAD_METADATA_VERSION,
      },
    };
  }

  connectDashboard(
    input: ConnectDashboardInput,
    config: MarketingAnalyticsDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    const access = this.validator.validateAccess(input, config);
    if (access.decision === "fail") {
      const failedRecord = this.metadataGenerator.buildEngineRecord({
        frameworkModuleId: null,
        operationalState: "failed",
        validationStatus: "failed",
        dependencyPresence: this.dependencyPresence(),
      });
      this.engineRecord = failedRecord;
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        engineRecord: failedRecord,
        snapshot: null,
        validation: access,
        durationMs: Date.now() - started,
      });
    }

    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(MARKETING_ANALYTICS_DASHBOARD_ID);
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
    if (access.warnings.length > 0) {
      validation.warnings.push(...access.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendMadLog({
      event: "engine_connect",
      level: "info",
      details: `Marketing Analytics Dashboard connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      snapshot: null,
      validation,
      durationMs: Date.now() - started,
    });
  }

  refreshDashboard(
    input: RefreshDashboardInput,
    config: MarketingAnalyticsDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const access = this.validator.validateAccess(input, config);
    if (access.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "refresh_dashboard",
        engineRecord: engine,
        snapshot: this.latestSnapshot,
        validation: access,
        durationMs: Date.now() - started,
      });
    }

    const snapshot = this.dashboardEngine.buildSnapshot(
      config,
      input.includeAlerts !== false,
    );
    const validation = this.validator.validateSnapshot(snapshot);
    if (access.warnings.length > 0) {
      validation.warnings.push(...access.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }
    snapshot.validationStatus =
      validation.decision === "fail"
        ? "failed"
        : validation.decision === "partial"
          ? "partial"
          : "passed";
    this.latestSnapshot = snapshot;

    appendMadLog({
      event: "dashboard_refresh",
      level: "info",
      details: `Dashboard refreshed · overall=${snapshot.kpiSummary.overallScore} · widgets=${snapshot.widgets.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "refresh_dashboard",
      engineRecord: engine,
      snapshot,
      validation,
      durationMs: Date.now() - started,
    });
  }

  aggregateKpis(
    input: AggregateKpisInput,
    config: MarketingAnalyticsDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const access = this.validator.validateAccess(input, config);
    if (access.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "aggregate_kpis",
        engineRecord: engine,
        snapshot: this.latestSnapshot,
        validation: access,
        durationMs: Date.now() - started,
      });
    }

    if (!config.kpiSelectionRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "aggregate_kpis",
        engineRecord: engine,
        snapshot: this.latestSnapshot,
        validation: {
          validationReportId: `mad-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["KPI selection rules disabled"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: MAD_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const snapshot = this.dashboardEngine.buildSnapshot(config, false);
    this.latestSnapshot = snapshot;

    appendMadLog({
      event: "kpi_aggregation",
      level: "info",
      details: `KPI aggregation complete · overall=${snapshot.kpiSummary.overallScore}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "aggregate_kpis",
      engineRecord: engine,
      snapshot,
      validation: this.validator.validateSnapshot(snapshot),
      durationMs: Date.now() - started,
    });
  }

  generateExecutiveSummary(
    input: GenerateExecutiveSummaryInput,
    config: MarketingAnalyticsDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const access = this.validator.validateAccess(input, config);
    if (access.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "generate_executive_summary",
        engineRecord: engine,
        snapshot: this.latestSnapshot,
        validation: access,
        durationMs: Date.now() - started,
      });
    }

    const snapshot = this.dashboardEngine.buildSnapshot(config, true);
    this.latestSnapshot = snapshot;

    appendMadLog({
      event: "executive_summary_generation",
      level: "info",
      details: `Executive summary generated · length=${snapshot.executiveSummary.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_executive_summary",
      engineRecord: engine,
      snapshot,
      validation: this.validator.validateSnapshot(snapshot),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.latestSnapshot = null;
  }
}
