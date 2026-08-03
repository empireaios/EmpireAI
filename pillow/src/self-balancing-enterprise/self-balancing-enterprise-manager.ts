/** X3-19 — Self-Balancing Enterprise Manager. */

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
import type { ScaleSimulationEngine } from "../scale-simulation-engine/engine.js";
import {
  SELF_BALANCING_ENTERPRISE_ID,
  SBE_CAPABILITIES,
  SBE_METADATA_VERSION,
} from "./paths.js";
import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import { appendSbeLog } from "./sbe-logging.js";
import { EnterpriseBalanceEngine } from "./enterprise-balance-engine.js";
import { ResourceReallocationEngine } from "./resource-reallocation-engine.js";
import { OperationalBalanceEngine } from "./operational-balance-engine.js";
import { FinancialBalanceEngine } from "./financial-balance-engine.js";
import { WorkforceBalanceEngine } from "./workforce-balance-engine.js";
import { BalanceRecommendationEngine } from "./balance-recommendation-engine.js";
import { BalanceMetadataGenerator } from "./balance-metadata-generator.js";
import { BalanceValidator } from "./balance-validator.js";
import type {
  SelfBalancingRecommendation,
  SelfBalancingEnterpriseRecord,
  SelfBalancingInput,
  SelfBalancingRecord,
  BalanceValidationReport,
  SbeRunReport,
  ConnectSelfBalancingEnterpriseInput,
  RunSbeDiagnosticsInput,
} from "./types.js";

export type SelfBalancingEnterpriseDependencies = {
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
  scaleSimulationEngine?: ScaleSimulationEngine | null;
};

export class SelfBalancingEnterpriseManager {
  private engineRecord: SelfBalancingEnterpriseRecord | null = null;
  private balancingRecords: SelfBalancingRecord[] = [];
  private recommendations: SelfBalancingRecommendation[] = [];

  private readonly enterpriseBalanceEngine = new EnterpriseBalanceEngine();
  private readonly resourceReallocationEngine = new ResourceReallocationEngine();
  private readonly operationalBalanceEngine = new OperationalBalanceEngine();
  private readonly financialBalanceEngine = new FinancialBalanceEngine();
  private readonly workforceBalanceEngine = new WorkforceBalanceEngine();
  private readonly recommendationEngine = new BalanceRecommendationEngine();
  private readonly metadataGenerator = new BalanceMetadataGenerator();
  private readonly validator = new BalanceValidator();

  constructor(private readonly deps: SelfBalancingEnterpriseDependencies = {}) {}

  getEngineRecord(): SelfBalancingEnterpriseRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getBalancingRecords(): SelfBalancingRecord[] {
    return this.balancingRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): SelfBalancingRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  highScoreCount(config?: SelfBalancingEnterpriseConfiguration): number {
    const threshold = config?.highScoreThreshold ?? 70;
    return this.balancingRecords.filter((r) => r.balanceScore >= threshold).length;
  }

  averageBalanceScore(): number {
    if (this.balancingRecords.length === 0) return 0;
    const sum = this.balancingRecords.reduce((acc, r) => acc + r.balanceScore, 0);
    return Math.round(sum / this.balancingRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.balancingRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): SelfBalancingEnterpriseRecord["dependencyPresence"] {
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
      scaleSimulationEngine: Boolean(this.deps.scaleSimulationEngine),
    };
  }

  private sourceAvailableFor(
    kind:
      | "enterprise_resource_utilization_monitoring"
      | "operational_balance_monitoring"
      | "financial_balance_monitoring"
      | "workforce_balance_monitoring"
      | "supplier_balance_monitoring"
      | "infrastructure_balance_monitoring"
      | "resource_imbalance_detection"
      | "policy_gated_resource_reallocation"
      | "enterprise_equilibrium_optimization",
  ): boolean {
    const p = this.dependencyPresence();
    switch (kind) {
      case "enterprise_resource_utilization_monitoring":
        return (
          p.autonomousScalingFramework ||
          p.scaleSimulationEngine ||
          p.globalScalingPlanner ||
          p.autonomousGrowthOptimizer
        );
      case "operational_balance_monitoring":
        return (
          p.operationalElasticityEngine ||
          p.capacityPlanningEngine ||
          p.performancePreservationEngine ||
          p.autonomousScalingFramework
        );
      case "financial_balance_monitoring":
        return (
          p.financialScaleEngine ||
          p.profitScalingEngine ||
          p.revenueAccelerationEngine ||
          p.autonomousScalingFramework
        );
      case "workforce_balance_monitoring":
        return (
          p.workforceIntelligence ||
          p.capacityPlanningEngine ||
          p.executiveScalingDashboard ||
          p.autonomousScalingFramework
        );
      case "supplier_balance_monitoring":
        return (
          p.supplierScaleEngine ||
          p.capacityPlanningEngine ||
          p.bottleneckIntelligence ||
          p.autonomousScalingFramework
        );
      case "infrastructure_balance_monitoring":
        return (
          p.operationalElasticityEngine ||
          p.performancePreservationEngine ||
          p.scaleSimulationEngine ||
          p.autonomousScalingFramework
        );
      case "resource_imbalance_detection":
        return (
          p.bottleneckIntelligence ||
          p.scalingRiskMonitor ||
          p.scaleSimulationEngine ||
          p.autonomousScalingFramework
        );
      case "policy_gated_resource_reallocation":
        return (
          p.scalingDecisionEngine ||
          p.autonomousGrowthOptimizer ||
          p.executiveScalingDashboard ||
          p.autonomousScalingFramework
        );
      case "enterprise_equilibrium_optimization":
        return (
          p.globalScalingPlanner ||
          p.autonomousGrowthOptimizer ||
          p.scaleSimulationEngine ||
          p.autonomousScalingFramework
        );
      default:
        return true;
    }
  }

  private requireConnected(): SelfBalancingEnterpriseRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Self-Balancing Enterprise not connected — call connectSelfBalancingEnterprise first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: SelfBalancingRecord): void {
    const idx = this.balancingRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.resourceCategory === record.resourceCategory,
    );
    if (idx >= 0) this.balancingRecords[idx] = record;
    else this.balancingRecords.push(record);
  }

  failReport(
    action: SbeRunReport["action"],
    errors: string[],
    durationMs: number,
  ): SbeRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "sbe-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: SELF_BALANCING_ENTERPRISE_ID,
        engineVersion: "PILLOW-SBE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...SBE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SBE_METADATA_VERSION,
      } satisfies SelfBalancingEnterpriseRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `sbe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: SBE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: SelfBalancingEnterpriseConfiguration): {
    frameworkModuleId: string | null;
    validation: BalanceValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: SELF_BALANCING_ENTERPRISE_ID,
        moduleVersion: SBE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-19",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "self_balancing.utilization",
            "self_balancing.operational",
            "self_balancing.financial",
            "self_balancing.workforce",
            "self_balancing.supplier",
            "self_balancing.infrastructure",
            "self_balancing.reallocation",
            "self_balancing.recommendation",
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
        SELF_BALANCING_ENTERPRISE_ID,
      );
    }

    appendSbeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Self-Balancing Enterprise with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `sbe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: SBE_METADATA_VERSION,
      },
    };
  }

  connectSelfBalancingEnterprise(
    _input: ConnectSelfBalancingEnterpriseInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
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
      engineRecordId: `sbe-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SELF_BALANCING_ENTERPRISE_ID,
      engineVersion: "PILLOW-SBE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 18
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...SBE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: SBE_METADATA_VERSION,
    };

    appendSbeLog({
      event: "engine_connected",
      level: "info",
      details:
        "Self-Balancing Enterprise connected — never reallocate protected resources beyond approval policies; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never reallocate protected resources beyond approval policies",
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

  private runBalanceOp(
    action: SbeRunReport["action"],
    label: string,
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
    logEvent: string,
    produce: () => SelfBalancingRecord,
  ): SbeRunReport {
    const started = Date.now();
    try {
      if (!config.balancingRulesEnabled) {
        return this.failReport(action, ["Balancing rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateBalancing(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendSbeLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.resourceCategory} · score=${record.balanceScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        balancingRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSbeLog({ event: "self_balancing_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorEnterpriseResourceUtilization(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    return this.runBalanceOp(
      "monitor_enterprise_resource_utilization",
      "Enterprise resource utilization monitoring",
      input,
      config,
      "self_balancing_evaluation",
      () =>
        this.enterpriseBalanceEngine.monitorEnterpriseResourceUtilization(
          input,
          config,
          this.sourceAvailableFor("enterprise_resource_utilization_monitoring"),
        ),
    );
  }

  monitorOperationalBalance(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    return this.runBalanceOp(
      "monitor_operational_balance",
      "Operational balance monitoring",
      input,
      config,
      "self_balancing_evaluation",
      () =>
        this.operationalBalanceEngine.monitorOperationalBalance(
          input,
          config,
          this.sourceAvailableFor("operational_balance_monitoring"),
        ),
    );
  }

  monitorFinancialBalance(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    return this.runBalanceOp(
      "monitor_financial_balance",
      "Financial balance monitoring",
      input,
      config,
      "self_balancing_evaluation",
      () =>
        this.financialBalanceEngine.monitorFinancialBalance(
          input,
          config,
          this.sourceAvailableFor("financial_balance_monitoring"),
        ),
    );
  }

  monitorWorkforceBalance(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    return this.runBalanceOp(
      "monitor_workforce_balance",
      "Workforce balance monitoring",
      input,
      config,
      "self_balancing_evaluation",
      () =>
        this.workforceBalanceEngine.monitorWorkforceBalance(
          input,
          config,
          this.sourceAvailableFor("workforce_balance_monitoring"),
        ),
    );
  }

  monitorSupplierBalance(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    return this.runBalanceOp(
      "monitor_supplier_balance",
      "Supplier balance monitoring",
      input,
      config,
      "self_balancing_evaluation",
      () =>
        this.enterpriseBalanceEngine.monitorSupplierBalance(
          input,
          config,
          this.sourceAvailableFor("supplier_balance_monitoring"),
        ),
    );
  }

  monitorInfrastructureBalance(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    return this.runBalanceOp(
      "monitor_infrastructure_balance",
      "Infrastructure balance monitoring",
      input,
      config,
      "self_balancing_evaluation",
      () =>
        this.enterpriseBalanceEngine.monitorInfrastructureBalance(
          input,
          config,
          this.sourceAvailableFor("infrastructure_balance_monitoring"),
        ),
    );
  }

  detectResourceImbalances(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    return this.runBalanceOp(
      "detect_resource_imbalances",
      "Resource imbalance detection",
      input,
      config,
      "self_balancing_evaluation",
      () =>
        this.enterpriseBalanceEngine.detectResourceImbalances(
          input,
          config,
          this.sourceAvailableFor("resource_imbalance_detection"),
        ),
    );
  }

  reallocateResourcesPerPolicy(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    return this.runBalanceOp(
      "reallocate_resources_per_policy",
      "Policy-gated resource reallocation",
      input,
      config,
      "self_balancing_evaluation",
      () =>
        this.resourceReallocationEngine.reallocateResourcesPerPolicy(
          input,
          config,
          this.sourceAvailableFor("policy_gated_resource_reallocation"),
        ),
    );
  }

  optimizeEnterpriseEquilibrium(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    return this.runBalanceOp(
      "optimize_enterprise_equilibrium",
      "Enterprise equilibrium optimization",
      input,
      config,
      "self_balancing_evaluation",
      () =>
        this.enterpriseBalanceEngine.optimizeEnterpriseEquilibrium(
          input,
          config,
          this.sourceAvailableFor("enterprise_equilibrium_optimization"),
        ),
    );
  }

  recommendBalancingActions(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled) {
        return this.failReport(
          "recommend_balancing_actions",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateBalancing(
        "Balancing recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "recommend_balancing_actions",
          validation.errors,
          Date.now() - started,
        );
      }
      this.recommendations = this.recommendationEngine.generate(
        this.balancingRecords,
        config,
      );
      engineRecord.currentOperationalState = "active";
      appendSbeLog({
        event: "self_balancing_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} self-balancing recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_balancing_actions",
        engineRecord,
        balancingRecords: this.balancingRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSbeLog({ event: "self_balancing_failure", level: "error", details: message });
      return this.failReport("recommend_balancing_actions", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunSbeDiagnosticsInput,
    config: SelfBalancingEnterpriseConfiguration,
  ): SbeRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `sbe-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: SELF_BALANCING_ENTERPRISE_ID,
        engineVersion: "PILLOW-SBE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...SBE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SBE_METADATA_VERSION,
      } satisfies SelfBalancingEnterpriseRecord);

    appendSbeLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.balancingRecords.length} · highScore=${this.highScoreCount(config)} · avgScore=${this.averageBalanceScore()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      balancingRecords: this.balancingRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
