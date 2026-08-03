/** X3-08 — Workforce Intelligence Manager. */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";
import type { ScalingDecisionEngine } from "../scaling-decision-engine/engine.js";
import type { CapacityPlanningEngine } from "../capacity-planning-engine/engine.js";
import type { MarketingScaleEngine } from "../marketing-scale-engine/engine.js";
import type { SupplierScaleEngine } from "../supplier-scale-engine/engine.js";
import type { FinancialScaleEngine } from "../financial-scale-engine/engine.js";
import {
  WORKFORCE_INTELLIGENCE_ID,
  WFI_CAPABILITIES,
  WFI_METADATA_VERSION,
} from "./paths.js";
import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import { appendWfiLog } from "./wfi-logging.js";
import { WorkforceCapacityEngine } from "./workforce-capacity-engine.js";
import { AgentUtilizationEngine } from "./agent-utilization-engine.js";
import { WorkloadDistributionEngine } from "./workload-distribution-engine.js";
import { WorkforceAnalyticsEngine } from "./workforce-analytics-engine.js";
import { WorkforceRecommendationEngine } from "./workforce-recommendation-engine.js";
import { WorkforceMetadataGenerator } from "./workforce-metadata-generator.js";
import { WorkforceValidator } from "./workforce-validator.js";
import type {
  ConnectWorkforceIntelligenceInput,
  WorkforceRecommendation,
  WorkforceIntelligenceEngineRecord,
  WorkforceIntelligenceInput,
  WorkforceRecord,
  WorkforceValidationReport,
  WfiRunReport,
  RunWfiDiagnosticsInput,
} from "./types.js";

export type WorkforceIntelligenceDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
  winningProductDetector?: WinningProductDetectorEngine | null;
  scalingDecisionEngine?: ScalingDecisionEngine | null;
  capacityPlanningEngine?: CapacityPlanningEngine | null;
  marketingScaleEngine?: MarketingScaleEngine | null;
  supplierScaleEngine?: SupplierScaleEngine | null;
  financialScaleEngine?: FinancialScaleEngine | null;
};

export class WorkforceIntelligenceManager {
  private engineRecord: WorkforceIntelligenceEngineRecord | null = null;
  private workforceRecords: WorkforceRecord[] = [];
  private recommendations: WorkforceRecommendation[] = [];

  private readonly capacityEngine = new WorkforceCapacityEngine();
  private readonly utilizationEngine = new AgentUtilizationEngine();
  private readonly distributionEngine = new WorkloadDistributionEngine();
  private readonly analyticsEngine = new WorkforceAnalyticsEngine();
  private readonly recommendationEngine = new WorkforceRecommendationEngine();
  private readonly metadataGenerator = new WorkforceMetadataGenerator();
  private readonly validator = new WorkforceValidator();

  constructor(private readonly deps: WorkforceIntelligenceDependencies = {}) {}

  getEngineRecord(): WorkforceIntelligenceEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getWorkforceRecords(): WorkforceRecord[] {
    return this.workforceRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): WorkforceRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  bottleneckCount(): number {
    return this.workforceRecords.filter((r) =>
      /bottleneck|critical|do not overload|hold|underutilized/i.test(r.recommendationSummary),
    ).length;
  }

  averageEfficiency(): number {
    if (this.workforceRecords.length === 0) return 0;
    const sum = this.workforceRecords.reduce(
      (acc, r) => acc + r.workforceEfficiencyScore,
      0,
    );
    return Math.round(sum / this.workforceRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.workforceRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): WorkforceIntelligenceEngineRecord["dependencyPresence"] {
    return {
      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),
      winningProductDetector: Boolean(this.deps.winningProductDetector),
      scalingDecisionEngine: Boolean(this.deps.scalingDecisionEngine),
      capacityPlanningEngine: Boolean(this.deps.capacityPlanningEngine),
      marketingScaleEngine: Boolean(this.deps.marketingScaleEngine),
      supplierScaleEngine: Boolean(this.deps.supplierScaleEngine),
      financialScaleEngine: Boolean(this.deps.financialScaleEngine),
    };
  }

  private requireConnected(): WorkforceIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Workforce Intelligence not connected — call connectWorkforceIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: WorkforceRecord): void {
    const idx = this.workforceRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.workforceReference === record.workforceReference,
    );
    if (idx >= 0) this.workforceRecords[idx] = record;
    else this.workforceRecords.push(record);
  }

  failReport(
    action: WfiRunReport["action"],
    errors: string[],
    durationMs: number,
  ): WfiRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "wfi-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: WORKFORCE_INTELLIGENCE_ID,
        engineVersion: "PILLOW-WFI-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...WFI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: WFI_METADATA_VERSION,
      } satisfies WorkforceIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `wfi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: WFI_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: WorkforceIntelligenceConfiguration): {
    frameworkModuleId: string | null;
    validation: WorkforceValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: WORKFORCE_INTELLIGENCE_ID,
        moduleVersion: WFI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-08",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "workforce.monitored",
            "workforce.underutilized.detected",
            "workforce.bottleneck.detected",
            "workforce.optimization.recommended",
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
      this.deps.autonomousScalingFramework.activateScalingModule(WORKFORCE_INTELLIGENCE_ID);
    }

    appendWfiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Workforce Intelligence with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `wfi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: WFI_METADATA_VERSION,
      },
    };
  }

  connectWorkforceIntelligence(
    _input: ConnectWorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
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
      engineRecordId: `wfi-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: WORKFORCE_INTELLIGENCE_ID,
      engineVersion: "PILLOW-WFI-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 7
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...WFI_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: WFI_METADATA_VERSION,
    };

    appendWfiLog({
      event: "engine_connected",
      level: "info",
      details:
        "Workforce Intelligence connected — never overload workforce beyond validated limits; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never overload AI workforce beyond validated limits",
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
    action: WfiRunReport["action"],
    label: string,
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
    produce: () => WorkforceRecord,
    logEvent: string,
  ): WfiRunReport {
    const started = Date.now();
    try {
      if (!config.monitoringRulesEnabled && action.startsWith("monitor_")) {
        return this.failReport(action, ["Monitoring rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateWorkforce(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendWfiLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.workforceReference} · efficiency=${record.workforceEfficiencyScore} · utilization=${record.agentUtilization} · throughput=${record.throughputMetrics}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        workforceRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendWfiLog({ event: "workforce_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorWorkforceCapacity(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
    return this.runMonitorOp(
      "monitor_workforce_capacity",
      "Workforce capacity monitoring",
      input,
      config,
      () => {
        if (!config.capacityEvaluationRulesEnabled) {
          throw new Error("Capacity evaluation rules disabled");
        }
        return this.capacityEngine.assess(input, config);
      },
      "workforce_monitoring",
    );
  }

  monitorAgentUtilization(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
    return this.runMonitorOp(
      "monitor_agent_utilization",
      "Agent utilization monitoring",
      input,
      config,
      () => this.utilizationEngine.assess(input, config),
      "workforce_monitoring",
    );
  }

  monitorWorkloadDistribution(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
    return this.runMonitorOp(
      "monitor_workload_distribution",
      "Workload distribution monitoring",
      input,
      config,
      () => this.distributionEngine.assess(input, config),
      "workforce_monitoring",
    );
  }

  monitorExecutionThroughput(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
    return this.runMonitorOp(
      "monitor_execution_throughput",
      "Execution throughput monitoring",
      input,
      config,
      () => this.analyticsEngine.assess(input, config, "throughput"),
      "workforce_monitoring",
    );
  }

  monitorTaskCompletion(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
    return this.runMonitorOp(
      "monitor_task_completion",
      "Task completion monitoring",
      input,
      config,
      () => this.analyticsEngine.assess(input, config, "task_completion"),
      "workforce_monitoring",
    );
  }

  monitorWorkforceEfficiency(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
    return this.runMonitorOp(
      "monitor_workforce_efficiency",
      "Workforce efficiency monitoring",
      input,
      config,
      () => this.analyticsEngine.assess(input, config, "efficiency"),
      "workforce_monitoring",
    );
  }

  detectWorkforceBottlenecks(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateWorkforce("Bottleneck detection", input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "detect_workforce_bottlenecks",
          validation.errors,
          Date.now() - started,
        );
      }
      if (this.workforceRecords.length === 0) {
        this.storeRecord(this.capacityEngine.assess(input, config));
      }
      const bottlenecks = this.analyticsEngine.detectBottlenecks(this.workforceRecords, config);
      for (const b of bottlenecks) this.storeRecord(b);
      engineRecord.currentOperationalState = "active";
      appendWfiLog({
        event: "bottleneck_detection",
        level: "info",
        details: `Detected ${bottlenecks.length} workforce bottlenecks`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_workforce_bottlenecks",
        engineRecord,
        workforceRecords: bottlenecks.length > 0 ? bottlenecks : this.workforceRecords,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendWfiLog({ event: "workforce_failure", level: "error", details: message });
      return this.failReport("detect_workforce_bottlenecks", [message], Date.now() - started);
    }
  }

  detectUnderutilizedAgents(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
    const started = Date.now();
    try {
      if (!config.utilizationThresholdsEnabled) {
        return this.failReport(
          "detect_underutilized_agents",
          ["Utilization thresholds disabled"],
          Date.now() - started,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateWorkforce(
        "Underutilized agent detection",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "detect_underutilized_agents",
          validation.errors,
          Date.now() - started,
        );
      }
      if (this.workforceRecords.length === 0) {
        this.storeRecord(this.capacityEngine.assess(input, config));
      }
      const underutilized = this.analyticsEngine.detectUnderutilized(
        this.workforceRecords,
        config,
      );
      engineRecord.currentOperationalState = "active";
      appendWfiLog({
        event: "underutilized_detection",
        level: "info",
        details: `Detected ${underutilized.length} underutilized agent signals`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_underutilized_agents",
        engineRecord,
        workforceRecords: underutilized.length > 0 ? underutilized : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendWfiLog({ event: "workforce_failure", level: "error", details: message });
      return this.failReport("detect_underutilized_agents", [message], Date.now() - started);
    }
  }

  recommendWorkforceOptimization(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled && !config.workforceOptimizationRulesEnabled) {
        return this.failReport(
          "recommend_workforce_optimization",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateWorkforce(
        "Workforce optimization recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "recommend_workforce_optimization",
          validation.errors,
          Date.now() - started,
        );
      }
      this.recommendations = this.recommendationEngine.generate(this.workforceRecords, config);
      engineRecord.currentOperationalState = "active";
      appendWfiLog({
        event: "workforce_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} workforce optimization recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_workforce_optimization",
        engineRecord,
        workforceRecords: this.workforceRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendWfiLog({ event: "workforce_failure", level: "error", details: message });
      return this.failReport("recommend_workforce_optimization", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunWfiDiagnosticsInput,
    config: WorkforceIntelligenceConfiguration,
  ): WfiRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `wfi-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: WORKFORCE_INTELLIGENCE_ID,
        engineVersion: "PILLOW-WFI-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...WFI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: WFI_METADATA_VERSION,
      } satisfies WorkforceIntelligenceEngineRecord);

    appendWfiLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.workforceRecords.length} · bottlenecks=${this.bottleneckCount()} · avgEfficiency=${this.averageEfficiency()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      workforceRecords: this.workforceRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
