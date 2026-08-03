/** X3-12 — Performance Preservation Engine Manager. */

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
import {
  PERFORMANCE_PRESERVATION_ENGINE_ID,
  PPE_CAPABILITIES,
  PPE_METADATA_VERSION,
} from "./paths.js";
import type { PerformancePreservationEngineConfiguration } from "./configuration.js";
import { appendPpeLog } from "./ppe-logging.js";
import { QualityMonitoringEngine } from "./quality-monitoring-engine.js";
import { CustomerExperienceEngine } from "./customer-experience-engine.js";
import { PerformanceAnalysisEngine } from "./performance-analysis-engine.js";
import { DegradationDetectionEngine } from "./degradation-detection-engine.js";
import { PreservationRecommendationEngine } from "./preservation-recommendation-engine.js";
import { PreservationMetadataGenerator } from "./preservation-metadata-generator.js";
import { PreservationValidator } from "./preservation-validator.js";
import type {
  PreservationRecommendation,
  PerformancePreservationEngineRecord,
  PerformancePreservationInput,
  PreservationRecord,
  PreservationValidationReport,
  PpeRunReport,
  ConnectPerformancePreservationEngineInput,
  RunPpeDiagnosticsInput,
} from "./types.js";

export type PerformancePreservationEngineDependencies = {
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
};

export class PerformancePreservationManager {
  private engineRecord: PerformancePreservationEngineRecord | null = null;
  private preservationRecords: PreservationRecord[] = [];
  private recommendations: PreservationRecommendation[] = [];

  private readonly qualityEngine = new QualityMonitoringEngine();
  private readonly cxEngine = new CustomerExperienceEngine();
  private readonly performanceEngine = new PerformanceAnalysisEngine();
  private readonly degradationEngine = new DegradationDetectionEngine();
  private readonly recommendationEngine = new PreservationRecommendationEngine();
  private readonly metadataGenerator = new PreservationMetadataGenerator();
  private readonly validator = new PreservationValidator();

  constructor(private readonly deps: PerformancePreservationEngineDependencies = {}) {}

  getEngineRecord(): PerformancePreservationEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getPreservationRecords(): PreservationRecord[] {
    return this.preservationRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): PreservationRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  degradationCount(config?: PerformancePreservationEngineConfiguration): number {
    const threshold = config?.lowQualityThreshold ?? 55;
    return this.preservationRecords.filter(
      (r) => r.detectedDegradation || r.qualityScore <= threshold,
    ).length;
  }

  averageQualityScore(): number {
    if (this.preservationRecords.length === 0) return 0;
    const sum = this.preservationRecords.reduce((acc, r) => acc + r.qualityScore, 0);
    return Math.round(sum / this.preservationRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.preservationRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): PerformancePreservationEngineRecord["dependencyPresence"] {
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
    };
  }

  private sourceAvailableFor(
    kind:
      | "service_quality"
      | "customer_experience"
      | "operational_performance"
      | "response_time"
      | "fulfilment_quality"
      | "reliability"
      | "performance_degradation"
      | "quality_regression",
  ): boolean {
    const p = this.dependencyPresence();
    switch (kind) {
      case "service_quality":
      case "fulfilment_quality":
        return (
          p.supplierScaleEngine ||
          p.marketingScaleEngine ||
          p.winningProductDetector ||
          p.autonomousScalingFramework
        );
      case "customer_experience":
        return (
          p.marketingScaleEngine ||
          p.executiveScalingDashboard ||
          p.winningProductDetector ||
          p.autonomousScalingFramework
        );
      case "operational_performance":
      case "response_time":
      case "reliability":
        return (
          p.capacityPlanningEngine ||
          p.operationalElasticityEngine ||
          p.bottleneckIntelligence ||
          p.autonomousScalingFramework
        );
      case "performance_degradation":
      case "quality_regression":
        return (
          p.bottleneckIntelligence ||
          p.operationalElasticityEngine ||
          p.executiveScalingDashboard ||
          p.autonomousScalingFramework
        );
      default:
        return true;
    }
  }

  private requireConnected(): PerformancePreservationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Performance Preservation Engine not connected — call connectPerformancePreservationEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: PreservationRecord): void {
    const idx = this.preservationRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.operationalComponent === record.operationalComponent,
    );
    if (idx >= 0) this.preservationRecords[idx] = record;
    else this.preservationRecords.push(record);
  }

  failReport(
    action: PpeRunReport["action"],
    errors: string[],
    durationMs: number,
  ): PpeRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "ppe-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: PERFORMANCE_PRESERVATION_ENGINE_ID,
        engineVersion: "PILLOW-PPE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...PPE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: PPE_METADATA_VERSION,
      } satisfies PerformancePreservationEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `ppe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: PPE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: PerformancePreservationEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: PreservationValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: PERFORMANCE_PRESERVATION_ENGINE_ID,
        moduleVersion: PPE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-12",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "preservation.quality.monitored",
            "preservation.cx.monitored",
            "preservation.degradation.detected",
            "preservation.recommendation",
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
        PERFORMANCE_PRESERVATION_ENGINE_ID,
      );
    }

    appendPpeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Performance Preservation Engine with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `ppe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PPE_METADATA_VERSION,
      },
    };
  }

  connectPerformancePreservationEngine(
    _input: ConnectPerformancePreservationEngineInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
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
      engineRecordId: `ppe-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PERFORMANCE_PRESERVATION_ENGINE_ID,
      engineVersion: "PILLOW-PPE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 11
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...PPE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: PPE_METADATA_VERSION,
    };

    appendPpeLog({
      event: "engine_connected",
      level: "info",
      details:
        "Performance Preservation Engine connected — never compromise customer experience for scaling; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never compromise customer experience for scaling",
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
    action: PpeRunReport["action"],
    label: string,
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
    logEvent: string,
    produce: () => PreservationRecord,
  ): PpeRunReport {
    const started = Date.now();
    try {
      if (!config.monitoringRulesEnabled) {
        return this.failReport(action, ["Monitoring rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePreservation(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendPpeLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.operationalComponent} · quality=${record.qualityScore} · cx=${record.customerExperienceScore} · degraded=${record.detectedDegradation}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        preservationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendPpeLog({ event: "preservation_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorServiceQuality(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
    return this.runMonitorOp(
      "monitor_service_quality",
      "Service quality monitoring",
      input,
      config,
      "preservation_monitoring",
      () =>
        this.qualityEngine.assess(
          "service_quality",
          input,
          config,
          this.sourceAvailableFor("service_quality"),
        ),
    );
  }

  monitorCustomerExperience(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
    return this.runMonitorOp(
      "monitor_customer_experience",
      "Customer experience monitoring",
      input,
      config,
      "preservation_monitoring",
      () =>
        this.cxEngine.monitor(
          input,
          config,
          this.sourceAvailableFor("customer_experience"),
        ),
    );
  }

  monitorOperationalPerformance(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
    return this.runMonitorOp(
      "monitor_operational_performance",
      "Operational performance monitoring",
      input,
      config,
      "preservation_monitoring",
      () =>
        this.performanceEngine.assess(
          "operational_performance",
          input,
          config,
          this.sourceAvailableFor("operational_performance"),
        ),
    );
  }

  monitorResponseTimes(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
    return this.runMonitorOp(
      "monitor_response_times",
      "Response time monitoring",
      input,
      config,
      "preservation_monitoring",
      () =>
        this.performanceEngine.assess(
          "response_time",
          input,
          config,
          this.sourceAvailableFor("response_time"),
        ),
    );
  }

  monitorFulfilmentQuality(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
    return this.runMonitorOp(
      "monitor_fulfilment_quality",
      "Fulfilment quality monitoring",
      input,
      config,
      "preservation_monitoring",
      () =>
        this.qualityEngine.assess(
          "fulfilment_quality",
          input,
          config,
          this.sourceAvailableFor("fulfilment_quality"),
        ),
    );
  }

  monitorReliability(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
    return this.runMonitorOp(
      "monitor_reliability",
      "Reliability monitoring",
      input,
      config,
      "preservation_monitoring",
      () =>
        this.performanceEngine.assess(
          "reliability",
          input,
          config,
          this.sourceAvailableFor("reliability"),
        ),
    );
  }

  detectPerformanceDegradation(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePreservation(
        "Performance degradation detection",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "detect_performance_degradation",
          validation.errors,
          Date.now() - started,
        );
      }
      const record = this.degradationEngine.detectPerformanceDegradation(
        input,
        config,
        this.sourceAvailableFor("performance_degradation"),
      );
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      appendPpeLog({
        event: "degradation_detection",
        level: "info",
        details: `Detected degradation · perf=${record.performanceScore} · degraded=${record.detectedDegradation}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_performance_degradation",
        engineRecord,
        preservationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendPpeLog({ event: "preservation_failure", level: "error", details: message });
      return this.failReport("detect_performance_degradation", [message], Date.now() - started);
    }
  }

  detectQualityRegressions(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePreservation(
        "Quality regression detection",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "detect_quality_regressions",
          validation.errors,
          Date.now() - started,
        );
      }
      const record = this.degradationEngine.detectQualityRegressions(
        input,
        config,
        this.sourceAvailableFor("quality_regression"),
      );
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      appendPpeLog({
        event: "quality_regression_detection",
        level: "info",
        details: `Detected quality regression · quality=${record.qualityScore} · degraded=${record.detectedDegradation}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_quality_regressions",
        engineRecord,
        preservationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendPpeLog({ event: "preservation_failure", level: "error", details: message });
      return this.failReport("detect_quality_regressions", [message], Date.now() - started);
    }
  }

  recommendPreservationActions(
    input: PerformancePreservationInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled) {
        return this.failReport(
          "recommend_preservation_actions",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePreservation(
        "Preservation action recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "recommend_preservation_actions",
          validation.errors,
          Date.now() - started,
        );
      }
      this.recommendations = this.recommendationEngine.generate(
        this.preservationRecords,
        config,
      );
      engineRecord.currentOperationalState = "active";
      appendPpeLog({
        event: "preservation_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} preservation recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_preservation_actions",
        engineRecord,
        preservationRecords: this.preservationRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendPpeLog({ event: "preservation_failure", level: "error", details: message });
      return this.failReport("recommend_preservation_actions", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunPpeDiagnosticsInput,
    config: PerformancePreservationEngineConfiguration,
  ): PpeRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `ppe-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: PERFORMANCE_PRESERVATION_ENGINE_ID,
        engineVersion: "PILLOW-PPE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...PPE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: PPE_METADATA_VERSION,
      } satisfies PerformancePreservationEngineRecord);

    appendPpeLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.preservationRecords.length} · degradations=${this.degradationCount(config)} · avgQuality=${this.averageQualityScore()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      preservationRecords: this.preservationRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
