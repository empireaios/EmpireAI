/** R5-17 — Marketing Experiment Manager. */

import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { CampaignManagerEngine } from "../campaign-manager/engine.js";
import type { AudienceIntelligenceEngine } from "../audience-intelligence/engine.js";
import type { AttributionEngine } from "../attribution-engine/engine.js";
import type { MarketingAnalyticsDashboard } from "../marketing-analytics-dashboard/engine.js";
import type { AiCampaignGenerator } from "../ai-campaign-generator/engine.js";
import type { BudgetOptimizationEngine } from "../budget-optimization-engine/engine.js";
import type { ConversionIntelligence } from "../conversion-intelligence/engine.js";
import type { ViralTrendIntelligence } from "../viral-trend-intelligence/engine.js";
import {
  MARKETING_EXPERIMENT_ENGINE_ID,
  MEE_METADATA_VERSION,
} from "./paths.js";
import { appendMeeLog } from "./mee-logging.js";
import { AbTestingEngine } from "./ab-testing-engine.js";
import { VariantManagementEngine } from "./variant-management-engine.js";
import { ExperimentAnalyticsEngine } from "./experiment-analytics-engine.js";
import { StatisticalAnalysisEngine } from "./statistical-analysis-engine.js";
import { RecommendationEngine } from "./recommendation-engine.js";
import { ExperimentValidator } from "./experiment-validator.js";
import { ExperimentMetadataGenerator } from "./experiment-metadata-generator.js";
import type { MarketingExperimentEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeExperimentInput,
  ArchiveExperimentInput,
  AssignAudienceInput,
  ConnectMarketingExperimentEngineInput,
  CreateExperimentInput,
  ExperimentEngineRecord,
  ExperimentRecord,
  ExperimentRunReport,
  ExperimentType,
  ManageExperimentInput,
} from "./types.js";

export type MarketingExperimentEngineDependencies = {
  marketingFramework: MarketingFrameworkEngine | null;
  campaignManager: CampaignManagerEngine | null;
  audienceIntelligence: AudienceIntelligenceEngine | null;
  attributionEngine: AttributionEngine | null;
  marketingAnalyticsDashboard: MarketingAnalyticsDashboard | null;
  aiCampaignGenerator: AiCampaignGenerator | null;
  budgetOptimizationEngine: BudgetOptimizationEngine | null;
  conversionIntelligence: ConversionIntelligence | null;
  viralTrendIntelligence: ViralTrendIntelligence | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class MarketingExperimentManager {
  private engineRecord: ExperimentEngineRecord | null = null;
  private readonly abTesting = new AbTestingEngine();
  private readonly variants = new VariantManagementEngine();
  private readonly analytics = new ExperimentAnalyticsEngine();
  private readonly statistics = new StatisticalAnalysisEngine();
  private readonly recommendations = new RecommendationEngine();
  private readonly validator = new ExperimentValidator();
  private readonly metadataGenerator = new ExperimentMetadataGenerator();

  constructor(private readonly deps: MarketingExperimentEngineDependencies) {}

  getEngineRecord(): ExperimentEngineRecord | null {
    return this.engineRecord;
  }

  getExperimentRecords(): ExperimentRecord[] {
    return this.abTesting.list();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): ExperimentEngineRecord["dependencyPresence"] {
    return {
      marketingFramework: this.deps.marketingFramework
        ? this.probe(() => this.deps.marketingFramework!.getState())
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
      viralTrendIntelligence: this.deps.viralTrendIntelligence
        ? this.probe(() => this.deps.viralTrendIntelligence!.getState())
        : false,
    };
  }

  private requireConnected(): ExperimentEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Marketing Experiment Engine not connected — call connectMarketingExperimentEngine first",
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

  private resolveAudienceReference(preferred?: string): string | null {
    if (preferred?.trim()) return preferred.trim();
    const audiences = safe(() => this.deps.audienceIntelligence?.getAudienceRecords() ?? [], []);
    return audiences[0]?.audienceRecordId ?? null;
  }

  private attributedConversions(): number {
    const records = safe(() => this.deps.attributionEngine?.getAttributionRecords() ?? [], []);
    return Math.max(10, records.length * 12);
  }

  private conversionHint(): number {
    return safe(() => {
      const records = this.deps.conversionIntelligence?.getConversionRecords() ?? [];
      if (records.length === 0) return 8;
      return (
        records.reduce((sum, r) => sum + r.conversionRate, 0) / records.length
      );
    }, 8);
  }

  private trendBoost(): number {
    return safe(() => {
      const trends = this.deps.viralTrendIntelligence?.getTrendRecords() ?? [];
      if (trends.length === 0) return 0;
      return Math.min(15, trends.reduce((sum, t) => sum + t.trendScore, 0) / trends.length / 10);
    }, 0);
  }

  registerWithFramework(
    config: MarketingExperimentEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: ExperimentRunReport["validation"] } {
    if (!this.deps.marketingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.marketingFramework.registerMarketingModule({
      definition: {
        marketingModuleIdentifier: MARKETING_EXPERIMENT_ENGINE_ID,
        moduleVersion: MEE_METADATA_VERSION,
        moduleType: "marketing",
        integrationMissionId: "R5-17",
        authenticationMethod: "none",
        credentialRef: "vault://marketing-experiment-engine",
        apiEndpointConfig: {
          baseUrl: "internal://marketing-experiment-engine",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "experiment.created",
            "experiment.significant",
            "experiment.winner",
            "experiment.failed",
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

    appendMeeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Marketing Experiment Engine with Marketing Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `mee-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: MEE_METADATA_VERSION,
      },
    };
  }

  connectMarketingExperimentEngine(
    _input: ConnectMarketingExperimentEngineInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    if (this.deps.marketingFramework && frameworkReg.validation.decision !== "fail") {
      this.deps.marketingFramework.activateMarketingModule(MARKETING_EXPERIMENT_ENGINE_ID);
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

    appendMeeLog({
      event: "engine_connect",
      level: "info",
      details: `Marketing Experiment Engine connected · deps=${Object.values(deps).filter(Boolean).length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      experimentRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createExperiment(
    input: CreateExperimentInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateCreate(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "create_experiment",
        engineRecord: engine,
        experimentRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const experimentType: ExperimentType = input.experimentType ?? "ab_test";
    const variantReferences =
      input.variants && input.variants.length >= 2
        ? input.variants
        : this.variants.defaultVariants(experimentType);
    const impressions = 400 + this.attributedConversions() * 2;
    const conversions = Math.round(impressions * ((this.conversionHint() + this.trendBoost()) / 100));
    const metrics = this.analytics.measure({
      impressions,
      conversions,
      sampleSize: Math.max(config.minimumSampleSize, impressions),
      confidence: 0.8,
    });

    let draft = this.abTesting.create({
      experimentName: (input.experimentName ?? "Marketing Experiment").trim(),
      experimentType,
      campaignReference: this.resolveCampaignReference(input.campaignReference),
      variantReferences,
      audienceReference: this.resolveAudienceReference(input.audienceReference),
      performanceMetrics: metrics,
      experimentStatus: "running",
      recommendationSummary: "Initial experiment created",
    });
    draft.recommendationSummary = this.recommendations.recommend(draft);
    this.abTesting.persist(draft);

    appendMeeLog({
      event: "experiment_creation",
      level: "info",
      details: `Created ${draft.experimentType} experiment ${draft.experimentName}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "create_experiment",
      engineRecord: engine,
      experimentRecords: [draft],
      validation: this.validator.validateExperimentRecord(draft),
      durationMs: Date.now() - started,
    });
  }

  private requireExperiment(experimentId?: string): ExperimentRecord {
    if (experimentId) {
      const found = this.abTesting.get(experimentId);
      if (!found) throw new Error(`Experiment not found: ${experimentId}`);
      return found;
    }
    const all = this.abTesting.list();
    if (all.length === 0) throw new Error("No experiments available");
    return all[all.length - 1]!;
  }

  private ensureExperiment(
    input: ManageExperimentInput | AnalyzeExperimentInput,
    config: MarketingExperimentEngineConfiguration,
    type: ExperimentType = "ab_test",
  ): ExperimentRecord {
    try {
      return this.requireExperiment(input.experimentId);
    } catch {
      const created = this.createExperiment(
        {
          experimentName: type === "multivariate" ? "Multivariate Experiment" : "A/B Experiment",
          experimentType: type,
          variants: "variants" in input ? input.variants : undefined,
        },
        config,
      );
      return created.experimentRecords[0]!;
    }
  }

  manageAbTest(
    input: ManageExperimentInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let record = this.ensureExperiment(input, config, "ab_test");
    record = {
      ...this.variants.ensureVariants({ ...record, experimentType: "ab_test" }, input.variants),
      experimentType: "ab_test",
    };
    record.recommendationSummary = this.recommendations.recommend(record);
    this.abTesting.persist(record);

    appendMeeLog({
      event: "variant_allocation",
      level: "info",
      details: `Managed A/B test ${record.experimentId} · variants=${record.variantReferences.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "manage_ab_test",
      engineRecord: engine,
      experimentRecords: [record],
      validation: this.validator.validateExperimentRecord(record),
      durationMs: Date.now() - started,
    });
  }

  manageMultivariateTest(
    input: ManageExperimentInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let record = this.ensureExperiment(input, config, "multivariate");
    record = {
      ...this.variants.ensureVariants(
        { ...record, experimentType: "multivariate" },
        input.variants ?? this.variants.defaultVariants("multivariate"),
      ),
      experimentType: "multivariate",
    };
    record.recommendationSummary = this.recommendations.recommend(record);
    this.abTesting.persist(record);

    appendMeeLog({
      event: "variant_allocation",
      level: "info",
      details: `Managed multivariate test ${record.experimentId} · variants=${record.variantReferences.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "manage_multivariate_test",
      engineRecord: engine,
      experimentRecords: [record],
      validation: this.validator.validateExperimentRecord(record),
      durationMs: Date.now() - started,
    });
  }

  assignAudience(
    input: AssignAudienceInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.audienceAllocationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "assign_audience",
        engineRecord: engine,
        experimentRecords: [],
        validation: {
          validationReportId: `mee-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Audience allocation rules disabled"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: MEE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    let record = this.ensureExperiment(input, config);
    record = this.variants.assignAudience(
      record,
      this.resolveAudienceReference(input.audienceReference),
      input.splitPercent ?? config.defaultAudienceSplitPercent,
    );
    record.recommendationSummary = this.recommendations.recommend(record);
    this.abTesting.persist(record);

    appendMeeLog({
      event: "variant_allocation",
      level: "info",
      details: `Assigned audience for ${record.experimentId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "assign_audience",
      engineRecord: engine,
      experimentRecords: [record],
      validation: this.validator.validateExperimentRecord(record),
      durationMs: Date.now() - started,
    });
  }

  measurePerformance(
    input: AnalyzeExperimentInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let record = this.ensureExperiment(input, config);
    const impressions = 500 + this.attributedConversions() * 3;
    const conversions = Math.round(
      impressions * ((this.conversionHint() + this.trendBoost()) / 100),
    );
    const metrics = this.analytics.measure({
      impressions,
      conversions,
      sampleSize: Math.max(config.minimumSampleSize, impressions),
      confidence: Math.min(0.99, 0.75 + conversions / impressions),
    });
    record = this.analytics.applyMetrics(record, metrics);
    record.recommendationSummary = this.recommendations.recommend(record);
    this.abTesting.persist(record);

    appendMeeLog({
      event: "performance_measurements",
      level: "info",
      details: `Measured performance for ${record.experimentId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "measure_performance",
      engineRecord: engine,
      experimentRecords: [record],
      validation: this.validator.validateExperimentRecord(record),
      durationMs: Date.now() - started,
    });
  }

  compareVariants(
    input: AnalyzeExperimentInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let record = this.ensureExperiment(input, config);
    record = this.statistics.compareVariants(record);
    record.recommendationSummary = this.recommendations.recommend(record);
    this.abTesting.persist(record);

    return this.metadataGenerator.buildRunReport({
      action: "compare_variants",
      engineRecord: engine,
      experimentRecords: [record],
      validation: this.validator.validateExperimentRecord(record),
      durationMs: Date.now() - started,
    });
  }

  detectSignificance(
    input: AnalyzeExperimentInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let record = this.ensureExperiment(input, config);
    record = this.statistics.detectSignificance(record, config);
    record.recommendationSummary = this.recommendations.recommend(record);
    this.abTesting.persist(record);

    appendMeeLog({
      event: "statistical_analysis",
      level: "info",
      details: `Significance check for ${record.experimentId} · significant=${record.statisticallySignificant}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "detect_significance",
      engineRecord: engine,
      experimentRecords: [record],
      validation: this.validator.validateExperimentRecord(record),
      durationMs: Date.now() - started,
    });
  }

  recommendWinner(
    input: AnalyzeExperimentInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    let record = this.ensureExperiment(input, config);
    record = this.statistics.detectSignificance(record, config);
    record = this.recommendations.recommendForSet([record])[0]!;
    record.deployedToProduction = false;
    this.abTesting.persist(record);

    appendMeeLog({
      event: "statistical_analysis",
      level: "info",
      details: `Recommended winner ${record.winningVariant ?? "none"} · deployedToProduction=false`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "recommend_winner",
      engineRecord: engine,
      experimentRecords: [record],
      validation: this.validator.validateExperimentRecord(record),
      durationMs: Date.now() - started,
    });
  }

  archiveExperiment(
    input: ArchiveExperimentInput,
    config: MarketingExperimentEngineConfiguration,
  ): ExperimentRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateArchive(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "archive_experiment",
        engineRecord: engine,
        experimentRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    let record = this.ensureExperiment(input, config);
    record = {
      ...record,
      experimentStatus: "archived",
      deployedToProduction: false,
      recommendationSummary: this.recommendations.recommend(record),
      timestamp: new Date().toISOString(),
    };
    this.abTesting.persist(record);

    appendMeeLog({
      event: "experiment_creation",
      level: "info",
      details: `Archived experiment ${record.experimentId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "archive_experiment",
      engineRecord: engine,
      experimentRecords: [record],
      validation: this.validator.validateExperimentRecord(record),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.abTesting.resetForTesting();
  }
}
