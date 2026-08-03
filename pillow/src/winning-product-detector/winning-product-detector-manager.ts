/** X3-02 — Winning Product Detector Manager. */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import {
  WINNING_PRODUCT_DETECTOR_ID,
  WPD_CAPABILITIES,
  WPD_METADATA_VERSION,
} from "./paths.js";
import type { WinningProductDetectorConfiguration } from "./configuration.js";
import { appendWpdLog } from "./wpd-logging.js";
import { ProductPerformanceEngine } from "./product-performance-engine.js";
import { SalesVelocityAnalyzer } from "./sales-velocity-analyzer.js";
import { DemandIntelligenceEngine } from "./demand-intelligence-engine.js";
import { ProductTrendAnalyzer } from "./product-trend-analyzer.js";
import { BreakoutDetectionEngine } from "./breakout-detection-engine.js";
import { ProductOpportunityRankingEngine } from "./product-opportunity-ranking-engine.js";
import { ProductRecommendationEngine } from "./product-recommendation-engine.js";
import { ProductMetadataGenerator } from "./product-metadata-generator.js";
import { ProductValidator } from "./product-validator.js";
import type {
  ConnectWinningProductDetectorInput,
  ProductAnalysisInput,
  ProductOpportunityRecord,
  ProductRecommendation,
  ProductValidationReport,
  RunWpdDiagnosticsInput,
  WinningProductDetectorEngineRecord,
  WpdRunReport,
} from "./types.js";

export type WinningProductDetectorDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
};

export class WinningProductDetectorManager {
  private engineRecord: WinningProductDetectorEngineRecord | null = null;
  private productRecords: ProductOpportunityRecord[] = [];
  private recommendations: ProductRecommendation[] = [];

  private readonly performanceEngine = new ProductPerformanceEngine();
  private readonly velocityAnalyzer = new SalesVelocityAnalyzer();
  private readonly demandEngine = new DemandIntelligenceEngine();
  private readonly trendAnalyzer = new ProductTrendAnalyzer();
  private readonly breakoutEngine = new BreakoutDetectionEngine();
  private readonly rankingEngine = new ProductOpportunityRankingEngine();
  private readonly recommendationEngine = new ProductRecommendationEngine();
  private readonly metadataGenerator = new ProductMetadataGenerator();
  private readonly validator = new ProductValidator();

  constructor(private readonly deps: WinningProductDetectorDependencies = {}) {}

  getEngineRecord(): WinningProductDetectorEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getProductRecords(): ProductOpportunityRecord[] {
    return this.productRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): ProductRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  breakoutCount(): number {
    return this.productRecords.filter((r) => r.opportunityClass === "breakout").length;
  }

  decliningCount(): number {
    return this.productRecords.filter((r) => r.opportunityClass === "declining").length;
  }

  averageScalingPotential(): number {
    if (this.productRecords.length === 0) return 0;
    const sum = this.productRecords.reduce((acc, r) => acc + r.scalingPotentialScore, 0);
    return Math.round(sum / this.productRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.productRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): WinningProductDetectorEngineRecord["dependencyPresence"] {
    return {
      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),
    };
  }

  private requireConnected(): WinningProductDetectorEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Winning Product Detector not connected — call connectWinningProductDetector first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: ProductOpportunityRecord): void {
    const idx = this.productRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.productReference === record.productReference,
    );
    if (idx >= 0) this.productRecords[idx] = record;
    else this.productRecords.push(record);
  }

  failReport(
    action: WpdRunReport["action"],
    errors: string[],
    durationMs: number,
  ): WpdRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "wpd-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: WINNING_PRODUCT_DETECTOR_ID,
        engineVersion: "PILLOW-WPD-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...WPD_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: WPD_METADATA_VERSION,
      } satisfies WinningProductDetectorEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `wpd-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: WPD_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: WinningProductDetectorConfiguration): {
    frameworkModuleId: string | null;
    validation: ProductValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: WINNING_PRODUCT_DETECTOR_ID,
        moduleVersion: WPD_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-02",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "product.performance.monitored",
            "product.breakout.detected",
            "product.declining.detected",
            "product.ranked",
            "product.recommended",
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
      this.deps.autonomousScalingFramework.activateScalingModule(WINNING_PRODUCT_DETECTOR_ID);
    }

    appendWpdLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Winning Product Detector with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `wpd-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: WPD_METADATA_VERSION,
      },
    };
  }

  connectWinningProductDetector(
    _input: ConnectWinningProductDetectorInput,
    config: WinningProductDetectorConfiguration,
  ): WpdRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const asfPresent = presence.autonomousScalingFramework;

    this.engineRecord = {
      engineRecordId: `wpd-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WINNING_PRODUCT_DETECTOR_ID,
      engineVersion: "PILLOW-WPD-001",
      currentOperationalState: "connected",
      healthStatus: asfPresent ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...WPD_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: WPD_METADATA_VERSION,
    };

    appendWpdLog({
      event: "engine_connected",
      level: "info",
      details:
        "Winning Product Detector connected — structural product signals only; performance data never manipulated",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural product signals only — product performance data is never manipulated",
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
            : !asfPresent
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  private runAnalysis(
    action: WpdRunReport["action"],
    label: string,
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
    produce: () => ProductOpportunityRecord,
    logEvent: string,
  ): WpdRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateAnalysis(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendWpdLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.productReference} · class=${record.opportunityClass} · potential=${record.scalingPotentialScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        productRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendWpdLog({ event: "detector_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorProductPerformance(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): WpdRunReport {
    return this.runAnalysis(
      "monitor_performance",
      "Product performance monitoring",
      input,
      config,
      () => this.performanceEngine.monitor(input, config),
      "product_monitoring",
    );
  }

  analyzeSalesVelocity(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): WpdRunReport {
    return this.runAnalysis(
      "analyze_sales_velocity",
      "Sales velocity analysis",
      input,
      config,
      () => this.velocityAnalyzer.analyze(input, config),
      "sales_analysis",
    );
  }

  analyzeDemand(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): WpdRunReport {
    return this.runAnalysis(
      "analyze_demand",
      "Demand analysis",
      input,
      config,
      () => this.demandEngine.analyze(input, config),
      "demand_analysis",
    );
  }

  analyzeTrends(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): WpdRunReport {
    if (!config.trendAnalysisEnabled) {
      return this.failReport("analyze_trends", ["Trend analysis disabled"], 0);
    }
    return this.runAnalysis(
      "analyze_trends",
      "Trend analysis",
      input,
      config,
      () => this.trendAnalyzer.analyze(input, config),
      "trend_analysis",
    );
  }

  detectBreakouts(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): WpdRunReport {
    if (!config.breakoutDetectionEnabled) {
      return this.failReport("detect_breakouts", ["Breakout detection disabled"], 0);
    }
    return this.runAnalysis(
      "detect_breakouts",
      "Breakout detection",
      input,
      config,
      () => this.breakoutEngine.detectBreakouts(input, config),
      "breakout_detection",
    );
  }

  detectDeclining(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): WpdRunReport {
    return this.runAnalysis(
      "detect_declining",
      "Declining product detection",
      input,
      config,
      () => this.breakoutEngine.detectDeclining(input, config),
      "declining_detection",
    );
  }

  rankProducts(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): WpdRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (!config.rankingRulesEnabled) {
        return this.failReport("rank_products", ["Ranking rules disabled"], Date.now() - started);
      }
      const validation = this.validator.validateAnalysis("Product ranking", input, config);
      if (validation.decision === "fail") {
        return this.failReport("rank_products", validation.errors, Date.now() - started);
      }

      if (this.productRecords.length === 0) {
        const seed = this.performanceEngine.monitor(input, config);
        this.storeRecord(seed);
      }

      const ranked = this.rankingEngine.rank(this.productRecords);
      this.productRecords = ranked;
      engineRecord.currentOperationalState = "active";

      appendWpdLog({
        event: "ranking",
        level: "info",
        details: `Ranked ${ranked.length} products by scaling potential`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "rank_products",
        engineRecord,
        productRecords: ranked,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendWpdLog({ event: "detector_failure", level: "error", details: message });
      return this.failReport("rank_products", [message], Date.now() - started);
    }
  }

  generateRecommendations(
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): WpdRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateAnalysis(
        "Recommendation generation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "generate_recommendations",
          validation.errors,
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(this.productRecords);
      engineRecord.currentOperationalState = "active";

      appendWpdLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} scaling recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "generate_recommendations",
        engineRecord,
        productRecords: this.productRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendWpdLog({ event: "detector_failure", level: "error", details: message });
      return this.failReport("generate_recommendations", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunWpdDiagnosticsInput,
    config: WinningProductDetectorConfiguration,
  ): WpdRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `wpd-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: WINNING_PRODUCT_DETECTOR_ID,
        engineVersion: "PILLOW-WPD-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...WPD_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: WPD_METADATA_VERSION,
      } satisfies WinningProductDetectorEngineRecord);

    appendWpdLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · products=${this.productRecords.length} · breakouts=${this.breakoutCount()} · declining=${this.decliningCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      productRecords: this.productRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
