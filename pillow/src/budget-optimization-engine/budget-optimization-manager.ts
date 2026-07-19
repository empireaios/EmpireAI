/** R5-13 — Budget Optimization Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { MetaAdsIntegration } from "../meta-ads-integration/engine.js";
import type { GoogleAdsIntegration } from "../google-ads-integration/engine.js";
import type { TikTokAdsIntegration } from "../tiktok-ads-integration/engine.js";
import type { YouTubeAdsIntegration } from "../youtube-ads-integration/engine.js";
import type { CampaignManagerEngine } from "../campaign-manager/engine.js";
import type { AudienceIntelligenceEngine } from "../audience-intelligence/engine.js";
import type { AttributionEngine } from "../attribution-engine/engine.js";
import type { MarketingAnalyticsDashboard } from "../marketing-analytics-dashboard/engine.js";
import type { AiCampaignGenerator } from "../ai-campaign-generator/engine.js";
import {
  BOE_METADATA_VERSION,
  BUDGET_OPTIMIZATION_ENGINE_ID,
  MARKETING_CHANNELS,
} from "./paths.js";
import { appendBoeLog } from "./boe-logging.js";
import { BudgetAllocationEngine } from "./budget-allocation-engine.js";
import { SpendMonitoringEngine } from "./spend-monitoring-engine.js";
import { BudgetAnalyticsEngine } from "./budget-analytics-engine.js";
import { BudgetRecommendationEngine } from "./budget-recommendation-engine.js";
import { CrossChannelBudgetEngine } from "./cross-channel-budget-engine.js";
import { BudgetValidator } from "./budget-validator.js";
import { BudgetMetadataGenerator } from "./budget-metadata-generator.js";
import type { BudgetOptimizationEngineConfiguration } from "./configuration.js";
import type {
  AllocateBudgetInput,
  BudgetEngineRecord,
  BudgetRecord,
  BudgetRunReport,
  ConnectBudgetOptimizationInput,
  MarketingChannel,
  MonitorSpendInput,
  OptimizeBudgetsInput,
  ReallocateBudgetInput,
  RecommendAdjustmentsInput,
} from "./types.js";

export type BudgetOptimizationEngineDependencies = {
  marketingFramework: MarketingFrameworkEngine | null;
  metaAds: MetaAdsIntegration | null;
  googleAds: GoogleAdsIntegration | null;
  tiktokAds: TikTokAdsIntegration | null;
  youtubeAds: YouTubeAdsIntegration | null;
  campaignManager: CampaignManagerEngine | null;
  audienceIntelligence: AudienceIntelligenceEngine | null;
  attributionEngine: AttributionEngine | null;
  marketingAnalyticsDashboard: MarketingAnalyticsDashboard | null;
  aiCampaignGenerator: AiCampaignGenerator | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class BudgetOptimizationManager {
  private engineRecord: BudgetEngineRecord | null = null;
  private readonly allocation = new BudgetAllocationEngine();
  private readonly spendMonitor = new SpendMonitoringEngine();
  private readonly analytics = new BudgetAnalyticsEngine();
  private readonly recommendations = new BudgetRecommendationEngine();
  private readonly crossChannel = new CrossChannelBudgetEngine();
  private readonly validator = new BudgetValidator();
  private readonly metadataGenerator = new BudgetMetadataGenerator();

  constructor(private readonly deps: BudgetOptimizationEngineDependencies) {}

  getEngineRecord(): BudgetEngineRecord | null {
    return this.engineRecord;
  }

  getBudgetRecords(): BudgetRecord[] {
    return this.allocation.list();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): BudgetEngineRecord["dependencyPresence"] {
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
      attributionEngine: this.deps.attributionEngine
        ? this.probe(() => this.deps.attributionEngine!.getState())
        : false,
      marketingAnalyticsDashboard: this.deps.marketingAnalyticsDashboard
        ? this.probe(() => this.deps.marketingAnalyticsDashboard!.getState())
        : false,
      aiCampaignGenerator: this.deps.aiCampaignGenerator
        ? this.probe(() => this.deps.aiCampaignGenerator!.getState())
        : false,
    };
  }

  private requireConnected(): BudgetEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Budget Optimization Engine not connected — call connectBudgetOptimization first",
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

  private availableChannels(): MarketingChannel[] {
    const channels: MarketingChannel[] = [];
    if (safe(() => Boolean(this.deps.metaAds?.getState()), false)) channels.push("meta_ads");
    if (safe(() => Boolean(this.deps.googleAds?.getState()), false)) channels.push("google_ads");
    if (safe(() => Boolean(this.deps.tiktokAds?.getState()), false)) channels.push("tiktok_ads");
    if (safe(() => Boolean(this.deps.youtubeAds?.getState()), false)) channels.push("youtube_ads");
    return channels.length > 0 ? channels : this.crossChannel.defaultChannels([...MARKETING_CHANNELS]);
  }

  private attributedRevenue(): number {
    const records = safe(() => this.deps.attributionEngine?.getAttributionRecords() ?? [], []);
    return records.reduce((sum, r) => sum + r.attributionValue, 0);
  }

  private audienceQuality(): number {
    const audiences = safe(
      () => this.deps.audienceIntelligence?.getAudienceRecords() ?? [],
      [],
    );
    if (audiences.length === 0) return 50;
    return (
      audiences.reduce((sum, a) => sum + a.audienceQualityScore, 0) / audiences.length
    );
  }

  private dashboardSpendHint(): number {
    return safe(() => {
      const snapshot = this.deps.marketingAnalyticsDashboard?.getLatestSnapshot();
      return snapshot?.advertisingSpendSummary.totalSpend ?? 0;
    }, 0);
  }

  registerWithFramework(
    config: BudgetOptimizationEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: BudgetRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: BUDGET_OPTIMIZATION_ENGINE_ID,
        moduleVersion: BOE_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-13",
        authenticationMethod: "none",
        credentialRef: "vault://budget-optimization-engine",
        apiEndpointConfig: {
          baseUrl: "internal://budget-optimization-engine",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "budget.allocated",
            "budget.optimized",
            "budget.overspend",
            "budget.failed",
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

    appendBoeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Budget Optimization Engine with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `boe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: BOE_METADATA_VERSION,
      },
    };
  }

  connectBudgetOptimization(
    _input: ConnectBudgetOptimizationInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(BUDGET_OPTIMIZATION_ENGINE_ID);
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

    appendBoeLog({
      event: "engine_connect",
      level: "info",
      details: `Budget Optimization Engine connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      budgetRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  allocateBudget(
    input: AllocateBudgetInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateAllocate(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "allocate_budget",
        engineRecord: engine,
        budgetRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const spend = input.currentSpend ?? input.allocatedBudget * 0.3;
    const efficiency = this.analytics.calculateEfficiency({
      allocatedBudget: input.allocatedBudget,
      currentSpend: spend,
      attributedRevenue: this.attributedRevenue(),
      audienceQuality: this.audienceQuality(),
    });
    const draft = this.allocation.allocate({
      campaignReference: this.resolveCampaignReference(input.campaignReference),
      marketingChannel: input.marketingChannel,
      allocatedBudget: input.allocatedBudget,
      currentSpend: spend,
      efficiencyScore: efficiency,
      overspendDetected: false,
      inefficiencyDetected: false,
      optimizationRecommendation: "Initial allocation",
    });
    const refreshed = this.spendMonitor.refresh(draft, config);
    refreshed.optimizationRecommendation = this.recommendations.recommend(refreshed);
    this.allocation.persist(refreshed);

    appendBoeLog({
      event: "budget_allocation",
      level: "info",
      details: `Allocated $${refreshed.allocatedBudget} to ${refreshed.marketingChannel}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "allocate_budget",
      engineRecord: engine,
      budgetRecords: [refreshed],
      validation: this.validator.validateBudgetRecord(refreshed),
      durationMs: Date.now() - started,
    });
  }

  reallocateBudget(
    input: ReallocateBudgetInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.reallocationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "reallocate_budget",
        engineRecord: engine,
        budgetRecords: [],
        validation: {
          validationReportId: `boe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Reallocation rules disabled"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: BOE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const channels = input.channels?.length
      ? input.channels
      : this.crossChannel.defaultChannels(this.availableChannels());
    const spendHint = this.dashboardSpendHint();
    const totalBudget =
      input.totalBudget ?? (spendHint > 0 ? spendHint * 1.2 : 4000);
    const spendByChannel = this.crossChannel.synthesizeSpendByChannel(channels, totalBudget);
    const efficiencyByChannel: Record<string, number> = {};
    for (const channel of channels) {
      efficiencyByChannel[channel] = this.analytics.calculateEfficiency({
        allocatedBudget: totalBudget / channels.length,
        currentSpend: spendByChannel[channel] ?? 0,
        attributedRevenue: this.attributedRevenue() / channels.length,
        audienceQuality: this.audienceQuality(),
      });
    }

    const records = this.allocation.reallocateAcrossChannels({
      campaignReference: this.resolveCampaignReference(),
      totalBudget,
      channels,
      spendByChannel,
      efficiencyByChannel,
    }).map((r) => {
      const refreshed = this.spendMonitor.refresh(r, config);
      refreshed.optimizationRecommendation = this.recommendations.recommend(refreshed);
      this.allocation.persist(refreshed);
      return refreshed;
    });

    appendBoeLog({
      event: "budget_optimization",
      level: "info",
      details: `Reallocated across ${records.length} channel(s) · total=$${totalBudget}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "reallocate_budget",
      engineRecord: engine,
      budgetRecords: records,
      validation:
        records.length === 0
          ? {
              validationReportId: `boe-val-${Date.now()}`,
              validationTimestamp: new Date().toISOString(),
              decision: "fail",
              errors: ["No channels available for reallocation"],
              warnings: [],
              durationMs: Date.now() - started,
              metadataVersion: BOE_METADATA_VERSION,
            }
          : this.validator.validateBudgetRecord(records[0]!),
      durationMs: Date.now() - started,
    });
  }

  private refreshAll(config: BudgetOptimizationEngineConfiguration): BudgetRecord[] {
    return this.allocation.list().map((record) => {
      const refreshed = this.spendMonitor.refresh(record, config);
      refreshed.optimizationRecommendation = this.recommendations.recommend(refreshed);
      this.allocation.persist(refreshed);
      return refreshed;
    });
  }

  monitorSpend(
    input: MonitorSpendInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let records = this.refreshAll(config);
    if (input.budgetRecordId) {
      const one = this.allocation.get(input.budgetRecordId);
      records = one ? [this.spendMonitor.refresh(one, config)] : [];
      if (records[0]) {
        records[0].optimizationRecommendation = this.recommendations.recommend(records[0]);
        this.allocation.persist(records[0]);
      }
    }

    appendBoeLog({
      event: "spend_monitoring",
      level: "info",
      details: `Monitored spend · records=${records.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "monitor_spend",
      engineRecord: engine,
      budgetRecords: records,
      validation: {
        validationReportId: `boe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No budget records to monitor"] : [],
        durationMs: Date.now() - started,
        metadataVersion: BOE_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  monitorUtilization(
    input: MonitorSpendInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetRunReport {
    const report = this.monitorSpend(input, config);
    return { ...report, action: "monitor_utilization" };
  }

  detectInefficiencies(
    _input: MonitorSpendInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.spendMonitor.detectInefficiencies(this.refreshAll(config));
    return this.metadataGenerator.buildRunReport({
      action: "detect_inefficiencies",
      engineRecord: engine,
      budgetRecords: records,
      validation: {
        validationReportId: `boe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: records.length > 0 ? [`${records.length} inefficient budget(s)`] : [],
        durationMs: Date.now() - started,
        metadataVersion: BOE_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  detectOverspend(
    _input: MonitorSpendInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const records = this.spendMonitor.detectOverspend(this.refreshAll(config));
    return this.metadataGenerator.buildRunReport({
      action: "detect_overspend",
      engineRecord: engine,
      budgetRecords: records,
      validation: {
        validationReportId: `boe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length > 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length > 0 ? [`${records.length} overspend alert(s)`] : [],
        durationMs: Date.now() - started,
        metadataVersion: BOE_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  calculateEfficiency(
    input: MonitorSpendInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let records = this.refreshAll(config);
    if (input.budgetRecordId) {
      const one = this.allocation.get(input.budgetRecordId);
      records = one ? [one] : [];
    }
    records = records.map((record) => {
      const efficiencyScore = this.analytics.calculateEfficiency({
        allocatedBudget: record.allocatedBudget,
        currentSpend: record.currentSpend,
        attributedRevenue: this.attributedRevenue(),
        audienceQuality: this.audienceQuality(),
      });
      const updated = this.spendMonitor.refresh({ ...record, efficiencyScore }, config);
      updated.optimizationRecommendation = this.recommendations.recommend(updated);
      this.allocation.persist(updated);
      return updated;
    });

    return this.metadataGenerator.buildRunReport({
      action: "calculate_efficiency",
      engineRecord: engine,
      budgetRecords: records,
      validation: {
        validationReportId: `boe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No budget records for efficiency calculation"] : [],
        durationMs: Date.now() - started,
        metadataVersion: BOE_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  recommendAdjustments(
    input: RecommendAdjustmentsInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let records = this.refreshAll(config);
    if (input.budgetRecordId) {
      const one = this.allocation.get(input.budgetRecordId);
      records = one ? [this.spendMonitor.refresh(one, config)] : [];
    }
    records = this.recommendations.recommendForSet(records);
    for (const record of records) this.allocation.persist(record);

    appendBoeLog({
      event: "recommendation_generation",
      level: "info",
      details: `Generated ${records.length} budget recommendation(s)`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "recommend_adjustments",
      engineRecord: engine,
      budgetRecords: records,
      validation: {
        validationReportId: `boe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: records.length === 0 ? "partial" : "pass",
        errors: [],
        warnings: records.length === 0 ? ["No budget records for recommendations"] : [],
        durationMs: Date.now() - started,
        metadataVersion: BOE_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }

  optimizeBudgets(
    input: OptimizeBudgetsInput,
    config: BudgetOptimizationEngineConfiguration,
  ): BudgetRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateOptimize(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "optimize_budgets",
        engineRecord: engine,
        budgetRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    // Structural optimization only — never applies to active campaigns.
    const reallocated = this.reallocateBudget(
      {
        totalBudget: this.dashboardSpendHint() > 0 ? this.dashboardSpendHint() * 1.1 : 5000,
        channels: this.availableChannels(),
      },
      config,
    );
    const records = reallocated.budgetRecords.map((r) => ({
      ...r,
      campaignReference: this.resolveCampaignReference(input.campaignReference) ?? r.campaignReference,
      appliedToActiveCampaign: false as const,
    }));
    for (const record of records) this.allocation.persist(record);

    appendBoeLog({
      event: "budget_optimization",
      level: "info",
      details: `Optimized ${records.length} budget(s) · appliedToActiveCampaign=false`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "optimize_budgets",
      engineRecord: engine,
      budgetRecords: records,
      validation:
        records.length === 0
          ? validation
          : this.validator.validateBudgetRecord(records[0]!),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.allocation.resetForTesting();
  }
}
