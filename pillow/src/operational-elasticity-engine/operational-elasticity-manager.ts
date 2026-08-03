/** X3-11 — Operational Elasticity Engine Manager. */

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
import {
  OPERATIONAL_ELASTICITY_ENGINE_ID,
  OEE_CAPABILITIES,
  OEE_METADATA_VERSION,
} from "./paths.js";
import type { OperationalElasticityEngineConfiguration } from "./configuration.js";
import { appendOeeLog } from "./oee-logging.js";
import { DemandAnalysisEngine } from "./demand-analysis-engine.js";
import { CapacityAdjustmentEngine } from "./capacity-adjustment-engine.js";
import { WorkloadBalancingEngine } from "./workload-balancing-engine.js";
import { ResourceOptimizationEngine } from "./resource-optimization-engine.js";
import { ElasticityRecommendationEngine } from "./elasticity-recommendation-engine.js";
import { ElasticityMetadataGenerator } from "./elasticity-metadata-generator.js";
import { ElasticityValidator } from "./elasticity-validator.js";
import type {
  ElasticityRecommendation,
  OperationalElasticityEngineRecord,
  OperationalElasticityInput,
  ElasticityRecord,
  ElasticityValidationReport,
  OeeRunReport,
  ConnectOperationalElasticityEngineInput,
  RunOeeDiagnosticsInput,
} from "./types.js";

export type OperationalElasticityEngineDependencies = {
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
};

export class OperationalElasticityManager {
  private engineRecord: OperationalElasticityEngineRecord | null = null;
  private elasticityRecords: ElasticityRecord[] = [];
  private recommendations: ElasticityRecommendation[] = [];

  private readonly demandEngine = new DemandAnalysisEngine();
  private readonly capacityEngine = new CapacityAdjustmentEngine();
  private readonly workloadEngine = new WorkloadBalancingEngine();
  private readonly resourceEngine = new ResourceOptimizationEngine();
  private readonly recommendationEngine = new ElasticityRecommendationEngine();
  private readonly metadataGenerator = new ElasticityMetadataGenerator();
  private readonly validator = new ElasticityValidator();

  constructor(private readonly deps: OperationalElasticityEngineDependencies = {}) {}

  getEngineRecord(): OperationalElasticityEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getElasticityRecords(): ElasticityRecord[] {
    return this.elasticityRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): ElasticityRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  highUtilizationCount(config?: OperationalElasticityEngineConfiguration): number {
    const threshold = config?.highUtilizationThreshold ?? 85;
    return this.elasticityRecords.filter((r) => r.currentUtilization >= threshold).length;
  }

  averageUtilization(): number {
    if (this.elasticityRecords.length === 0) return 0;
    const sum = this.elasticityRecords.reduce((acc, r) => acc + r.currentUtilization, 0);
    return Math.round(sum / this.elasticityRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.elasticityRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): OperationalElasticityEngineRecord["dependencyPresence"] {
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
    };
  }

  private sourceAvailableFor(
    kind:
      | "demand"
      | "utilization"
      | "scale"
      | "workload"
      | "resource"
      | "overcapacity"
      | "undercapacity",
  ): boolean {
    const p = this.dependencyPresence();
    switch (kind) {
      case "demand":
        return p.winningProductDetector || p.scalingDecisionEngine || p.autonomousScalingFramework;
      case "utilization":
        return p.capacityPlanningEngine || p.executiveScalingDashboard || p.autonomousScalingFramework;
      case "scale":
        return p.capacityPlanningEngine || p.scalingDecisionEngine || p.autonomousScalingFramework;
      case "workload":
        return p.workforceIntelligence || p.capacityPlanningEngine || p.bottleneckIntelligence;
      case "resource":
        return (
          p.financialScaleEngine ||
          p.capacityPlanningEngine ||
          p.executiveScalingDashboard ||
          p.autonomousScalingFramework
        );
      case "overcapacity":
      case "undercapacity":
        return (
          p.capacityPlanningEngine ||
          p.bottleneckIntelligence ||
          p.executiveScalingDashboard ||
          p.autonomousScalingFramework
        );
      default:
        return true;
    }
  }

  private requireConnected(): OperationalElasticityEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Operational Elasticity Engine not connected — call connectOperationalElasticityEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: ElasticityRecord): void {
    const idx = this.elasticityRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.operationalComponent === record.operationalComponent,
    );
    if (idx >= 0) this.elasticityRecords[idx] = record;
    else this.elasticityRecords.push(record);
  }

  failReport(
    action: OeeRunReport["action"],
    errors: string[],
    durationMs: number,
  ): OeeRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "oee-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: OPERATIONAL_ELASTICITY_ENGINE_ID,
        engineVersion: "PILLOW-OEE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...OEE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: OEE_METADATA_VERSION,
      } satisfies OperationalElasticityEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `oee-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: OEE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: OperationalElasticityEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: ElasticityValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: OPERATIONAL_ELASTICITY_ENGINE_ID,
        moduleVersion: OEE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-11",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "elasticity.demand.monitored",
            "elasticity.utilization.monitored",
            "elasticity.capacity.adjusted",
            "elasticity.recommendation",
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
        OPERATIONAL_ELASTICITY_ENGINE_ID,
      );
    }

    appendOeeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Operational Elasticity Engine with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `oee-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: OEE_METADATA_VERSION,
      },
    };
  }

  connectOperationalElasticityEngine(
    _input: ConnectOperationalElasticityEngineInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
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
      engineRecordId: `oee-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: OPERATIONAL_ELASTICITY_ENGINE_ID,
      engineVersion: "PILLOW-OEE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 10
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...OEE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: OEE_METADATA_VERSION,
    };

    appendOeeLog({
      event: "engine_connected",
      level: "info",
      details:
        "Operational Elasticity Engine connected — never exceed validated operational limits; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never exceed validated operational limits",
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
    action: OeeRunReport["action"],
    label: string,
    operation: "demand" | "utilization" | "workload_balance" | "resource_optimization",
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
    logEvent: string,
    sourceKind: "demand" | "utilization" | "workload" | "resource",
  ): OeeRunReport {
    const started = Date.now();
    try {
      if (!config.monitoringRulesEnabled) {
        return this.failReport(action, ["Monitoring rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateElasticity(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = this.demandEngine.assess(
        operation,
        input,
        config,
        this.sourceAvailableFor(sourceKind),
      );
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendOeeLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.operationalComponent} · util=${record.currentUtilization} · adj=${record.scalingAdjustment}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        elasticityRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendOeeLog({ event: "elasticity_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorOperationalDemand(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
    return this.runMonitorOp(
      "monitor_operational_demand",
      "Operational demand monitoring",
      "demand",
      input,
      config,
      "elasticity_monitoring",
      "demand",
    );
  }

  monitorOperationalUtilization(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
    return this.runMonitorOp(
      "monitor_operational_utilization",
      "Operational utilization monitoring",
      "utilization",
      input,
      config,
      "elasticity_monitoring",
      "utilization",
    );
  }

  scaleCapacityUpward(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateElasticity(
        "Capacity scale-up",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport("scale_capacity_upward", validation.errors, Date.now() - started);
      }
      const record = this.capacityEngine.scaleUp(
        input,
        config,
        this.sourceAvailableFor("scale"),
      );
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      appendOeeLog({
        event: "capacity_scale_up",
        level: "info",
        details: `Scaled upward · ${record.operationalComponent} · adj=${record.scalingAdjustment}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "scale_capacity_upward",
        engineRecord,
        elasticityRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendOeeLog({ event: "elasticity_failure", level: "error", details: message });
      return this.failReport("scale_capacity_upward", [message], Date.now() - started);
    }
  }

  scaleCapacityDownward(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateElasticity(
        "Capacity scale-down",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "scale_capacity_downward",
          validation.errors,
          Date.now() - started,
        );
      }
      const record = this.capacityEngine.scaleDown(
        input,
        config,
        this.sourceAvailableFor("scale"),
      );
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      appendOeeLog({
        event: "capacity_scale_down",
        level: "info",
        details: `Scaled downward · ${record.operationalComponent} · adj=${record.scalingAdjustment}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "scale_capacity_downward",
        engineRecord,
        elasticityRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendOeeLog({ event: "elasticity_failure", level: "error", details: message });
      return this.failReport("scale_capacity_downward", [message], Date.now() - started);
    }
  }

  balanceWorkloadsDynamically(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateElasticity(
        "Dynamic workload balancing",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "balance_workloads_dynamically",
          validation.errors,
          Date.now() - started,
        );
      }
      if (this.elasticityRecords.length === 0) {
        this.storeRecord(
          this.demandEngine.assess(
            "workload_balance",
            input,
            config,
            this.sourceAvailableFor("workload"),
          ),
        );
      }
      const balanced = this.workloadEngine.balance(this.elasticityRecords, config);
      for (const r of balanced) this.storeRecord(r);
      engineRecord.currentOperationalState = "active";
      appendOeeLog({
        event: "workload_balancing",
        level: "info",
        details: `Balanced ${balanced.length || this.elasticityRecords.length} workload elasticity records`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "balance_workloads_dynamically",
        engineRecord,
        elasticityRecords: balanced.length > 0 ? balanced : this.elasticityRecords,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendOeeLog({ event: "elasticity_failure", level: "error", details: message });
      return this.failReport("balance_workloads_dynamically", [message], Date.now() - started);
    }
  }

  optimizeResourceUtilization(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateElasticity(
        "Resource utilization optimization",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "optimize_resource_utilization",
          validation.errors,
          Date.now() - started,
        );
      }
      if (this.elasticityRecords.length === 0) {
        this.storeRecord(
          this.demandEngine.assess(
            "resource_optimization",
            input,
            config,
            this.sourceAvailableFor("resource"),
          ),
        );
      }
      const optimized = this.resourceEngine.optimize(this.elasticityRecords, config);
      for (const r of optimized) this.storeRecord(r);
      engineRecord.currentOperationalState = "active";
      appendOeeLog({
        event: "resource_optimization",
        level: "info",
        details: `Optimized ${optimized.length} elasticity resource records`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "optimize_resource_utilization",
        engineRecord,
        elasticityRecords: optimized.length > 0 ? optimized : this.elasticityRecords,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendOeeLog({ event: "elasticity_failure", level: "error", details: message });
      return this.failReport("optimize_resource_utilization", [message], Date.now() - started);
    }
  }

  detectOvercapacity(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateElasticity(
        "Overcapacity detection",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport("detect_overcapacity", validation.errors, Date.now() - started);
      }
      const record = this.capacityEngine.detectOvercapacity(
        input,
        config,
        this.sourceAvailableFor("overcapacity"),
      );
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      appendOeeLog({
        event: "overcapacity_detection",
        level: "info",
        details: `Detected overcapacity · util=${record.currentUtilization} · adj=${record.scalingAdjustment}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_overcapacity",
        engineRecord,
        elasticityRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendOeeLog({ event: "elasticity_failure", level: "error", details: message });
      return this.failReport("detect_overcapacity", [message], Date.now() - started);
    }
  }

  detectUndercapacity(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateElasticity(
        "Undercapacity detection",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport("detect_undercapacity", validation.errors, Date.now() - started);
      }
      const record = this.capacityEngine.detectUndercapacity(
        input,
        config,
        this.sourceAvailableFor("undercapacity"),
      );
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      appendOeeLog({
        event: "undercapacity_detection",
        level: "info",
        details: `Detected undercapacity · util=${record.currentUtilization} · adj=${record.scalingAdjustment}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_undercapacity",
        engineRecord,
        elasticityRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendOeeLog({ event: "elasticity_failure", level: "error", details: message });
      return this.failReport("detect_undercapacity", [message], Date.now() - started);
    }
  }

  recommendElasticityActions(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled) {
        return this.failReport(
          "recommend_elasticity_actions",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateElasticity(
        "Elasticity action recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "recommend_elasticity_actions",
          validation.errors,
          Date.now() - started,
        );
      }
      this.recommendations = this.recommendationEngine.generate(this.elasticityRecords, config);
      engineRecord.currentOperationalState = "active";
      appendOeeLog({
        event: "elasticity_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} elasticity recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_elasticity_actions",
        engineRecord,
        elasticityRecords: this.elasticityRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendOeeLog({ event: "elasticity_failure", level: "error", details: message });
      return this.failReport("recommend_elasticity_actions", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunOeeDiagnosticsInput,
    config: OperationalElasticityEngineConfiguration,
  ): OeeRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `oee-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: OPERATIONAL_ELASTICITY_ENGINE_ID,
        engineVersion: "PILLOW-OEE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...OEE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: OEE_METADATA_VERSION,
      } satisfies OperationalElasticityEngineRecord);

    appendOeeLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.elasticityRecords.length} · highUtil=${this.highUtilizationCount(config)} · avgUtil=${this.averageUtilization()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      elasticityRecords: this.elasticityRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
