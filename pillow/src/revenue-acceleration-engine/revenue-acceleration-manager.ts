/** X3-16 — Revenue Acceleration Engine Manager. */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";
import type { ScalingDecisionEngine } from "../scaling-decision-engine/engine.js";
import type { CapacityPlanningEngine } from "../capacity-planning-engine/engine.js";
import type { MarketingScaleEngine } from "../marketing-scale-engine/engine.js";
import type { SupplierScaleEngine } from "../supplier-scale-engine/engine.js";
import type { FinancialScaleEngine } from "../financial-scale-engine/engine.js";
import type { WorkforceIntelligenceEngine } from "../workforce-intelligence/engine.js";
import type { ExecutiveScalingDashboardEngine } from "../executive-scaling-dashboard/engine.js";
import type { BottleneckIntelligenceEngine } from "../bottleneck-intelligence/engine.js";
import type { OperationalElasticityEngine } from "../operational-elasticity-engine/engine.js";
import type { PerformancePreservationEngine } from "../performance-preservation-engine/engine.js";
import type { ScalingRiskMonitorEngine } from "../scaling-risk-monitor/engine.js";
import type { GlobalScalingPlannerEngine } from "../global-scaling-planner/engine.js";
import type { AutonomousGrowthOptimizerEngine } from "../autonomous-growth-optimizer/engine.js";
import {
  REVENUE_ACCELERATION_ENGINE_ID,
  RAE_CAPABILITIES,
  RAE_METADATA_VERSION,
} from "./paths.js";
import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";
import { appendRaeLog } from "./rae-logging.js";
import { RevenueAnalysisEngine } from "./revenue-analysis-engine.js";
import { RevenueOpportunityEngine } from "./revenue-opportunity-engine.js";
import { RevenueBottleneckAnalyzer } from "./revenue-bottleneck-analyzer.js";
import { RevenueStrategyOptimizer } from "./revenue-strategy-optimizer.js";
import { RevenueRecommendationEngine } from "./revenue-recommendation-engine.js";
import { RevenueMetadataGenerator } from "./revenue-metadata-generator.js";
import { RevenueValidator } from "./revenue-validator.js";
import type {
  RevenueAccelerationRecommendation,
  RevenueAccelerationEngineRecord,
  RevenueAccelerationInput,
  RevenueAccelerationRecord,
  RevenueValidationReport,
  RaeRunReport,
  ConnectRevenueAccelerationEngineInput,
  RunRaeDiagnosticsInput,
} from "./types.js";

export type RevenueAccelerationEngineDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
  winningProductDetector?: WinningProductDetectorEngine | null;
  scalingDecisionEngine?: ScalingDecisionEngine | null;
  capacityPlanningEngine?: CapacityPlanningEngine | null;
  marketingScaleEngine?: MarketingScaleEngine | null;
  supplierScaleEngine?: SupplierScaleEngine | null;
  financialScaleEngine?: FinancialScaleEngine | null;
  workforceIntelligence?: WorkforceIntelligenceEngine | null;
  executiveScalingDashboard?: ExecutiveScalingDashboardEngine | null;
  bottleneckIntelligence?: BottleneckIntelligenceEngine | null;
  operationalElasticityEngine?: OperationalElasticityEngine | null;
  performancePreservationEngine?: PerformancePreservationEngine | null;
  scalingRiskMonitor?: ScalingRiskMonitorEngine | null;
  globalScalingPlanner?: GlobalScalingPlannerEngine | null;
  autonomousGrowthOptimizer?: AutonomousGrowthOptimizerEngine | null;
};

export class RevenueAccelerationManager {
  private engineRecord: RevenueAccelerationEngineRecord | null = null;
  private revenueAccelerationRecords: RevenueAccelerationRecord[] = [];
  private recommendations: RevenueAccelerationRecommendation[] = [];

  private readonly analysisEngine = new RevenueAnalysisEngine();
  private readonly opportunityEngine = new RevenueOpportunityEngine();
  private readonly bottleneckAnalyzer = new RevenueBottleneckAnalyzer();
  private readonly strategyOptimizer = new RevenueStrategyOptimizer();
  private readonly recommendationEngine = new RevenueRecommendationEngine();
  private readonly metadataGenerator = new RevenueMetadataGenerator();
  private readonly validator = new RevenueValidator();

  constructor(private readonly deps: RevenueAccelerationEngineDependencies = {}) {}

  getEngineRecord(): RevenueAccelerationEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getRevenueAccelerationRecords(): RevenueAccelerationRecord[] {
    return this.revenueAccelerationRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): RevenueAccelerationRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  highOpportunityCount(config?: RevenueAccelerationEngineConfiguration): number {
    const threshold = config?.highOpportunityThreshold ?? 70;
    return this.revenueAccelerationRecords.filter(
      (r) => r.revenueOpportunityScore >= threshold,
    ).length;
  }

  averageOpportunityScore(): number {
    if (this.revenueAccelerationRecords.length === 0) return 0;
    const sum = this.revenueAccelerationRecords.reduce(
      (acc, r) => acc + r.revenueOpportunityScore,
      0,
    );
    return Math.round(sum / this.revenueAccelerationRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.revenueAccelerationRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): RevenueAccelerationEngineRecord["dependencyPresence"] {
    return {
      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),
      winningProductDetector: Boolean(this.deps.winningProductDetector),
      scalingDecisionEngine: Boolean(this.deps.scalingDecisionEngine),
      capacityPlanningEngine: Boolean(this.deps.capacityPlanningEngine),
      marketingScaleEngine: Boolean(this.deps.marketingScaleEngine),
      supplierScaleEngine: Boolean(this.deps.supplierScaleEngine),
      financialScaleEngine: Boolean(this.deps.financialScaleEngine),
      workforceIntelligence: Boolean(this.deps.workforceIntelligence),
      executiveScalingDashboard: Boolean(this.deps.executiveScalingDashboard),
      bottleneckIntelligence: Boolean(this.deps.bottleneckIntelligence),
      operationalElasticityEngine: Boolean(this.deps.operationalElasticityEngine),
      performancePreservationEngine: Boolean(this.deps.performancePreservationEngine),
      scalingRiskMonitor: Boolean(this.deps.scalingRiskMonitor),
      globalScalingPlanner: Boolean(this.deps.globalScalingPlanner),
      autonomousGrowthOptimizer: Boolean(this.deps.autonomousGrowthOptimizer),
    };
  }

  private sourceAvailableFor(
    kind:
      | "revenue_growth_monitoring"
      | "revenue_trend_monitoring"
      | "product_revenue_monitoring"
      | "channel_revenue_monitoring"
      | "customer_revenue_monitoring"
      | "revenue_acceleration_opportunities"
      | "revenue_bottleneck_identification"
      | "revenue_strategy_optimization",
  ): boolean {
    const p = this.dependencyPresence();
    switch (kind) {
      case "revenue_growth_monitoring":
        return (
          p.financialScaleEngine ||
          p.autonomousGrowthOptimizer ||
          p.executiveScalingDashboard ||
          p.autonomousScalingFramework
        );
      case "revenue_trend_monitoring":
        return (
          p.financialScaleEngine ||
          p.globalScalingPlanner ||
          p.autonomousGrowthOptimizer ||
          p.autonomousScalingFramework
        );
      case "product_revenue_monitoring":
        return (
          p.winningProductDetector ||
          p.marketingScaleEngine ||
          p.autonomousGrowthOptimizer ||
          p.autonomousScalingFramework
        );
      case "channel_revenue_monitoring":
        return (
          p.marketingScaleEngine ||
          p.autonomousGrowthOptimizer ||
          p.autonomousScalingFramework
        );
      case "customer_revenue_monitoring":
        return (
          p.marketingScaleEngine ||
          p.winningProductDetector ||
          p.autonomousGrowthOptimizer ||
          p.autonomousScalingFramework
        );
      case "revenue_acceleration_opportunities":
        return (
          p.autonomousGrowthOptimizer ||
          p.winningProductDetector ||
          p.scalingDecisionEngine ||
          p.autonomousScalingFramework
        );
      case "revenue_bottleneck_identification":
        return (
          p.bottleneckIntelligence ||
          p.scalingRiskMonitor ||
          p.performancePreservationEngine ||
          p.autonomousScalingFramework
        );
      case "revenue_strategy_optimization":
        return (
          p.autonomousGrowthOptimizer ||
          p.scalingDecisionEngine ||
          p.executiveScalingDashboard ||
          p.autonomousScalingFramework
        );
      default:
        return true;
    }
  }

  private requireConnected(): RevenueAccelerationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Revenue Acceleration Engine not connected — call connectRevenueAccelerationEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: RevenueAccelerationRecord): void {
    const idx = this.revenueAccelerationRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.revenueCategory === record.revenueCategory,
    );
    if (idx >= 0) this.revenueAccelerationRecords[idx] = record;
    else this.revenueAccelerationRecords.push(record);
  }

  failReport(
    action: RaeRunReport["action"],
    errors: string[],
    durationMs: number,
  ): RaeRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "rae-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: REVENUE_ACCELERATION_ENGINE_ID,
        engineVersion: "PILLOW-RAE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...RAE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: RAE_METADATA_VERSION,
      } satisfies RevenueAccelerationEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `rae-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: RAE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: RevenueAccelerationEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: RevenueValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: REVENUE_ACCELERATION_ENGINE_ID,
        moduleVersion: RAE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-16",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "revenue_acceleration.growth",
            "revenue_acceleration.trend",
            "revenue_acceleration.opportunity",
            "revenue_acceleration.ranked",
            "revenue_acceleration.recommendation",
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
      this.deps.autonomousScalingFramework.activateScalingModule(
        REVENUE_ACCELERATION_ENGINE_ID,
      );
    }

    appendRaeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Revenue Acceleration Engine with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `rae-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: RAE_METADATA_VERSION,
      },
    };
  }

  connectRevenueAccelerationEngine(
    _input: ConnectRevenueAccelerationEngineInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
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
      engineRecordId: `rae-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: REVENUE_ACCELERATION_ENGINE_ID,
      engineVersion: "PILLOW-RAE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 15
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...RAE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: RAE_METADATA_VERSION,
    };

    appendRaeLog({
      event: "engine_connected",
      level: "info",
      details:
        "Revenue Acceleration Engine connected — never recommend revenue actions without validated supporting data; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never recommend revenue actions without validated supporting data",
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

  private runAccelerationOp(
    action: RaeRunReport["action"],
    label: string,
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
    logEvent: string,
    produce: () => RevenueAccelerationRecord,
  ): RaeRunReport {
    const started = Date.now();
    try {
      if (!config.accelerationRulesEnabled) {
        return this.failReport(action, ["Acceleration rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRevenueAcceleration(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendRaeLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.revenueCategory} · opportunity=${record.revenueOpportunityScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        revenueAccelerationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendRaeLog({ event: "revenue_acceleration_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorRevenueGrowth(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    return this.runAccelerationOp(
      "monitor_revenue_growth",
      "Revenue growth monitoring",
      input,
      config,
      "revenue_acceleration_evaluation",
      () =>
        this.analysisEngine.monitorGrowth(
          input,
          config,
          this.sourceAvailableFor("revenue_growth_monitoring"),
        ),
    );
  }

  monitorRevenueTrends(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    return this.runAccelerationOp(
      "monitor_revenue_trends",
      "Revenue trend monitoring",
      input,
      config,
      "revenue_acceleration_evaluation",
      () =>
        this.analysisEngine.monitorTrends(
          input,
          config,
          this.sourceAvailableFor("revenue_trend_monitoring"),
        ),
    );
  }

  monitorProductRevenue(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    return this.runAccelerationOp(
      "monitor_product_revenue",
      "Product revenue monitoring",
      input,
      config,
      "revenue_acceleration_evaluation",
      () =>
        this.analysisEngine.monitorProduct(
          input,
          config,
          this.sourceAvailableFor("product_revenue_monitoring"),
        ),
    );
  }

  monitorChannelRevenue(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    return this.runAccelerationOp(
      "monitor_channel_revenue",
      "Channel revenue monitoring",
      input,
      config,
      "revenue_acceleration_evaluation",
      () =>
        this.analysisEngine.monitorChannel(
          input,
          config,
          this.sourceAvailableFor("channel_revenue_monitoring"),
        ),
    );
  }

  monitorCustomerRevenue(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    return this.runAccelerationOp(
      "monitor_customer_revenue",
      "Customer revenue monitoring",
      input,
      config,
      "revenue_acceleration_evaluation",
      () =>
        this.analysisEngine.monitorCustomer(
          input,
          config,
          this.sourceAvailableFor("customer_revenue_monitoring"),
        ),
    );
  }

  identifyRevenueAccelerationOpportunities(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    return this.runAccelerationOp(
      "identify_revenue_acceleration_opportunities",
      "Revenue acceleration opportunity identification",
      input,
      config,
      "revenue_acceleration_evaluation",
      () =>
        this.opportunityEngine.identify(
          input,
          config,
          this.sourceAvailableFor("revenue_acceleration_opportunities"),
        ),
    );
  }

  identifyRevenueBottlenecks(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    return this.runAccelerationOp(
      "identify_revenue_bottlenecks",
      "Revenue bottleneck identification",
      input,
      config,
      "revenue_acceleration_evaluation",
      () =>
        this.bottleneckAnalyzer.identify(
          input,
          config,
          this.sourceAvailableFor("revenue_bottleneck_identification"),
        ),
    );
  }

  optimizeRevenueStrategies(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    return this.runAccelerationOp(
      "optimize_revenue_strategies",
      "Revenue strategy optimization",
      input,
      config,
      "revenue_acceleration_evaluation",
      () =>
        this.strategyOptimizer.optimize(
          input,
          config,
          this.sourceAvailableFor("revenue_strategy_optimization"),
        ),
    );
  }

  rankRevenueOpportunities(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRevenueAcceleration(
        "Revenue opportunity ranking",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "rank_revenue_opportunities",
          validation.errors,
          Date.now() - started,
        );
      }
      const ranked = this.strategyOptimizer.rank(this.revenueAccelerationRecords, config);
      this.revenueAccelerationRecords = ranked;
      engineRecord.currentOperationalState = "active";
      appendRaeLog({
        event: "revenue_acceleration_ranking",
        level: "info",
        details: `Ranked ${ranked.length} revenue opportunities — never recommend without validated supporting data`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "rank_revenue_opportunities",
        engineRecord,
        revenueAccelerationRecords: ranked,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendRaeLog({ event: "revenue_acceleration_failure", level: "error", details: message });
      return this.failReport("rank_revenue_opportunities", [message], Date.now() - started);
    }
  }

  recommendRevenueAcceleration(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled) {
        return this.failReport(
          "recommend_revenue_acceleration",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRevenueAcceleration(
        "Revenue acceleration recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "recommend_revenue_acceleration",
          validation.errors,
          Date.now() - started,
        );
      }
      this.recommendations = this.recommendationEngine.generate(
        this.revenueAccelerationRecords,
        config,
      );
      engineRecord.currentOperationalState = "active";
      appendRaeLog({
        event: "revenue_acceleration_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} revenue acceleration recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_revenue_acceleration",
        engineRecord,
        revenueAccelerationRecords: this.revenueAccelerationRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendRaeLog({ event: "revenue_acceleration_failure", level: "error", details: message });
      return this.failReport("recommend_revenue_acceleration", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunRaeDiagnosticsInput,
    config: RevenueAccelerationEngineConfiguration,
  ): RaeRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `rae-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: REVENUE_ACCELERATION_ENGINE_ID,
        engineVersion: "PILLOW-RAE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...RAE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: RAE_METADATA_VERSION,
      } satisfies RevenueAccelerationEngineRecord);

    appendRaeLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.revenueAccelerationRecords.length} · highOpportunity=${this.highOpportunityCount(config)} · avgOpportunity=${this.averageOpportunityScore()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      revenueAccelerationRecords: this.revenueAccelerationRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
