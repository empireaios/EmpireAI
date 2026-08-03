/** X3-17 — Profit Scaling Engine Manager. */



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

import type { RevenueAccelerationEngine } from "../revenue-acceleration-engine/engine.js";

import {

  PROFIT_SCALING_ENGINE_ID,

  PSE_CAPABILITIES,

  PSE_METADATA_VERSION,

} from "./paths.js";

import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import { appendPseLog } from "./pse-logging.js";

import { ProfitAnalysisEngine } from "./profit-analysis-engine.js";

import { MarginAnalysisEngine } from "./margin-analysis-engine.js";

import { CostEfficiencyEngine } from "./cost-efficiency-engine.js";

import { ProfitOptimizationEngine } from "./profit-optimization-engine.js";

import { ProfitRecommendationEngine } from "./profit-recommendation-engine.js";

import { ProfitMetadataGenerator } from "./profit-metadata-generator.js";

import { ProfitValidator } from "./profit-validator.js";

import type {

  ProfitScalingRecommendation,

  ProfitScalingEngineRecord,

  ProfitScalingInput,

  ProfitScalingRecord,

  ProfitValidationReport,

  PseRunReport,

  ConnectProfitScalingEngineInput,

  RunPseDiagnosticsInput,

} from "./types.js";



export type ProfitScalingEngineDependencies = {

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

  revenueAccelerationEngine?: RevenueAccelerationEngine | null;

};



export class ProfitScalingManager {

  private engineRecord: ProfitScalingEngineRecord | null = null;

  private profitScalingRecords: ProfitScalingRecord[] = [];

  private recommendations: ProfitScalingRecommendation[] = [];



  private readonly analysisEngine = new ProfitAnalysisEngine();

  private readonly marginAnalysisEngine = new MarginAnalysisEngine();

  private readonly costEfficiencyEngine = new CostEfficiencyEngine();

  private readonly optimizationEngine = new ProfitOptimizationEngine();

  private readonly recommendationEngine = new ProfitRecommendationEngine();

  private readonly metadataGenerator = new ProfitMetadataGenerator();

  private readonly validator = new ProfitValidator();



  constructor(private readonly deps: ProfitScalingEngineDependencies = {}) {}



  getEngineRecord(): ProfitScalingEngineRecord | null {

    return this.engineRecord ? { ...this.engineRecord } : null;

  }



  getProfitScalingRecords(): ProfitScalingRecord[] {

    return this.profitScalingRecords.map((r) => ({ ...r }));

  }



  getRecommendations(): ProfitScalingRecommendation[] {

    return this.recommendations.map((r) => ({ ...r }));

  }



  highOptimizationCount(config?: ProfitScalingEngineConfiguration): number {

    const threshold = config?.highOptimizationThreshold ?? 70;

    return this.profitScalingRecords.filter(

      (r) => r.profitOptimizationScore >= threshold,

    ).length;

  }



  averageOptimizationScore(): number {

    if (this.profitScalingRecords.length === 0) return 0;

    const sum = this.profitScalingRecords.reduce(

      (acc, r) => acc + r.profitOptimizationScore,

      0,

    );

    return Math.round(sum / this.profitScalingRecords.length);

  }



  resetForTesting(): void {

    this.engineRecord = null;

    this.profitScalingRecords = [];

    this.recommendations = [];

  }



  private dependencyPresence(): ProfitScalingEngineRecord["dependencyPresence"] {

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

      revenueAccelerationEngine: Boolean(this.deps.revenueAccelerationEngine),

    };

  }



  private sourceAvailableFor(

    kind:

      | "profit_growth_monitoring"

      | "gross_margin_monitoring"

      | "net_margin_monitoring"

      | "operating_margin_monitoring"

      | "scaling_cost_monitoring"

      | "roi_monitoring"

      | "profit_erosion_detection"

      | "unprofitable_growth_detection"

      | "profit_optimization_during_scaling",

  ): boolean {

    const p = this.dependencyPresence();

    switch (kind) {

      case "profit_growth_monitoring":

        return (

          p.financialScaleEngine ||

          p.autonomousGrowthOptimizer ||

          p.revenueAccelerationEngine ||

          p.autonomousScalingFramework

        );

      case "gross_margin_monitoring":

      case "net_margin_monitoring":

      case "operating_margin_monitoring":

        return (

          p.financialScaleEngine ||

          p.revenueAccelerationEngine ||

          p.executiveScalingDashboard ||

          p.autonomousScalingFramework

        );

      case "scaling_cost_monitoring":

        return (

          p.financialScaleEngine ||

          p.capacityPlanningEngine ||

          p.scalingRiskMonitor ||

          p.autonomousScalingFramework

        );

      case "roi_monitoring":

        return (

          p.financialScaleEngine ||

          p.autonomousGrowthOptimizer ||

          p.revenueAccelerationEngine ||

          p.autonomousScalingFramework

        );

      case "profit_erosion_detection":

        return (

          p.bottleneckIntelligence ||

          p.scalingRiskMonitor ||

          p.financialScaleEngine ||

          p.autonomousScalingFramework

        );

      case "unprofitable_growth_detection":

        return (

          p.autonomousGrowthOptimizer ||

          p.revenueAccelerationEngine ||

          p.financialScaleEngine ||

          p.autonomousScalingFramework

        );

      case "profit_optimization_during_scaling":

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



  private requireConnected(): ProfitScalingEngineRecord {

    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {

      throw new Error(

        "Profit Scaling Engine not connected — call connectProfitScalingEngine first",

      );

    }

    return this.engineRecord;

  }



  private storeRecord(record: ProfitScalingRecord): void {

    const idx = this.profitScalingRecords.findIndex(

      (r) =>

        r.companyReference === record.companyReference &&

        r.profitCategory === record.profitCategory,

    );

    if (idx >= 0) this.profitScalingRecords[idx] = record;

    else this.profitScalingRecords.push(record);

  }



  failReport(

    action: PseRunReport["action"],

    errors: string[],

    durationMs: number,

  ): PseRunReport {

    const engineRecord =

      this.engineRecord ??

      ({

        engineRecordId: "pse-eng-pending",

        timestamp: new Date().toISOString(),

        engineId: PROFIT_SCALING_ENGINE_ID,

        engineVersion: "PILLOW-PSE-001",

        currentOperationalState: "failed",

        healthStatus: "failed",

        validationStatus: "failed",

        supportedCapabilities: [...PSE_CAPABILITIES],

        frameworkModuleId: null,

        dependencyPresence: this.dependencyPresence(),

        metadataVersion: PSE_METADATA_VERSION,

      } satisfies ProfitScalingEngineRecord);



    return this.metadataGenerator.buildRunReport({

      action,

      engineRecord,

      validation: {

        validationReportId: `pse-val-${Date.now()}`,

        validationTimestamp: new Date().toISOString(),

        decision: "fail",

        errors,

        warnings: [],

        durationMs,

        metadataVersion: PSE_METADATA_VERSION,

      },

      durationMs,

    });

  }



  registerWithFramework(config: ProfitScalingEngineConfiguration): {

    frameworkModuleId: string | null;

    validation: ProfitValidationReport;

  } {

    if (!this.deps.autonomousScalingFramework) {

      return {

        frameworkModuleId: null,

        validation: this.validator.validateConfiguration(config),

      };

    }



    const report = this.deps.autonomousScalingFramework.registerScalingModule({

      definition: {

        scalingModuleIdentifier: PROFIT_SCALING_ENGINE_ID,

        moduleVersion: PSE_METADATA_VERSION,

        moduleType: "integration",

        integrationMissionId: "X3-17",

        eventRoutingConfig: {

          enabled: true,

          topics: [

            "profit_scaling.growth",

            "profit_scaling.margin",

            "profit_scaling.erosion",

            "profit_scaling.optimized",

            "profit_scaling.recommendation",

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

        PROFIT_SCALING_ENGINE_ID,

      );

    }



    appendPseLog({

      event: "framework_registration",

      level: "info",

      details: `Registered Profit Scaling Engine with ASF: ${report.validation.decision}`,

    });



    return {

      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,

      validation: {

        validationReportId: `pse-val-${Date.now()}`,

        validationTimestamp: new Date().toISOString(),

        decision: report.validation.decision,

        errors: report.validation.errors,

        warnings: report.validation.warnings,

        durationMs: report.durationMs,

        metadataVersion: PSE_METADATA_VERSION,

      },

    };

  }



  connectProfitScalingEngine(

    _input: ConnectProfitScalingEngineInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

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

      engineRecordId: `pse-eng-${Date.now()}`,

      timestamp: new Date().toISOString(),

      engineId: PROFIT_SCALING_ENGINE_ID,

      engineVersion: "PILLOW-PSE-001",

      currentOperationalState: "connected",

      healthStatus: corePresent

        ? connectedCount >= 16

          ? "healthy"

          : "degraded"

        : "degraded",

      validationStatus:

        framework.validation.decision === "fail"

          ? "failed"

          : framework.validation.decision === "partial"

            ? "partial"

            : "passed",

      supportedCapabilities: [...PSE_CAPABILITIES],

      frameworkModuleId: framework.frameworkModuleId,

      dependencyPresence: presence,

      metadataVersion: PSE_METADATA_VERSION,

    };



    appendPseLog({

      event: "engine_connected",

      level: "info",

      details:

        "Profit Scaling Engine connected — never prioritize growth over validated profitability; structural signals only",

    });



    const warnings = [

      ...framework.validation.warnings,

      ...configValidation.warnings,

      ...Object.entries(presence)

        .filter(([, ok]) => !ok)

        .map(([key]) => `${key} unavailable`),

      "Never prioritize growth over validated profitability",

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



  private runScalingOp(

    action: PseRunReport["action"],

    label: string,

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

    logEvent: string,

    produce: () => ProfitScalingRecord,

  ): PseRunReport {

    const started = Date.now();

    try {

      if (!config.scalingRulesEnabled) {

        return this.failReport(action, ["Scaling rules disabled"], Date.now() - started);

      }

      const engineRecord = this.requireConnected();

      const validation = this.validator.validateProfitScaling(label, input, config);

      if (validation.decision === "fail") {

        return this.failReport(action, validation.errors, Date.now() - started);

      }



      const record = produce();

      this.storeRecord(record);

      engineRecord.currentOperationalState = "active";

      engineRecord.timestamp = new Date().toISOString();



      appendPseLog({

        event: logEvent,

        level: "info",

        details: `${label} · ${record.profitCategory} · optimization=${record.profitOptimizationScore}`,

      });



      return this.metadataGenerator.buildRunReport({

        action,

        engineRecord,

        profitScalingRecords: [record],

        validation,

        durationMs: Date.now() - started,

      });

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);

      appendPseLog({ event: "profit_scaling_failure", level: "error", details: message });

      return this.failReport(action, [message], Date.now() - started);

    }

  }



  monitorProfitGrowth(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    return this.runScalingOp(

      "monitor_profit_growth",

      "Profit growth monitoring",

      input,

      config,

      "profit_scaling_evaluation",

      () =>

        this.analysisEngine.monitorGrowth(

          input,

          config,

          this.sourceAvailableFor("profit_growth_monitoring"),

        ),

    );

  }



  monitorGrossMargin(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    return this.runScalingOp(

      "monitor_gross_margin",

      "Gross margin monitoring",

      input,

      config,

      "profit_scaling_evaluation",

      () =>

        this.marginAnalysisEngine.monitorGrossMargin(

          input,

          config,

          this.sourceAvailableFor("gross_margin_monitoring"),

        ),

    );

  }



  monitorNetMargin(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    return this.runScalingOp(

      "monitor_net_margin",

      "Net margin monitoring",

      input,

      config,

      "profit_scaling_evaluation",

      () =>

        this.marginAnalysisEngine.monitorNetMargin(

          input,

          config,

          this.sourceAvailableFor("net_margin_monitoring"),

        ),

    );

  }



  monitorOperatingMargin(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    return this.runScalingOp(

      "monitor_operating_margin",

      "Operating margin monitoring",

      input,

      config,

      "profit_scaling_evaluation",

      () =>

        this.marginAnalysisEngine.monitorOperatingMargin(

          input,

          config,

          this.sourceAvailableFor("operating_margin_monitoring"),

        ),

    );

  }



  monitorScalingCosts(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    return this.runScalingOp(

      "monitor_scaling_costs",

      "Scaling cost monitoring",

      input,

      config,

      "profit_scaling_evaluation",

      () =>

        this.costEfficiencyEngine.monitorScalingCosts(

          input,

          config,

          this.sourceAvailableFor("scaling_cost_monitoring"),

        ),

    );

  }



  monitorReturnOnInvestment(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    return this.runScalingOp(

      "monitor_return_on_investment",

      "ROI monitoring",

      input,

      config,

      "profit_scaling_evaluation",

      () =>

        this.costEfficiencyEngine.monitorReturnOnInvestment(

          input,

          config,

          this.sourceAvailableFor("roi_monitoring"),

        ),

    );

  }



  detectProfitErosion(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    return this.runScalingOp(

      "detect_profit_erosion",

      "Profit erosion detection",

      input,

      config,

      "profit_scaling_evaluation",

      () =>

        this.optimizationEngine.detectErosion(

          input,

          config,

          this.sourceAvailableFor("profit_erosion_detection"),

        ),

    );

  }



  detectUnprofitableGrowth(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    return this.runScalingOp(

      "detect_unprofitable_growth",

      "Unprofitable growth detection",

      input,

      config,

      "profit_scaling_evaluation",

      () =>

        this.optimizationEngine.detectUnprofitableGrowth(

          input,

          config,

          this.sourceAvailableFor("unprofitable_growth_detection"),

        ),

    );

  }



  optimizeProfitDuringScaling(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    return this.runScalingOp(

      "optimize_profit_during_scaling",

      "Profit optimization during scaling",

      input,

      config,

      "profit_scaling_evaluation",

      () =>

        this.optimizationEngine.optimizeDuringScaling(

          input,

          config,

          this.sourceAvailableFor("profit_optimization_during_scaling"),

        ),

    );

  }



  recommendProfitScaling(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    const started = Date.now();

    try {

      if (!config.recommendationRulesEnabled) {

        return this.failReport(

          "recommend_profit_scaling",

          ["Recommendation rules disabled"],

          0,

        );

      }

      const engineRecord = this.requireConnected();

      const validation = this.validator.validateProfitScaling(

        "Profit scaling recommendation",

        input,

        config,

      );

      if (validation.decision === "fail") {

        return this.failReport(

          "recommend_profit_scaling",

          validation.errors,

          Date.now() - started,

        );

      }

      this.recommendations = this.recommendationEngine.generate(

        this.profitScalingRecords,

        config,

      );

      engineRecord.currentOperationalState = "active";

      appendPseLog({

        event: "profit_scaling_recommendations",

        level: "info",

        details: `Generated ${this.recommendations.length} profit scaling recommendations`,

      });

      return this.metadataGenerator.buildRunReport({

        action: "recommend_profit_scaling",

        engineRecord,

        profitScalingRecords: this.profitScalingRecords,

        recommendations: this.recommendations,

        validation,

        durationMs: Date.now() - started,

      });

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);

      appendPseLog({ event: "profit_scaling_failure", level: "error", details: message });

      return this.failReport("recommend_profit_scaling", [message], Date.now() - started);

    }

  }



  runDiagnostics(

    _input: RunPseDiagnosticsInput,

    config: ProfitScalingEngineConfiguration,

  ): PseRunReport {

    const started = Date.now();

    const configValidation = this.validator.validateConfiguration(config);

    const engineRecord =

      this.engineRecord ??

      ({

        engineRecordId: `pse-eng-diag-${Date.now()}`,

        timestamp: new Date().toISOString(),

        engineId: PROFIT_SCALING_ENGINE_ID,

        engineVersion: "PILLOW-PSE-001",

        currentOperationalState: "connected",

        healthStatus: "healthy",

        validationStatus: "passed",

        supportedCapabilities: [...PSE_CAPABILITIES],

        frameworkModuleId: null,

        dependencyPresence: this.dependencyPresence(),

        metadataVersion: PSE_METADATA_VERSION,

      } satisfies ProfitScalingEngineRecord);



    appendPseLog({

      event: "diagnostics",

      level: "info",

      details: `Diagnostics · records=${this.profitScalingRecords.length} · highOptimization=${this.highOptimizationCount(config)} · avgOptimization=${this.averageOptimizationScore()}%`,

    });



    return this.metadataGenerator.buildRunReport({

      action: "diagnostics",

      engineRecord,

      profitScalingRecords: this.profitScalingRecords,

      recommendations: this.recommendations,

      validation: configValidation,

      durationMs: Date.now() - started,

    });

  }

}

