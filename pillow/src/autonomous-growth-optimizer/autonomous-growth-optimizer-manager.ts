/** X3-15 — Autonomous Growth Optimizer Manager. */

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
import {
  AUTONOMOUS_GROWTH_OPTIMIZER_ID,
  AGO_CAPABILITIES,
  AGO_METADATA_VERSION,
} from "./paths.js";
import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";
import { appendAgoLog } from "./ago-logging.js";
import { EnterpriseGrowthEngine } from "./enterprise-growth-engine.js";
import { GrowthOpportunityEngine } from "./growth-opportunity-engine.js";
import { GrowthConstraintAnalyzer } from "./growth-constraint-analyzer.js";
import { GrowthStrategyOptimizer } from "./growth-strategy-optimizer.js";
import { GrowthRecommendationEngine } from "./growth-recommendation-engine.js";
import { GrowthMetadataGenerator } from "./growth-metadata-generator.js";
import { GrowthValidator } from "./growth-validator.js";
import type {
  AutonomousGrowthRecommendation,
  AutonomousGrowthOptimizerRecord,
  GrowthOptimizationInput,
  GrowthOptimizationRecord,
  GrowthValidationReport,
  AgoRunReport,
  ConnectAutonomousGrowthOptimizerInput,
  RunAgoDiagnosticsInput,
} from "./types.js";

export type AutonomousGrowthOptimizerDependencies = {
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
};

export class AutonomousGrowthOptimizerManager {
  private engineRecord: AutonomousGrowthOptimizerRecord | null = null;
  private growthOptimizationRecords: GrowthOptimizationRecord[] = [];
  private recommendations: AutonomousGrowthRecommendation[] = [];

  private readonly enterpriseGrowthEngine = new EnterpriseGrowthEngine();
  private readonly opportunityEngine = new GrowthOpportunityEngine();
  private readonly constraintAnalyzer = new GrowthConstraintAnalyzer();
  private readonly strategyOptimizer = new GrowthStrategyOptimizer();
  private readonly recommendationEngine = new GrowthRecommendationEngine();
  private readonly metadataGenerator = new GrowthMetadataGenerator();
  private readonly validator = new GrowthValidator();

  constructor(private readonly deps: AutonomousGrowthOptimizerDependencies = {}) {}

  getEngineRecord(): AutonomousGrowthOptimizerRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getGrowthOptimizationRecords(): GrowthOptimizationRecord[] {
    return this.growthOptimizationRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): AutonomousGrowthRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  highPriorityCount(): number {
    return this.growthOptimizationRecords.filter(
      (r) => r.optimizationPriority === "critical" || r.optimizationPriority === "high",
    ).length;
  }

  averageOpportunityScore(): number {
    if (this.growthOptimizationRecords.length === 0) return 0;
    const sum = this.growthOptimizationRecords.reduce(
      (acc, r) => acc + r.growthOpportunityScore,
      0,
    );
    return Math.round(sum / this.growthOptimizationRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.growthOptimizationRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): AutonomousGrowthOptimizerRecord["dependencyPresence"] {
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
    };
  }

  private sourceAvailableFor(
    kind:
      | "enterprise_growth_monitoring"
      | "revenue_growth_monitoring"
      | "profit_growth_monitoring"
      | "customer_growth_monitoring"
      | "operational_growth_monitoring"
      | "growth_opportunity_identification"
      | "growth_constraint_identification"
      | "growth_strategy_optimization",
  ): boolean {
    const p = this.dependencyPresence();
    switch (kind) {
      case "enterprise_growth_monitoring":
        return (
          p.executiveScalingDashboard ||
          p.globalScalingPlanner ||
          p.autonomousScalingFramework
        );
      case "revenue_growth_monitoring":
        return (
          p.financialScaleEngine ||
          p.marketingScaleEngine ||
          p.winningProductDetector ||
          p.autonomousScalingFramework
        );
      case "profit_growth_monitoring":
        return p.financialScaleEngine || p.autonomousScalingFramework;
      case "customer_growth_monitoring":
        return (
          p.marketingScaleEngine ||
          p.winningProductDetector ||
          p.autonomousScalingFramework
        );
      case "operational_growth_monitoring":
        return (
          p.capacityPlanningEngine ||
          p.operationalElasticityEngine ||
          p.bottleneckIntelligence ||
          p.autonomousScalingFramework
        );
      case "growth_opportunity_identification":
        return (
          p.winningProductDetector ||
          p.scalingDecisionEngine ||
          p.globalScalingPlanner ||
          p.autonomousScalingFramework
        );
      case "growth_constraint_identification":
        return (
          p.scalingRiskMonitor ||
          p.bottleneckIntelligence ||
          p.performancePreservationEngine ||
          p.autonomousScalingFramework
        );
      case "growth_strategy_optimization":
        return (
          p.scalingDecisionEngine ||
          p.globalScalingPlanner ||
          p.executiveScalingDashboard ||
          p.autonomousScalingFramework
        );
      default:
        return true;
    }
  }

  private requireConnected(): AutonomousGrowthOptimizerRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Autonomous Growth Optimizer not connected — call connectAutonomousGrowthOptimizer first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: GrowthOptimizationRecord): void {
    const idx = this.growthOptimizationRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.growthCategory === record.growthCategory,
    );
    if (idx >= 0) this.growthOptimizationRecords[idx] = record;
    else this.growthOptimizationRecords.push(record);
  }

  failReport(
    action: AgoRunReport["action"],
    errors: string[],
    durationMs: number,
  ): AgoRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "ago-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: AUTONOMOUS_GROWTH_OPTIMIZER_ID,
        engineVersion: "PILLOW-AGO-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...AGO_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: AGO_METADATA_VERSION,
      } satisfies AutonomousGrowthOptimizerRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `ago-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: AGO_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: AutonomousGrowthOptimizerConfiguration): {
    frameworkModuleId: string | null;
    validation: GrowthValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: AUTONOMOUS_GROWTH_OPTIMIZER_ID,
        moduleVersion: AGO_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-15",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "autonomous_growth.enterprise",
            "autonomous_growth.revenue",
            "autonomous_growth.opportunity",
            "autonomous_growth.ranked",
            "autonomous_growth.recommendation",
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
        AUTONOMOUS_GROWTH_OPTIMIZER_ID,
      );
    }

    appendAgoLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Autonomous Growth Optimizer with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `ago-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: AGO_METADATA_VERSION,
      },
    };
  }

  connectAutonomousGrowthOptimizer(
    _input: ConnectAutonomousGrowthOptimizerInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
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
      engineRecordId: `ago-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: AUTONOMOUS_GROWTH_OPTIMIZER_ID,
      engineVersion: "PILLOW-AGO-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 14
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...AGO_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: AGO_METADATA_VERSION,
    };

    appendAgoLog({
      event: "engine_connected",
      level: "info",
      details:
        "Autonomous Growth Optimizer connected — never optimize growth beyond validated operational limits; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never optimize growth beyond validated operational limits",
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

  private runOptimizationOp(
    action: AgoRunReport["action"],
    label: string,
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
    logEvent: string,
    produce: () => GrowthOptimizationRecord,
  ): AgoRunReport {
    const started = Date.now();
    try {
      if (!config.optimizationRulesEnabled) {
        return this.failReport(action, ["Optimization rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateGrowthOptimization(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendAgoLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.growthCategory} · opportunity=${record.growthOpportunityScore} · priority=${record.optimizationPriority}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        growthOptimizationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendAgoLog({ event: "autonomous_growth_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorEnterpriseGrowth(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    return this.runOptimizationOp(
      "monitor_enterprise_growth",
      "Enterprise growth monitoring",
      input,
      config,
      "autonomous_growth_evaluation",
      () =>
        this.enterpriseGrowthEngine.monitorEnterprise(
          input,
          config,
          this.sourceAvailableFor("enterprise_growth_monitoring"),
        ),
    );
  }

  monitorRevenueGrowth(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    return this.runOptimizationOp(
      "monitor_revenue_growth",
      "Revenue growth monitoring",
      input,
      config,
      "autonomous_growth_evaluation",
      () =>
        this.enterpriseGrowthEngine.monitorRevenue(
          input,
          config,
          this.sourceAvailableFor("revenue_growth_monitoring"),
        ),
    );
  }

  monitorProfitGrowth(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    return this.runOptimizationOp(
      "monitor_profit_growth",
      "Profit growth monitoring",
      input,
      config,
      "autonomous_growth_evaluation",
      () =>
        this.enterpriseGrowthEngine.monitorProfit(
          input,
          config,
          this.sourceAvailableFor("profit_growth_monitoring"),
        ),
    );
  }

  monitorCustomerGrowth(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    return this.runOptimizationOp(
      "monitor_customer_growth",
      "Customer growth monitoring",
      input,
      config,
      "autonomous_growth_evaluation",
      () =>
        this.enterpriseGrowthEngine.monitorCustomer(
          input,
          config,
          this.sourceAvailableFor("customer_growth_monitoring"),
        ),
    );
  }

  monitorOperationalGrowth(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    return this.runOptimizationOp(
      "monitor_operational_growth",
      "Operational growth monitoring",
      input,
      config,
      "autonomous_growth_evaluation",
      () =>
        this.enterpriseGrowthEngine.monitorOperational(
          input,
          config,
          this.sourceAvailableFor("operational_growth_monitoring"),
        ),
    );
  }

  identifyGrowthOpportunities(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    return this.runOptimizationOp(
      "identify_growth_opportunities",
      "Growth opportunity identification",
      input,
      config,
      "autonomous_growth_evaluation",
      () =>
        this.opportunityEngine.identify(
          input,
          config,
          this.sourceAvailableFor("growth_opportunity_identification"),
        ),
    );
  }

  identifyGrowthConstraints(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    return this.runOptimizationOp(
      "identify_growth_constraints",
      "Growth constraint identification",
      input,
      config,
      "autonomous_growth_evaluation",
      () =>
        this.constraintAnalyzer.identify(
          input,
          config,
          this.sourceAvailableFor("growth_constraint_identification"),
        ),
    );
  }

  optimizeGrowthStrategies(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    return this.runOptimizationOp(
      "optimize_growth_strategies",
      "Growth strategy optimization",
      input,
      config,
      "autonomous_growth_evaluation",
      () =>
        this.strategyOptimizer.optimize(
          input,
          config,
          this.sourceAvailableFor("growth_strategy_optimization"),
        ),
    );
  }

  rankGrowthPriorities(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateGrowthOptimization(
        "Growth priority ranking",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport("rank_growth_priorities", validation.errors, Date.now() - started);
      }
      const ranked = this.strategyOptimizer.rank(this.growthOptimizationRecords, config);
      this.growthOptimizationRecords = ranked;
      engineRecord.currentOperationalState = "active";
      appendAgoLog({
        event: "autonomous_growth_ranking",
        level: "info",
        details: `Ranked ${ranked.length} growth optimization priorities — never optimize beyond validated operational limits`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "rank_growth_priorities",
        engineRecord,
        growthOptimizationRecords: ranked,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendAgoLog({ event: "autonomous_growth_failure", level: "error", details: message });
      return this.failReport("rank_growth_priorities", [message], Date.now() - started);
    }
  }

  recommendAutonomousGrowth(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled) {
        return this.failReport(
          "recommend_autonomous_growth",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateGrowthOptimization(
        "Autonomous growth recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "recommend_autonomous_growth",
          validation.errors,
          Date.now() - started,
        );
      }
      this.recommendations = this.recommendationEngine.generate(
        this.growthOptimizationRecords,
        config,
      );
      engineRecord.currentOperationalState = "active";
      appendAgoLog({
        event: "autonomous_growth_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} autonomous growth recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_autonomous_growth",
        engineRecord,
        growthOptimizationRecords: this.growthOptimizationRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendAgoLog({ event: "autonomous_growth_failure", level: "error", details: message });
      return this.failReport("recommend_autonomous_growth", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunAgoDiagnosticsInput,
    config: AutonomousGrowthOptimizerConfiguration,
  ): AgoRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `ago-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: AUTONOMOUS_GROWTH_OPTIMIZER_ID,
        engineVersion: "PILLOW-AGO-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...AGO_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: AGO_METADATA_VERSION,
      } satisfies AutonomousGrowthOptimizerRecord);

    appendAgoLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.growthOptimizationRecords.length} · highPriority=${this.highPriorityCount()} · avgOpportunity=${this.averageOpportunityScore()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      growthOptimizationRecords: this.growthOptimizationRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
