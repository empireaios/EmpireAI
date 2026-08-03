/** X3-05 — Marketing Scale Manager. */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";
import type { ScalingDecisionEngine } from "../scaling-decision-engine/engine.js";
import type { CapacityPlanningEngine } from "../capacity-planning-engine/engine.js";
import {
  MARKETING_SCALE_ENGINE_ID,
  MSE_CAPABILITIES,
  MSE_METADATA_VERSION,
} from "./paths.js";
import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import { appendMseLog } from "./mse-logging.js";
import { CampaignPerformanceEngine } from "./campaign-performance-engine.js";
import { CustomerAcquisitionEngine } from "./customer-acquisition-engine.js";
import { MarketingAnalyticsEngine } from "./marketing-analytics-engine.js";
import { MarketingBottleneckAnalyzer } from "./marketing-bottleneck-analyzer.js";
import { MarketingRecommendationEngine } from "./marketing-recommendation-engine.js";
import { MarketingMetadataGenerator } from "./marketing-metadata-generator.js";
import { MarketingValidator } from "./marketing-validator.js";
import {
  buildMarketingScalingRecord,
  computeMarketingSignals,
} from "./structural-signals.js";
import type {
  ConnectMarketingScaleEngineInput,
  MarketingRecommendation,
  MarketingScaleEngineRecord,
  MarketingScaleInput,
  MarketingScalingRecord,
  MarketingValidationReport,
  MseRunReport,
  RunMseDiagnosticsInput,
} from "./types.js";

export type MarketingScaleEngineDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
  winningProductDetector?: WinningProductDetectorEngine | null;
  scalingDecisionEngine?: ScalingDecisionEngine | null;
  capacityPlanningEngine?: CapacityPlanningEngine | null;
};

export class MarketingScaleManager {
  private engineRecord: MarketingScaleEngineRecord | null = null;
  private scalingRecords: MarketingScalingRecord[] = [];
  private recommendations: MarketingRecommendation[] = [];

  private readonly campaignPerformanceEngine = new CampaignPerformanceEngine();
  private readonly customerAcquisitionEngine = new CustomerAcquisitionEngine();
  private readonly marketingAnalyticsEngine = new MarketingAnalyticsEngine();
  private readonly bottleneckAnalyzer = new MarketingBottleneckAnalyzer();
  private readonly recommendationEngine = new MarketingRecommendationEngine();
  private readonly metadataGenerator = new MarketingMetadataGenerator();
  private readonly validator = new MarketingValidator();

  constructor(private readonly deps: MarketingScaleEngineDependencies = {}) {}

  getEngineRecord(): MarketingScaleEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getScalingRecords(): MarketingScalingRecord[] {
    return this.scalingRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): MarketingRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  bottleneckCount(): number {
    return this.scalingRecords.filter((r) =>
      /bottleneck|critical|do not expand|hold/i.test(r.recommendationSummary),
    ).length;
  }

  averageReadiness(): number {
    if (this.scalingRecords.length === 0) return 0;
    const sum = this.scalingRecords.reduce((acc, r) => acc + r.scalingReadinessScore, 0);
    return Math.round(sum / this.scalingRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.scalingRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): MarketingScaleEngineRecord["dependencyPresence"] {
    return {
      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),
      winningProductDetector: Boolean(this.deps.winningProductDetector),
      scalingDecisionEngine: Boolean(this.deps.scalingDecisionEngine),
      capacityPlanningEngine: Boolean(this.deps.capacityPlanningEngine),
    };
  }

  private requireConnected(): MarketingScaleEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Marketing Scale Engine not connected — call connectMarketingScaleEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: MarketingScalingRecord): void {
    const idx = this.scalingRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.campaignReference === record.campaignReference,
    );
    if (idx >= 0) this.scalingRecords[idx] = record;
    else this.scalingRecords.push(record);
  }

  failReport(
    action: MseRunReport["action"],
    errors: string[],
    durationMs: number,
  ): MseRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "mse-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: MARKETING_SCALE_ENGINE_ID,
        engineVersion: "PILLOW-MSE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...MSE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: MSE_METADATA_VERSION,
      } satisfies MarketingScaleEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `mse-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: MSE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: MarketingScaleEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: MarketingValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: MARKETING_SCALE_ENGINE_ID,
        moduleVersion: MSE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-05",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "marketing.monitored",
            "marketing.scalable.detected",
            "marketing.bottleneck.detected",
            "marketing.scaling.recommended",
          ],
          maxEventsPerMinute: 60,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "scaling_module_registration",
          "scaling_lifecycle_management",
          "scaling_event_routing",
          "scaling_data_abstraction",
          "scaling_validation",
          "diagnostics",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.autonomousScalingFramework.activateScalingModule(MARKETING_SCALE_ENGINE_ID);
    }

    appendMseLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Marketing Scale Engine with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `mse-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: MSE_METADATA_VERSION,
      },
    };
  }

  connectMarketingScaleEngine(
    _input: ConnectMarketingScaleEngineInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const corePresent = presence.autonomousScalingFramework;
    const connectedCount = Object.values(presence).filter(Boolean).length;

    this.engineRecord = {
      engineRecordId: `mse-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MARKETING_SCALE_ENGINE_ID,
      engineVersion: "PILLOW-MSE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 4
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...MSE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: MSE_METADATA_VERSION,
    };

    appendMseLog({
      event: "engine_connected",
      level: "info",
      details:
        "Marketing Scale Engine connected — never recommend marketing expansion without validated performance; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never recommend marketing expansion without validated performance",
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      validation: {
        ...framework.validation,
        warnings,
        decision:
          framework.validation.decision === "fail"
            ? "fail"
            : !corePresent
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  private runMonitorOp(
    action: MseRunReport["action"],
    label: string,
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
    produce: () => MarketingScalingRecord,
    logEvent: string,
  ): MseRunReport {
    const started = Date.now();
    try {
      if (!config.monitoringRulesEnabled && action.startsWith("monitor_")) {
        return this.failReport(action, ["Monitoring rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateMarketing(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendMseLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.campaignReference} · readiness=${record.scalingReadinessScore} · cac=${record.customerAcquisitionCost} · roas=${record.returnOnAdvertisingSpend}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        scalingRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendMseLog({ event: "marketing_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorMarketingPerformance(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    return this.runMonitorOp(
      "monitor_performance",
      "Marketing performance monitoring",
      input,
      config,
      () => this.campaignPerformanceEngine.assess(input, config),
      "marketing_monitoring",
    );
  }

  monitorCampaignScalability(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    return this.runMonitorOp(
      "monitor_campaign_scalability",
      "Campaign scalability monitoring",
      input,
      config,
      () => {
        if (!config.campaignEvaluationRulesEnabled) {
          throw new Error("Campaign evaluation rules disabled");
        }
        return this.campaignPerformanceEngine.assess(input, config);
      },
      "marketing_monitoring",
    );
  }

  monitorCustomerAcquisitionCost(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    return this.runMonitorOp(
      "monitor_cac",
      "Customer acquisition cost monitoring",
      input,
      config,
      () => this.customerAcquisitionEngine.assess(input, config),
      "marketing_monitoring",
    );
  }

  monitorReturnOnAdvertisingSpend(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    return this.runMonitorOp(
      "monitor_roas",
      "Return on advertising spend monitoring",
      input,
      config,
      () => this.marketingAnalyticsEngine.assess(input, config),
      "marketing_monitoring",
    );
  }

  monitorConversionPerformance(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    return this.runMonitorOp(
      "monitor_conversion",
      "Conversion performance monitoring",
      input,
      config,
      () => this.marketingAnalyticsEngine.assess(input, config),
      "marketing_monitoring",
    );
  }

  monitorChannelPerformance(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    return this.runMonitorOp(
      "monitor_channel",
      "Channel performance monitoring",
      input,
      config,
      () => {
        const channel = input.channel ?? "paid_search";
        const signals = computeMarketingSignals(channel, input, config);
        return buildMarketingScalingRecord({
          ...signals,
          recommendationSummary: `Channel ${channel} · ${signals.recommendationSummary}`,
          config,
        });
      },
      "marketing_monitoring",
    );
  }

  detectScalableCampaigns(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    const started = Date.now();
    try {
      if (!config.scalingThresholdsEnabled) {
        return this.failReport(
          "detect_scalable_campaigns",
          ["Scaling thresholds disabled"],
          Date.now() - started,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateMarketing(
        "Scalable campaign detection",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "detect_scalable_campaigns",
          validation.errors,
          Date.now() - started,
        );
      }
      if (this.scalingRecords.length === 0) {
        this.storeRecord(this.campaignPerformanceEngine.assess(input, config));
      }
      const scalable = this.scalingRecords.filter(
        (r) =>
          r.scalingReadinessScore >= config.minScalingReadinessScore &&
          r.returnOnAdvertisingSpend >= config.minRoasThreshold &&
          r.customerAcquisitionCost <= config.maxCacThreshold,
      );
      engineRecord.currentOperationalState = "active";
      appendMseLog({
        event: "scalable_campaign_detection",
        level: "info",
        details: `Detected ${scalable.length} scalable campaigns`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_scalable_campaigns",
        engineRecord,
        scalingRecords: scalable.length > 0 ? scalable : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendMseLog({ event: "marketing_failure", level: "error", details: message });
      return this.failReport("detect_scalable_campaigns", [message], Date.now() - started);
    }
  }

  detectMarketingBottlenecks(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateMarketing("Bottleneck detection", input, config);
      if (validation.decision === "fail") {
        return this.failReport("detect_bottlenecks", validation.errors, Date.now() - started);
      }
      if (this.scalingRecords.length === 0) {
        this.storeRecord(this.campaignPerformanceEngine.assess(input, config));
      }
      const bottlenecks = this.bottleneckAnalyzer.detect(this.scalingRecords, config);
      for (const b of bottlenecks) this.storeRecord(b);
      engineRecord.currentOperationalState = "active";
      appendMseLog({
        event: "bottleneck_detection",
        level: "info",
        details: `Detected ${bottlenecks.length} marketing bottlenecks`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_bottlenecks",
        engineRecord,
        scalingRecords: bottlenecks.length > 0 ? bottlenecks : this.scalingRecords,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendMseLog({ event: "marketing_failure", level: "error", details: message });
      return this.failReport("detect_bottlenecks", [message], Date.now() - started);
    }
  }

  recommendMarketingScaling(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled && !config.marketingOptimizationRulesEnabled) {
        return this.failReport("recommend_scaling", ["Recommendation rules disabled"], 0);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateMarketing(
        "Marketing scaling recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport("recommend_scaling", validation.errors, Date.now() - started);
      }
      this.recommendations = this.recommendationEngine.generate(this.scalingRecords, config);
      engineRecord.currentOperationalState = "active";
      appendMseLog({
        event: "marketing_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} marketing scaling recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_scaling",
        engineRecord,
        scalingRecords: this.scalingRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendMseLog({ event: "marketing_failure", level: "error", details: message });
      return this.failReport("recommend_scaling", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunMseDiagnosticsInput,
    config: MarketingScaleEngineConfiguration,
  ): MseRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `mse-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: MARKETING_SCALE_ENGINE_ID,
        engineVersion: "PILLOW-MSE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...MSE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: MSE_METADATA_VERSION,
      } satisfies MarketingScaleEngineRecord);

    appendMseLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.scalingRecords.length} · bottlenecks=${this.bottleneckCount()} · avgReadiness=${this.averageReadiness()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      scalingRecords: this.scalingRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
