/** X3-18 — Scale Simulation Engine Manager. */

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
import type { ProfitScalingEngine } from "../profit-scaling-engine/engine.js";
import {
  SCALE_SIMULATION_ENGINE_ID,
  SSI_CAPABILITIES,
  SSI_METADATA_VERSION,
} from "./paths.js";
import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import { appendSsiLog } from "./ssi-logging.js";
import { ScenarioSimulationEngine } from "./scenario-simulation-engine.js";
import { RevenueSimulationEngine } from "./revenue-simulation-engine.js";
import { ProfitSimulationEngine } from "./profit-simulation-engine.js";
import { CapacitySimulationEngine } from "./capacity-simulation-engine.js";
import { RiskSimulationEngine } from "./risk-simulation-engine.js";
import { ScenarioComparisonEngine } from "./scenario-comparison-engine.js";
import { SimulationRecommendationEngine } from "./simulation-recommendation-engine.js";
import { SimulationMetadataGenerator } from "./simulation-metadata-generator.js";
import { SimulationValidator } from "./simulation-validator.js";
import type {
  ScaleSimulationRecommendation,
  ScaleSimulationEngineRecord,
  ScaleSimulationInput,
  ScaleSimulationRecord,
  SimulationValidationReport,
  SsiRunReport,
  ConnectScaleSimulationEngineInput,
  RunSsiDiagnosticsInput,
} from "./types.js";

export type ScaleSimulationEngineDependencies = {
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
  profitScalingEngine?: ProfitScalingEngine | null;
};

export class ScaleSimulationManager {
  private engineRecord: ScaleSimulationEngineRecord | null = null;
  private simulationRecords: ScaleSimulationRecord[] = [];
  private recommendations: ScaleSimulationRecommendation[] = [];

  private readonly scenarioSimulationEngine = new ScenarioSimulationEngine();
  private readonly revenueSimulationEngine = new RevenueSimulationEngine();
  private readonly profitSimulationEngine = new ProfitSimulationEngine();
  private readonly capacitySimulationEngine = new CapacitySimulationEngine();
  private readonly riskSimulationEngine = new RiskSimulationEngine();
  private readonly scenarioComparisonEngine = new ScenarioComparisonEngine();
  private readonly recommendationEngine = new SimulationRecommendationEngine();
  private readonly metadataGenerator = new SimulationMetadataGenerator();
  private readonly validator = new SimulationValidator();

  constructor(private readonly deps: ScaleSimulationEngineDependencies = {}) {}

  getEngineRecord(): ScaleSimulationEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getSimulationRecords(): ScaleSimulationRecord[] {
    return this.simulationRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): ScaleSimulationRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  highScoreCount(config?: ScaleSimulationEngineConfiguration): number {
    const threshold = config?.highScoreThreshold ?? 70;
    return this.simulationRecords.filter((r) => r.overallSimulationScore >= threshold)
      .length;
  }

  averageSimulationScore(): number {
    if (this.simulationRecords.length === 0) return 0;
    const sum = this.simulationRecords.reduce(
      (acc, r) => acc + r.overallSimulationScore,
      0,
    );
    return Math.round(sum / this.simulationRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.simulationRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): ScaleSimulationEngineRecord["dependencyPresence"] {
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
      profitScalingEngine: Boolean(this.deps.profitScalingEngine),
    };
  }

  private sourceAvailableFor(
    kind:
      | "scaling_scenario_simulation"
      | "revenue_outcome_simulation"
      | "profit_outcome_simulation"
      | "operational_capacity_simulation"
      | "supplier_capacity_simulation"
      | "workforce_utilization_simulation"
      | "financial_impact_simulation"
      | "scaling_risk_simulation"
      | "multi_scenario_comparison"
      | "simulation_outcome_ranking",
  ): boolean {
    const p = this.dependencyPresence();
    switch (kind) {
      case "scaling_scenario_simulation":
        return (
          p.autonomousScalingFramework ||
          p.scalingDecisionEngine ||
          p.globalScalingPlanner ||
          p.autonomousGrowthOptimizer
        );
      case "revenue_outcome_simulation":
        return (
          p.revenueAccelerationEngine ||
          p.financialScaleEngine ||
          p.marketingScaleEngine ||
          p.autonomousScalingFramework
        );
      case "profit_outcome_simulation":
        return (
          p.profitScalingEngine ||
          p.financialScaleEngine ||
          p.revenueAccelerationEngine ||
          p.autonomousScalingFramework
        );
      case "operational_capacity_simulation":
        return (
          p.capacityPlanningEngine ||
          p.operationalElasticityEngine ||
          p.performancePreservationEngine ||
          p.autonomousScalingFramework
        );
      case "supplier_capacity_simulation":
        return (
          p.supplierScaleEngine ||
          p.capacityPlanningEngine ||
          p.bottleneckIntelligence ||
          p.autonomousScalingFramework
        );
      case "workforce_utilization_simulation":
        return (
          p.workforceIntelligence ||
          p.capacityPlanningEngine ||
          p.executiveScalingDashboard ||
          p.autonomousScalingFramework
        );
      case "financial_impact_simulation":
        return (
          p.financialScaleEngine ||
          p.profitScalingEngine ||
          p.revenueAccelerationEngine ||
          p.autonomousScalingFramework
        );
      case "scaling_risk_simulation":
        return (
          p.scalingRiskMonitor ||
          p.bottleneckIntelligence ||
          p.performancePreservationEngine ||
          p.autonomousScalingFramework
        );
      case "multi_scenario_comparison":
      case "simulation_outcome_ranking":
        return (
          p.globalScalingPlanner ||
          p.executiveScalingDashboard ||
          p.autonomousGrowthOptimizer ||
          p.autonomousScalingFramework
        );
      default:
        return true;
    }
  }

  private requireConnected(): ScaleSimulationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Scale Simulation Engine not connected — call connectScaleSimulationEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: ScaleSimulationRecord): void {
    const idx = this.simulationRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.simulationScenario === record.simulationScenario,
    );
    if (idx >= 0) this.simulationRecords[idx] = record;
    else this.simulationRecords.push(record);
  }

  failReport(
    action: SsiRunReport["action"],
    errors: string[],
    durationMs: number,
  ): SsiRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "ssi-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: SCALE_SIMULATION_ENGINE_ID,
        engineVersion: "PILLOW-SSI-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...SSI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SSI_METADATA_VERSION,
      } satisfies ScaleSimulationEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `ssi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: SSI_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: ScaleSimulationEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: SimulationValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: SCALE_SIMULATION_ENGINE_ID,
        moduleVersion: SSI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-18",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "scale_simulation.scenario",
            "scale_simulation.revenue",
            "scale_simulation.profit",
            "scale_simulation.capacity",
            "scale_simulation.risk",
            "scale_simulation.comparison",
            "scale_simulation.recommendation",
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
        SCALE_SIMULATION_ENGINE_ID,
      );
    }

    appendSsiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Scale Simulation Engine with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `ssi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: SSI_METADATA_VERSION,
      },
    };
  }

  connectScaleSimulationEngine(
    _input: ConnectScaleSimulationEngineInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
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
      engineRecordId: `ssi-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SCALE_SIMULATION_ENGINE_ID,
      engineVersion: "PILLOW-SSI-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 17
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...SSI_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: SSI_METADATA_VERSION,
    };

    appendSsiLog({
      event: "engine_connected",
      level: "info",
      details:
        "Scale Simulation Engine connected — never execute simulated actions against production; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never execute simulated actions against production",
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

  private runSimulationOp(
    action: SsiRunReport["action"],
    label: string,
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    logEvent: string,
    produce: () => ScaleSimulationRecord,
  ): SsiRunReport {
    const started = Date.now();
    try {
      if (!config.simulationRulesEnabled) {
        return this.failReport(action, ["Simulation rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateSimulation(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendSsiLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.simulationScenario} · score=${record.overallSimulationScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        simulationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSsiLog({ event: "scale_simulation_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  simulateScalingScenarios(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    return this.runSimulationOp(
      "simulate_scaling_scenarios",
      "Scaling scenario simulation",
      input,
      config,
      "scale_simulation_evaluation",
      () =>
        this.scenarioSimulationEngine.simulateScenarios(
          input,
          config,
          this.sourceAvailableFor("scaling_scenario_simulation"),
        ),
    );
  }

  simulateRevenueOutcomes(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    return this.runSimulationOp(
      "simulate_revenue_outcomes",
      "Revenue outcome simulation",
      input,
      config,
      "scale_simulation_evaluation",
      () =>
        this.revenueSimulationEngine.simulateRevenueOutcomes(
          input,
          config,
          this.sourceAvailableFor("revenue_outcome_simulation"),
        ),
    );
  }

  simulateProfitOutcomes(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    return this.runSimulationOp(
      "simulate_profit_outcomes",
      "Profit outcome simulation",
      input,
      config,
      "scale_simulation_evaluation",
      () =>
        this.profitSimulationEngine.simulateProfitOutcomes(
          input,
          config,
          this.sourceAvailableFor("profit_outcome_simulation"),
        ),
    );
  }

  simulateOperationalCapacity(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    return this.runSimulationOp(
      "simulate_operational_capacity",
      "Operational capacity simulation",
      input,
      config,
      "scale_simulation_evaluation",
      () =>
        this.capacitySimulationEngine.simulateOperationalCapacity(
          input,
          config,
          this.sourceAvailableFor("operational_capacity_simulation"),
        ),
    );
  }

  simulateSupplierCapacity(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    return this.runSimulationOp(
      "simulate_supplier_capacity",
      "Supplier capacity simulation",
      input,
      config,
      "scale_simulation_evaluation",
      () =>
        this.capacitySimulationEngine.simulateSupplierCapacity(
          input,
          config,
          this.sourceAvailableFor("supplier_capacity_simulation"),
        ),
    );
  }

  simulateWorkforceUtilization(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    return this.runSimulationOp(
      "simulate_workforce_utilization",
      "Workforce utilization simulation",
      input,
      config,
      "scale_simulation_evaluation",
      () =>
        this.capacitySimulationEngine.simulateWorkforceUtilization(
          input,
          config,
          this.sourceAvailableFor("workforce_utilization_simulation"),
        ),
    );
  }

  simulateFinancialImpact(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    return this.runSimulationOp(
      "simulate_financial_impact",
      "Financial impact simulation",
      input,
      config,
      "scale_simulation_evaluation",
      () =>
        this.riskSimulationEngine.simulateFinancialImpact(
          input,
          config,
          this.sourceAvailableFor("financial_impact_simulation"),
        ),
    );
  }

  simulateScalingRisks(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    return this.runSimulationOp(
      "simulate_scaling_risks",
      "Scaling risk simulation",
      input,
      config,
      "scale_simulation_evaluation",
      () =>
        this.riskSimulationEngine.simulateScalingRisks(
          input,
          config,
          this.sourceAvailableFor("scaling_risk_simulation"),
        ),
    );
  }

  compareScalingScenarios(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    return this.runSimulationOp(
      "compare_scaling_scenarios",
      "Multi-scenario comparison",
      input,
      config,
      "scale_simulation_evaluation",
      () =>
        this.scenarioComparisonEngine.compareScenarios(
          this.simulationRecords,
          input,
          config,
          this.sourceAvailableFor("multi_scenario_comparison"),
        ),
    );
  }

  rankSimulationOutcomes(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    return this.runSimulationOp(
      "rank_simulation_outcomes",
      "Simulation outcome ranking",
      input,
      config,
      "scale_simulation_evaluation",
      () =>
        this.scenarioComparisonEngine.rankOutcomes(
          this.simulationRecords,
          input,
          config,
          this.sourceAvailableFor("simulation_outcome_ranking"),
        ),
    );
  }

  recommendFromSimulation(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled) {
        return this.failReport(
          "recommend_from_simulation",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateSimulation(
        "Simulation recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "recommend_from_simulation",
          validation.errors,
          Date.now() - started,
        );
      }
      this.recommendations = this.recommendationEngine.generate(
        this.simulationRecords,
        config,
      );
      engineRecord.currentOperationalState = "active";
      appendSsiLog({
        event: "scale_simulation_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} scale simulation recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_from_simulation",
        engineRecord,
        simulationRecords: this.simulationRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSsiLog({ event: "scale_simulation_failure", level: "error", details: message });
      return this.failReport("recommend_from_simulation", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunSsiDiagnosticsInput,
    config: ScaleSimulationEngineConfiguration,
  ): SsiRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `ssi-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: SCALE_SIMULATION_ENGINE_ID,
        engineVersion: "PILLOW-SSI-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...SSI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SSI_METADATA_VERSION,
      } satisfies ScaleSimulationEngineRecord);

    appendSsiLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.simulationRecords.length} · highScore=${this.highScoreCount(config)} · avgScore=${this.averageSimulationScore()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      simulationRecords: this.simulationRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
