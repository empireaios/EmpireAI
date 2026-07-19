/** R5-18 — Cross-Channel Orchestrator Manager. */

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
import type { ConversionIntelligence } from "../conversion-intelligence/engine.js";
import type { CompetitorMarketingMonitor } from "../competitor-marketing-monitor/engine.js";
import type { ViralTrendIntelligence } from "../viral-trend-intelligence/engine.js";
import type { MarketingExperimentEngine } from "../marketing-experiment-engine/engine.js";
import {
  CCO_METADATA_VERSION,
  CROSS_CHANNEL_ORCHESTRATOR_ID,
} from "./paths.js";
import { appendCcoLog } from "./cco-logging.js";
import { CampaignOrchestrationEngine } from "./campaign-orchestration-engine.js";
import { ChannelCoordinationEngine } from "./channel-coordination-engine.js";
import { JourneyCoordinationEngine } from "./journey-coordination-engine.js";
import { CampaignSynchronizationEngine } from "./campaign-synchronization-engine.js";
import { CrossChannelAnalyticsEngine } from "./cross-channel-analytics-engine.js";
import { OrchestrationValidator } from "./orchestration-validator.js";
import { OrchestrationMetadataGenerator } from "./orchestration-metadata-generator.js";
import type { CrossChannelOrchestratorConfiguration } from "./configuration.js";
import type {
  ConnectCrossChannelOrchestratorInput,
  CoordinateCampaignsInput,
  MarketingChannel,
  OrchestrationActionInput,
  OrchestrationEngineRecord,
  OrchestrationRecord,
  OrchestrationRunReport,
} from "./types.js";

export type CrossChannelOrchestratorDependencies = {
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
  conversionIntelligence: ConversionIntelligence | null;
  competitorMarketingMonitor: CompetitorMarketingMonitor | null;
  viralTrendIntelligence: ViralTrendIntelligence | null;
  marketingExperimentEngine: MarketingExperimentEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class CrossChannelOrchestratorManager {
  private engineRecord: OrchestrationEngineRecord | null = null;
  private readonly campaigns = new CampaignOrchestrationEngine();
  private readonly channels = new ChannelCoordinationEngine();
  private readonly journeys = new JourneyCoordinationEngine();
  private readonly synchronization = new CampaignSynchronizationEngine();
  private readonly analytics = new CrossChannelAnalyticsEngine();
  private readonly validator = new OrchestrationValidator();
  private readonly metadataGenerator = new OrchestrationMetadataGenerator();

  constructor(private readonly deps: CrossChannelOrchestratorDependencies) {}

  getEngineRecord(): OrchestrationEngineRecord | null {
    return this.engineRecord;
  }

  getOrchestrationRecords(): OrchestrationRecord[] {
    return this.campaigns.list();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): OrchestrationEngineRecord["dependencyPresence"] {
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
      conversionIntelligence: this.deps.conversionIntelligence
        ? this.probe(() => this.deps.conversionIntelligence!.getState())
        : false,
      competitorMarketingMonitor: this.deps.competitorMarketingMonitor
        ? this.probe(() => this.deps.competitorMarketingMonitor!.getState())
        : false,
      viralTrendIntelligence: this.deps.viralTrendIntelligence
        ? this.probe(() => this.deps.viralTrendIntelligence!.getState())
        : false,
      marketingExperimentEngine: this.deps.marketingExperimentEngine
        ? this.probe(() => this.deps.marketingExperimentEngine!.getState())
        : false,
    };
  }

  private requireConnected(): OrchestrationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Cross-Channel Orchestrator not connected — call connectCrossChannelOrchestrator first",
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
    if (safe(() => Boolean(this.deps.seoIntelligence?.getState()), false)) channels.push("seo");
    return this.channels.defaultChannels(channels);
  }

  registerWithFramework(
    config: CrossChannelOrchestratorConfiguration,
  ): { frameworkModuleId: string | null; validation: OrchestrationRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: CROSS_CHANNEL_ORCHESTRATOR_ID,
        moduleVersion: CCO_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-18",
        authenticationMethod: "none",
        credentialRef: "vault://cross-channel-orchestrator",
        apiEndpointConfig: {
          baseUrl: "internal://cross-channel-orchestrator",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "orchestration.coordinated",
            "orchestration.synchronized",
            "orchestration.conflict",
            "orchestration.failed",
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

    appendCcoLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Cross-Channel Orchestrator with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `cco-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CCO_METADATA_VERSION,
      },
    };
  }

  connectCrossChannelOrchestrator(
    _input: ConnectCrossChannelOrchestratorInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(CROSS_CHANNEL_ORCHESTRATOR_ID);
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

    appendCcoLog({
      event: "engine_connect",
      level: "info",
      details: `Cross-Channel Orchestrator connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      orchestrationRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  coordinateCampaigns(
    input: CoordinateCampaignsInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateCoordinate(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "coordinate_campaigns",
        engineRecord: engine,
        orchestrationRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const marketingChannels =
      input.marketingChannels && input.marketingChannels.length > 0
        ? input.marketingChannels
        : this.availableChannels();
    const schedule =
      input.schedule ??
      `rolling-${new Date().toISOString().slice(0, 10)}`;

    let draft = this.campaigns.create({
      campaignReference: this.resolveCampaignReference(input.campaignReference),
      marketingChannels,
      campaignSchedule: schedule,
      synchronizationStatus: "pending",
      journeyCoordinationStatus: "pending",
      conflictStatus: "none",
      conflictSummary: "No conflicts evaluated yet",
      recommendationSummary: "Initial campaign coordination",
    });
    draft = this.analytics.detectConflicts(draft, config);
    draft.launchedToProduction = false;
    this.campaigns.persist(draft);

    appendCcoLog({
      event: "campaign_coordination",
      level: "info",
      details: `Coordinated campaign across ${draft.marketingChannels.length} channel(s)`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "coordinate_campaigns",
      engineRecord: engine,
      orchestrationRecords: [draft],
      validation: this.validator.validateOrchestrationRecord(draft),
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(orchestrationId?: string): OrchestrationRecord {
    if (orchestrationId) {
      const found = this.campaigns.get(orchestrationId);
      if (!found) throw new Error(`Orchestration not found: ${orchestrationId}`);
      return found;
    }
    const all = this.campaigns.list();
    if (all.length === 0) throw new Error("No orchestration records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: OrchestrationActionInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRecord {
    try {
      return this.requireRecord(input.orchestrationId);
    } catch {
      const created = this.coordinateCampaigns(
        {
          campaignReference: input.campaignReference,
          marketingChannels: input.marketingChannels,
          validated: true,
        },
        config,
      );
      return created.orchestrationRecords[0]!;
    }
  }

  private actionPass(
    action: OrchestrationRunReport["action"],
    transform: (record: OrchestrationRecord) => OrchestrationRecord,
    input: OrchestrationActionInput,
    config: CrossChannelOrchestratorConfiguration,
    event: string,
  ): OrchestrationRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let record = this.ensureRecord(input, config);
    record = transform(record);
    record.launchedToProduction = false;
    this.campaigns.persist(record);

    appendCcoLog({
      event,
      level: "info",
      details: `${action} · orchestration=${record.orchestrationId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      orchestrationRecords: [record],
      validation: this.validator.validateOrchestrationRecord(record),
      durationMs: Date.now() - started,
    });
  }

  synchronizeExecution(
    input: OrchestrationActionInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRunReport {
    if (!config.channelSynchronizationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "synchronize_execution",
        engineRecord: engine,
        orchestrationRecords: [],
        validation: {
          validationReportId: `cco-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Channel synchronization rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: CCO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "synchronize_execution",
      (r) => this.synchronization.synchronizeExecution(r),
      input,
      config,
      "channel_synchronization",
    );
  }

  synchronizeSchedules(
    input: OrchestrationActionInput & { schedule?: string },
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRunReport {
    return this.actionPass(
      "synchronize_schedules",
      (r) => this.synchronization.synchronizeSchedules(r, input.schedule),
      input,
      config,
      "channel_synchronization",
    );
  }

  coordinateJourneys(
    input: OrchestrationActionInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRunReport {
    if (!config.journeyCoordinationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "coordinate_journeys",
        engineRecord: engine,
        orchestrationRecords: [],
        validation: {
          validationReportId: `cco-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Journey coordination rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: CCO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "coordinate_journeys",
      (r) => this.journeys.coordinate(r),
      input,
      config,
      "journey_coordination",
    );
  }

  coordinateChannels(
    input: OrchestrationActionInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRunReport {
    return this.actionPass(
      "coordinate_channels",
      (r) => this.channels.coordinateChannels(r, input.marketingChannels),
      input,
      config,
      "campaign_coordination",
    );
  }

  coordinateBudgets(
    input: OrchestrationActionInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRunReport {
    return this.actionPass(
      "coordinate_budgets",
      (r) => this.channels.coordinateBudgets(r),
      input,
      config,
      "campaign_coordination",
    );
  }

  coordinateAssets(
    input: OrchestrationActionInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRunReport {
    return this.actionPass(
      "coordinate_assets",
      (r) => this.channels.coordinateAssets(r),
      input,
      config,
      "campaign_coordination",
    );
  }

  coordinateExperiments(
    input: OrchestrationActionInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRunReport {
    return this.actionPass(
      "coordinate_experiments",
      (r) => this.channels.coordinateExperiments(r),
      input,
      config,
      "campaign_coordination",
    );
  }

  detectConflicts(
    input: OrchestrationActionInput,
    config: CrossChannelOrchestratorConfiguration,
  ): OrchestrationRunReport {
    return this.actionPass(
      "detect_conflicts",
      (r) => this.analytics.detectConflicts(r, config),
      input,
      config,
      "conflict_detection",
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.campaigns.resetForTesting();
  }
}
