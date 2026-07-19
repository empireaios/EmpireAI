/** R5-12 — AI Campaign Generator Manager. */

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
import type { CreativeAssetManager } from "../creative-asset-manager/engine.js";
import { ACG_METADATA_VERSION, AI_CAMPAIGN_GENERATOR_ID, MARKETING_CHANNELS } from "./paths.js";
import { appendAcgLog } from "./acg-logging.js";
import { CampaignStrategyEngine } from "./campaign-strategy-engine.js";
import { AudienceRecommendationEngine } from "./audience-recommendation-engine.js";
import { BudgetRecommendationEngine } from "./budget-recommendation-engine.js";
import { CreativeRecommendationEngine } from "./creative-recommendation-engine.js";
import { CampaignPlanningEngine } from "./campaign-planning-engine.js";
import { CampaignValidator } from "./campaign-validator.js";
import { CampaignMetadataGenerator } from "./campaign-metadata-generator.js";
import type { AiCampaignGeneratorConfiguration } from "./configuration.js";
import type {
  AiCampaignEngineRecord,
  AiCampaignRecord,
  AiCampaignRunReport,
  ConnectAiCampaignGeneratorInput,
  GenerateCampaignInput,
  GenerateStrategyInput,
  MarketingChannel,
  RecommendInput,
} from "./types.js";

export type AiCampaignGeneratorDependencies = {
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
  creativeAssetManager: CreativeAssetManager | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class AiCampaignGeneratorManager {
  private engineRecord: AiCampaignEngineRecord | null = null;
  private readonly strategy = new CampaignStrategyEngine();
  private readonly audienceRec = new AudienceRecommendationEngine();
  private readonly budgetRec = new BudgetRecommendationEngine();
  private readonly creativeRec = new CreativeRecommendationEngine();
  private readonly planning = new CampaignPlanningEngine();
  private readonly validator = new CampaignValidator();
  private readonly metadataGenerator = new CampaignMetadataGenerator();

  constructor(private readonly deps: AiCampaignGeneratorDependencies) {}

  getEngineRecord(): AiCampaignEngineRecord | null {
    return this.engineRecord;
  }

  getCampaignRecords(): AiCampaignRecord[] {
    return this.planning.list();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): AiCampaignEngineRecord["dependencyPresence"] {
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
      creativeAssetManager: this.deps.creativeAssetManager
        ? this.probe(() => this.deps.creativeAssetManager!.getState())
        : false,
    };
  }

  private requireConnected(): AiCampaignEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "AI Campaign Generator not connected — call connectAiCampaignGenerator first",
      );
    }
    return this.engineRecord;
  }

  private availableChannels(): MarketingChannel[] {
    const channels: MarketingChannel[] = [];
    if (safe(() => Boolean(this.deps.metaAds?.getState()), false)) channels.push("meta_ads");
    if (safe(() => Boolean(this.deps.googleAds?.getState()), false)) channels.push("google_ads");
    if (safe(() => Boolean(this.deps.tiktokAds?.getState()), false)) channels.push("tiktok_ads");
    if (safe(() => Boolean(this.deps.youtubeAds?.getState()), false)) channels.push("youtube_ads");
    if (safe(() => Boolean(this.deps.seoIntelligence?.getState()), false)) channels.push("seo");
    return channels.length > 0 ? channels : [...MARKETING_CHANNELS];
  }

  private audienceHints(): string[] {
    const audiences = safe(
      () => this.deps.audienceIntelligence?.getAudienceRecords() ?? [],
      [],
    );
    return audiences.slice(0, 3).map((a) => a.audienceName);
  }

  private seoHints(): string[] {
    return safe(() => {
      const state = this.deps.seoIntelligence?.getState();
      if (!state) return [];
      return [`seo-health-${state.health.healthScore}`];
    }, []);
  }

  private creativeAssetIds(): string[] {
    return safe(
      () =>
        this.deps.creativeAssetManager
          ?.getAssetRecords()
          .filter((a) => a.approvalStatus === "approved" || a.approvalStatus === "draft")
          .map((a) => a.assetId) ?? [],
      [],
    );
  }

  registerWithFramework(
    config: AiCampaignGeneratorConfiguration,
  ): { frameworkModuleId: string | null; validation: AiCampaignRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: AI_CAMPAIGN_GENERATOR_ID,
        moduleVersion: ACG_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-12",
        authenticationMethod: "none",
        credentialRef: "vault://ai-campaign-generator",
        apiEndpointConfig: {
          baseUrl: "internal://ai-campaign-generator",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "ai_campaign.generated",
            "ai_campaign.strategy",
            "ai_campaign.recommendation",
            "ai_campaign.failed",
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

    appendAcgLog({
      event: "framework_registration",
      level: "info",
      details: `Registered AI Campaign Generator with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `acg-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: ACG_METADATA_VERSION,
      },
    };
  }

  connectAiCampaignGenerator(
    _input: ConnectAiCampaignGeneratorInput,
    config: AiCampaignGeneratorConfiguration,
  ): AiCampaignRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(AI_CAMPAIGN_GENERATOR_ID);
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

    appendAcgLog({
      event: "engine_connect",
      level: "info",
      details: `AI Campaign Generator connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      campaignRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private composeCampaign(
    input: GenerateCampaignInput,
    config: AiCampaignGeneratorConfiguration,
  ): AiCampaignRecord {
    const objective =
      input.objective ?? this.strategy.generateObjective(input.productFocus);
    const strategySummary = this.strategy.generateStrategy(objective, input.productFocus);
    const available = this.availableChannels();
    const channels = this.planning.recommendChannels({
      objective,
      preferred: input.preferredChannels,
      available,
    });
    const durationDays = input.durationDays ?? config.defaultCampaignDays;
    const schedule = this.budgetRec.recommendSchedule(durationDays);
    const budget = this.budgetRec.recommend({
      objective,
      requestedBudget: input.budgetUsd,
      defaultBudgetUsd: config.defaultBudgetUsd,
      channels,
      durationDays: schedule.durationDays,
    });
    const audience = this.audienceRec.recommend({
      objective,
      audienceHints: this.audienceHints(),
      productFocus: input.productFocus,
    });
    const keywords = this.creativeRec.recommendKeywords({
      objective,
      productFocus: input.productFocus,
      seoHints: this.seoHints(),
    });
    const creatives = this.creativeRec.recommendCreatives({
      objective,
      creativeAssetIds: this.creativeAssetIds(),
    });

    return this.planning.build({
      objective,
      strategySummary,
      recommendedChannels: channels,
      recommendedAudience: audience,
      recommendedBudget: budget,
      recommendedSchedule: schedule,
      recommendedKeywords: keywords,
      recommendedCreativeAssets: creatives,
    });
  }

  generateCampaign(
    input: GenerateCampaignInput,
    config: AiCampaignGeneratorConfiguration,
  ): AiCampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateGenerate(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "generate_campaign",
        engineRecord: engine,
        campaignRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.composeCampaign(input, config);
    const recordValidation = this.validator.validateCampaignRecord(record);

    appendAcgLog({
      event: "campaign_generation",
      level: "info",
      details: `Generated AI campaign · objective=${record.campaignObjective} · budget=${record.recommendedBudget}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_campaign",
      engineRecord: engine,
      campaignRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  generateStrategy(
    input: GenerateStrategyInput,
    config: AiCampaignGeneratorConfiguration,
  ): AiCampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateGenerate(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "generate_strategy",
        engineRecord: engine,
        campaignRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
    const record = this.composeCampaign(input, config);
    appendAcgLog({
      event: "strategy_generation",
      level: "info",
      details: `Generated strategy · objective=${record.campaignObjective}`,
    });
    return this.metadataGenerator.buildRunReport({
      action: "generate_strategy",
      engineRecord: engine,
      campaignRecords: [record],
      validation: this.validator.validateCampaignRecord(record),
      durationMs: Date.now() - started,
    });
  }

  generateObjective(
    input: GenerateStrategyInput,
    config: AiCampaignGeneratorConfiguration,
  ): AiCampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const objective =
      input.objective ?? this.strategy.generateObjective(input.productFocus);
    const record = this.composeCampaign({ ...input, objective }, config);
    appendAcgLog({
      event: "strategy_generation",
      level: "info",
      details: `Generated objective=${objective}`,
    });
    return this.metadataGenerator.buildRunReport({
      action: "generate_objective",
      engineRecord: engine,
      campaignRecords: [record],
      validation: this.validator.validateCampaignRecord(record),
      durationMs: Date.now() - started,
    });
  }

  private recommendSlice(
    action: AiCampaignRunReport["action"],
    input: RecommendInput,
    config: AiCampaignGeneratorConfiguration,
  ): AiCampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.recommendationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord: engine,
        campaignRecords: [],
        validation: {
          validationReportId: `acg-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Recommendation rules disabled"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: ACG_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let record: AiCampaignRecord | null = null;
    if (input.aiCampaignId) {
      record = this.planning.get(input.aiCampaignId);
      if (!record) {
        return this.metadataGenerator.buildRunReport({
          action,
          engineRecord: engine,
          campaignRecords: [],
          validation: {
            validationReportId: `acg-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail",
            errors: [`AI campaign not found: ${input.aiCampaignId}`],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: ACG_METADATA_VERSION,
          },
          durationMs: Date.now() - started,
        });
      }
    } else {
      record = this.composeCampaign(
        {
          objective: input.objective,
          productFocus: input.productFocus,
          budgetUsd: input.budgetUsd,
          durationDays: input.durationDays,
        },
        config,
      );
    }

    appendAcgLog({
      event:
        action.includes("audience")
          ? "audience_recommendations"
          : action.includes("budget")
            ? "budget_recommendations"
            : "campaign_generation",
      level: "info",
      details: `${action} · campaign=${record.aiCampaignId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      campaignRecords: [record],
      validation: this.validator.validateCampaignRecord(record),
      durationMs: Date.now() - started,
    });
  }

  recommendChannels(input: RecommendInput, config: AiCampaignGeneratorConfiguration) {
    return this.recommendSlice("recommend_channels", input, config);
  }

  recommendAudience(input: RecommendInput, config: AiCampaignGeneratorConfiguration) {
    return this.recommendSlice("recommend_audience", input, config);
  }

  recommendBudget(input: RecommendInput, config: AiCampaignGeneratorConfiguration) {
    return this.recommendSlice("recommend_budget", input, config);
  }

  recommendSchedule(input: RecommendInput, config: AiCampaignGeneratorConfiguration) {
    return this.recommendSlice("recommend_schedule", input, config);
  }

  recommendKeywords(input: RecommendInput, config: AiCampaignGeneratorConfiguration) {
    return this.recommendSlice("recommend_keywords", input, config);
  }

  recommendCreatives(input: RecommendInput, config: AiCampaignGeneratorConfiguration) {
    return this.recommendSlice("recommend_creatives", input, config);
  }

  generateSummary(
    input: RecommendInput,
    config: AiCampaignGeneratorConfiguration,
  ): AiCampaignRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let record: AiCampaignRecord | null = null;
    if (input.aiCampaignId) {
      record = this.planning.get(input.aiCampaignId);
      if (!record) {
        return this.metadataGenerator.buildRunReport({
          action: "generate_summary",
          engineRecord: engine,
          campaignRecords: [],
          validation: {
            validationReportId: `acg-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail",
            errors: [`AI campaign not found: ${input.aiCampaignId}`],
            warnings: [],
            durationMs: Date.now() - started,
            metadataVersion: ACG_METADATA_VERSION,
          },
          durationMs: Date.now() - started,
        });
      }
    } else {
      record = this.composeCampaign(
        {
          objective: input.objective,
          productFocus: input.productFocus,
          budgetUsd: input.budgetUsd,
          durationDays: input.durationDays,
        },
        config,
      );
    }

    const updated: AiCampaignRecord = {
      ...record,
      campaignSummary: [
        record.strategySummary,
        `Channels: ${record.recommendedChannels.join(", ")}`,
        `Audience: ${record.recommendedAudience}`,
        `Budget: $${record.recommendedBudget}`,
        `Schedule: ${record.recommendedSchedule.startDate} to ${record.recommendedSchedule.endDate}`,
        `Keywords: ${record.recommendedKeywords.slice(0, 5).join(", ")}`,
        "Status: draft plan only — not published",
      ].join(" | "),
      publishReady: false,
    };
    this.planning.persist(updated);

    appendAcgLog({
      event: "campaign_generation",
      level: "info",
      details: `Generated summary · campaign=${updated.aiCampaignId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_summary",
      engineRecord: engine,
      campaignRecords: [updated],
      validation: this.validator.validateCampaignRecord(updated),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.planning.resetForTesting();
  }
}
