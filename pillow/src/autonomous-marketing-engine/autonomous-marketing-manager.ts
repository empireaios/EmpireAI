/** R5-19 — Autonomous Marketing Manager. */

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
import type { AiCampaignGenerator } from "../ai-campaign-generator/engine.js";
import type { BudgetOptimizationEngine } from "../budget-optimization-engine/engine.js";
import type { ConversionIntelligence } from "../conversion-intelligence/engine.js";
import type { CompetitorMarketingMonitor } from "../competitor-marketing-monitor/engine.js";
import type { ViralTrendIntelligence } from "../viral-trend-intelligence/engine.js";
import type { MarketingExperimentEngine } from "../marketing-experiment-engine/engine.js";
import type { CrossChannelOrchestrator } from "../cross-channel-orchestrator/engine.js";
import {
  AME_METADATA_VERSION,
  AUTONOMOUS_MARKETING_ENGINE_ID,
} from "./paths.js";
import { appendAmeLog } from "./ame-logging.js";
import { CampaignOptimizationEngine } from "./campaign-optimization-engine.js";
import { BudgetOptimizationCoordinator } from "./budget-optimization-coordinator.js";
import { AudienceOptimizationEngine } from "./audience-optimization-engine.js";
import { CreativeOptimizationEngine } from "./creative-optimization-engine.js";
import { DecisionExecutionEngine } from "./decision-execution-engine.js";
import { AutonomousMarketingValidator } from "./autonomous-marketing-validator.js";
import { AutonomousMarketingMetadataGenerator } from "./autonomous-marketing-metadata-generator.js";
import type { AutonomousMarketingEngineConfiguration } from "./configuration.js";
import type {
  AutonomousMarketingActionInput,
  AutonomousMarketingEngineRecord,
  AutonomousMarketingRecord,
  AutonomousMarketingRunReport,
  ConnectAutonomousMarketingEngineInput,
  MonitorPerformanceInput,
} from "./types.js";

export type AutonomousMarketingEngineDependencies = {
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
  aiCampaignGenerator: AiCampaignGenerator | null;
  budgetOptimizationEngine: BudgetOptimizationEngine | null;
  conversionIntelligence: ConversionIntelligence | null;
  competitorMarketingMonitor: CompetitorMarketingMonitor | null;
  viralTrendIntelligence: ViralTrendIntelligence | null;
  marketingExperimentEngine: MarketingExperimentEngine | null;
  crossChannelOrchestrator: CrossChannelOrchestrator | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class AutonomousMarketingManager {
  private engineRecord: AutonomousMarketingEngineRecord | null = null;
  private readonly campaigns = new CampaignOptimizationEngine();
  private readonly budgets = new BudgetOptimizationCoordinator();
  private readonly audiences = new AudienceOptimizationEngine();
  private readonly creatives = new CreativeOptimizationEngine();
  private readonly decisions = new DecisionExecutionEngine();
  private readonly validator = new AutonomousMarketingValidator();
  private readonly metadataGenerator = new AutonomousMarketingMetadataGenerator();

  constructor(private readonly deps: AutonomousMarketingEngineDependencies) {}

  getEngineRecord(): AutonomousMarketingEngineRecord | null {
    return this.engineRecord;
  }

  getAutonomousMarketingRecords(): AutonomousMarketingRecord[] {
    return this.campaigns.list();
  }

  getPendingApprovals(): number {
    return this.campaigns.pendingApprovals();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): AutonomousMarketingEngineRecord["dependencyPresence"] {
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
      crossChannelOrchestrator: this.deps.crossChannelOrchestrator
        ? this.probe(() => this.deps.crossChannelOrchestrator!.getState())
        : false,
    };
  }

  private requireConnected(): AutonomousMarketingEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Autonomous Marketing Engine not connected — call connectAutonomousMarketingEngine first",
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

  private estimateConfidence(config: AutonomousMarketingEngineConfiguration): number {
    const deps = this.dependencyPresence();
    const connected = Object.values(deps).filter(Boolean).length;
    const total = Object.keys(deps).length;
    const base = Math.round((connected / total) * 100);
    const hasDashboard = deps.marketingAnalyticsDashboard;
    const hasBudget = deps.budgetOptimizationEngine;
    const bonus = (hasDashboard ? 5 : 0) + (hasBudget ? 5 : 0);
    return Math.max(config.minConfidenceScore, Math.min(100, base + bonus));
  }

  private estimateDeclinePercent(): number {
    const dashboardReady = safe(
      () => Boolean(this.deps.marketingAnalyticsDashboard?.getState()),
      false,
    );
    const conversionReady = safe(
      () => Boolean(this.deps.conversionIntelligence?.getState()),
      false,
    );
    if (!dashboardReady && !conversionReady) return 0;
    if (!conversionReady) return 12;
    return 18;
  }

  registerWithFramework(
    config: AutonomousMarketingEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: AutonomousMarketingRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: AUTONOMOUS_MARKETING_ENGINE_ID,
        moduleVersion: AME_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-19",
        authenticationMethod: "none",
        credentialRef: "vault://autonomous-marketing-engine",
        apiEndpointConfig: {
          baseUrl: "internal://autonomous-marketing-engine",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "autonomous.recommendation",
            "autonomous.optimization",
            "autonomous.execution",
            "autonomous.failed",
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

    appendAmeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Autonomous Marketing Engine with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `ame-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: AME_METADATA_VERSION,
      },
    };
  }

  connectAutonomousMarketingEngine(
    _input: ConnectAutonomousMarketingEngineInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(AUTONOMOUS_MARKETING_ENGINE_ID);
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

    appendAmeLog({
      event: "engine_connect",
      level: "info",
      details: `Autonomous Marketing Engine connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      autonomousMarketingRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  monitorPerformance(
    input: MonitorPerformanceInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateMonitor(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "monitor_performance",
        engineRecord: engine,
        autonomousMarketingRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const confidence = this.estimateConfidence(config);
    const decline = this.estimateDeclinePercent();
    const record = this.campaigns.create({
      campaignReference: this.resolveCampaignReference(input.campaignReference),
      optimizationCategory: "general",
      triggerEvent: decline >= config.performanceDeclineThreshold
        ? `performance_watch_${decline}pct`
        : "performance_monitor_cycle",
      recommendedAction:
        "Continue structural monitoring of campaign KPIs across connected marketing systems",
      executionStatus: "pending",
      confidenceScore: confidence,
    });
    record.validationStatus = "passed";
    record.highImpactExecuted = false;
    this.campaigns.persist(record);

    appendAmeLog({
      event: "optimization_decisions",
      level: "info",
      details: `Monitored campaign performance · confidence=${confidence}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "monitor_performance",
      engineRecord: engine,
      autonomousMarketingRecords: [record],
      validation: this.validator.validateAutonomousRecord(record),
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(autonomousMarketingId?: string): AutonomousMarketingRecord {
    if (autonomousMarketingId) {
      const found = this.campaigns.get(autonomousMarketingId);
      if (!found) throw new Error(`Autonomous marketing record not found: ${autonomousMarketingId}`);
      return found;
    }
    const all = this.campaigns.list();
    if (all.length === 0) throw new Error("No autonomous marketing records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRecord {
    try {
      return this.requireRecord(input.autonomousMarketingId);
    } catch {
      const created = this.monitorPerformance(
        {
          campaignReference: input.campaignReference,
          validated: true,
        },
        config,
      );
      return created.autonomousMarketingRecords[0]!;
    }
  }

  generateRecommendations(
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.optimizationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "generate_recommendations",
        engineRecord: engine,
        autonomousMarketingRecords: [],
        validation: {
          validationReportId: `ame-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Optimization rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: AME_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    let record = this.ensureRecord(input, config);
    const confidence = this.estimateConfidence(config);
    record = {
      ...record,
      recommendedAction:
        "Generate multi-lever optimization plan across budget, audience, creative, and channels",
      executionStatus: "recommended",
      confidenceScore: confidence,
      highImpactExecuted: false,
      timestamp: new Date().toISOString(),
    };
    this.campaigns.persist(record);

    appendAmeLog({
      event: "optimization_decisions",
      level: "info",
      details: `Generated optimization recommendations · id=${record.autonomousMarketingId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_recommendations",
      engineRecord: engine,
      autonomousMarketingRecords: [record],
      validation: this.validator.validateAutonomousRecord(record),
      durationMs: Date.now() - started,
    });
  }

  private optimizePass(
    action: AutonomousMarketingRunReport["action"],
    transform: (record: AutonomousMarketingRecord, confidence: number) => AutonomousMarketingRecord,
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
    event: string,
  ): AutonomousMarketingRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.optimizationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord: engine,
        autonomousMarketingRecords: [],
        validation: {
          validationReportId: `ame-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Optimization rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: AME_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    let record = this.ensureRecord(input, config);
    const confidence = this.estimateConfidence(config);
    if (config.decisionThresholdsEnabled && confidence < config.minConfidenceScore) {
      record = {
        ...record,
        executionStatus: "blocked",
        recommendedAction: "Confidence below decision threshold — recommendation withheld",
        highImpactExecuted: false,
        timestamp: new Date().toISOString(),
      };
      this.campaigns.persist(record);
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord: engine,
        autonomousMarketingRecords: [record],
        validation: this.validator.validateAutonomousRecord(record),
        durationMs: Date.now() - started,
      });
    }

    record = transform(record, confidence);
    record.highImpactExecuted = false;
    this.campaigns.persist(record);

    appendAmeLog({
      event,
      level: "info",
      details: `${action} · id=${record.autonomousMarketingId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      autonomousMarketingRecords: [record],
      validation: this.validator.validateAutonomousRecord(record),
      durationMs: Date.now() - started,
    });
  }

  optimizeBudgets(
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRunReport {
    return this.optimizePass(
      "optimize_budgets",
      (r, c) => this.budgets.optimize(r, c),
      input,
      config,
      "budget_adjustments",
    );
  }

  optimizeAudience(
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRunReport {
    return this.optimizePass(
      "optimize_audience",
      (r, c) => this.audiences.optimize(r, c),
      input,
      config,
      "audience_adjustments",
    );
  }

  optimizeScheduling(
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRunReport {
    return this.optimizePass(
      "optimize_scheduling",
      (r, c) => this.creatives.optimizeScheduling(r, c),
      input,
      config,
      "optimization_decisions",
    );
  }

  optimizeCreative(
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRunReport {
    return this.optimizePass(
      "optimize_creative",
      (r, c) => this.creatives.optimize(r, c),
      input,
      config,
      "optimization_decisions",
    );
  }

  optimizeChannelAllocation(
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRunReport {
    return this.optimizePass(
      "optimize_channel_allocation",
      (r, c) => this.creatives.optimizeChannelAllocation(r, c),
      input,
      config,
      "optimization_decisions",
    );
  }

  respondToPerformanceChanges(
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let record = this.ensureRecord(input, config);
    const decline = this.estimateDeclinePercent();
    record = this.decisions.respondToPerformanceChange(
      record,
      decline,
      config.performanceDeclineThreshold,
    );
    record.confidenceScore = this.estimateConfidence(config);
    record.highImpactExecuted = false;
    this.campaigns.persist(record);

    appendAmeLog({
      event: "optimization_decisions",
      level: "info",
      details: `Responded to performance changes · decline=${decline}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "respond_to_performance_changes",
      engineRecord: engine,
      autonomousMarketingRecords: [record],
      validation: this.validator.validateAutonomousRecord(record),
      durationMs: Date.now() - started,
    });
  }

  executeApprovedOptimizations(
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateExecute(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "execute_approved_optimizations",
        engineRecord: engine,
        autonomousMarketingRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    let record = this.ensureRecord(input, config);
    record = {
      ...record,
      approvalGranted: true,
      highImpactExecuted: false,
    };
    record = this.decisions.executeApproved(record);
    record.highImpactExecuted = false;
    this.campaigns.persist(record);

    appendAmeLog({
      event: "optimization_execution",
      level: "info",
      details: `Executed approved structural optimization · id=${record.autonomousMarketingId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "execute_approved_optimizations",
      engineRecord: engine,
      autonomousMarketingRecords: [record],
      validation: this.validator.validateAutonomousRecord(record),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.campaigns.resetForTesting();
  }
}
