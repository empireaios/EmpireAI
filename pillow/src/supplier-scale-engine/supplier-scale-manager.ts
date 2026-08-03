/** X3-06 — Supplier Scale Manager. */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";
import type { ScalingDecisionEngine } from "../scaling-decision-engine/engine.js";
import type { CapacityPlanningEngine } from "../capacity-planning-engine/engine.js";
import type { MarketingScaleEngine } from "../marketing-scale-engine/engine.js";
import {
  SUPPLIER_SCALE_ENGINE_ID,
  SSE_CAPABILITIES,
  SSE_METADATA_VERSION,
} from "./paths.js";
import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import { appendSseLog } from "./sse-logging.js";
import { SupplierCapacityEngine } from "./supplier-capacity-engine.js";
import { SupplierPerformanceAnalyzer } from "./supplier-performance-analyzer.js";
import { SupplierInventoryEngine } from "./supplier-inventory-engine.js";
import { FulfilmentCapacityEngine } from "./fulfilment-capacity-engine.js";
import { SupplierBottleneckDetector } from "./supplier-bottleneck-detector.js";
import { SupplierRecommendationEngine } from "./supplier-recommendation-engine.js";
import { SupplierMetadataGenerator } from "./supplier-metadata-generator.js";
import { SupplierValidator } from "./supplier-validator.js";
import {
  buildSupplierScalingRecord,
  computeSupplierSignals,
} from "./structural-signals.js";
import type {
  ConnectSupplierScaleEngineInput,
  SupplierRecommendation,
  SupplierScaleEngineRecord,
  SupplierScaleInput,
  SupplierScalingRecord,
  SupplierValidationReport,
  SseRunReport,
  RunSseDiagnosticsInput,
} from "./types.js";

export type SupplierScaleEngineDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
  winningProductDetector?: WinningProductDetectorEngine | null;
  scalingDecisionEngine?: ScalingDecisionEngine | null;
  capacityPlanningEngine?: CapacityPlanningEngine | null;
  marketingScaleEngine?: MarketingScaleEngine | null;
};

export class SupplierScaleManager {
  private engineRecord: SupplierScaleEngineRecord | null = null;
  private scalingRecords: SupplierScalingRecord[] = [];
  private recommendations: SupplierRecommendation[] = [];

  private readonly capacityEngine = new SupplierCapacityEngine();
  private readonly performanceAnalyzer = new SupplierPerformanceAnalyzer();
  private readonly inventoryEngine = new SupplierInventoryEngine();
  private readonly fulfilmentEngine = new FulfilmentCapacityEngine();
  private readonly bottleneckDetector = new SupplierBottleneckDetector();
  private readonly recommendationEngine = new SupplierRecommendationEngine();
  private readonly metadataGenerator = new SupplierMetadataGenerator();
  private readonly validator = new SupplierValidator();

  constructor(private readonly deps: SupplierScaleEngineDependencies = {}) {}

  getEngineRecord(): SupplierScaleEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getScalingRecords(): SupplierScalingRecord[] {
    return this.scalingRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): SupplierRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  bottleneckCount(): number {
    return this.scalingRecords.filter((r) =>
      /bottleneck|critical|do not expand|hold/i.test(r.recommendationSummary),
    ).length;
  }

  averageReadiness(): number {
    if (this.scalingRecords.length === 0) return 0;
    const sum = this.scalingRecords.reduce((acc, r) => acc + r.fulfilmentReadiness, 0);
    return Math.round(sum / this.scalingRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.scalingRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): SupplierScaleEngineRecord["dependencyPresence"] {
    return {
      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),
      winningProductDetector: Boolean(this.deps.winningProductDetector),
      scalingDecisionEngine: Boolean(this.deps.scalingDecisionEngine),
      capacityPlanningEngine: Boolean(this.deps.capacityPlanningEngine),
      marketingScaleEngine: Boolean(this.deps.marketingScaleEngine),
    };
  }

  private requireConnected(): SupplierScaleEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Supplier Scale Engine not connected — call connectSupplierScaleEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: SupplierScalingRecord): void {
    const idx = this.scalingRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.supplierReference === record.supplierReference,
    );
    if (idx >= 0) this.scalingRecords[idx] = record;
    else this.scalingRecords.push(record);
  }

  failReport(
    action: SseRunReport["action"],
    errors: string[],
    durationMs: number,
  ): SseRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "sse-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: SUPPLIER_SCALE_ENGINE_ID,
        engineVersion: "PILLOW-SSE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...SSE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SSE_METADATA_VERSION,
      } satisfies SupplierScaleEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `sse-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: SSE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: SupplierScaleEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: SupplierValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: SUPPLIER_SCALE_ENGINE_ID,
        moduleVersion: SSE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-06",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "supplier.monitored",
            "supplier.scaling.risk.detected",
            "supplier.bottleneck.detected",
            "supplier.expansion.recommended",
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
      this.deps.autonomousScalingFramework.activateScalingModule(SUPPLIER_SCALE_ENGINE_ID);
    }

    appendSseLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Supplier Scale Engine with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `sse-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: SSE_METADATA_VERSION,
      },
    };
  }

  connectSupplierScaleEngine(
    _input: ConnectSupplierScaleEngineInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
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
      engineRecordId: `sse-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SUPPLIER_SCALE_ENGINE_ID,
      engineVersion: "PILLOW-SSE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 5
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...SSE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: SSE_METADATA_VERSION,
    };

    appendSseLog({
      event: "engine_connected",
      level: "info",
      details:
        "Supplier Scale Engine connected — never recommend supplier expansion without validated capacity; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never recommend supplier expansion without validated capacity",
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
    action: SseRunReport["action"],
    label: string,
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
    produce: () => SupplierScalingRecord,
    logEvent: string,
  ): SseRunReport {
    const started = Date.now();
    try {
      if (!config.monitoringRulesEnabled && action.startsWith("monitor_")) {
        return this.failReport(action, ["Monitoring rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateSupplier(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendSseLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.supplierReference} · readiness=${record.fulfilmentReadiness} · capacity=${record.capacityScore} · reliability=${record.reliabilityScore}`,
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
      appendSseLog({ event: "supplier_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorSupplierCapacity(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
    return this.runMonitorOp(
      "monitor_capacity",
      "Supplier capacity monitoring",
      input,
      config,
      () => {
        if (!config.capacityEvaluationRulesEnabled) {
          throw new Error("Capacity evaluation rules disabled");
        }
        return this.capacityEngine.assess(input, config);
      },
      "supplier_monitoring",
    );
  }

  monitorSupplierPerformance(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
    return this.runMonitorOp(
      "monitor_performance",
      "Supplier performance monitoring",
      input,
      config,
      () => this.performanceAnalyzer.assess(input, config),
      "supplier_monitoring",
    );
  }

  monitorLeadTimes(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
    return this.runMonitorOp(
      "monitor_lead_times",
      "Supplier lead time monitoring",
      input,
      config,
      () => this.inventoryEngine.assess(input, config, "lead_time"),
      "supplier_monitoring",
    );
  }

  monitorInventory(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
    return this.runMonitorOp(
      "monitor_inventory",
      "Supplier inventory monitoring",
      input,
      config,
      () => this.inventoryEngine.assess(input, config, "inventory"),
      "supplier_monitoring",
    );
  }

  monitorFulfilment(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
    return this.runMonitorOp(
      "monitor_fulfilment",
      "Fulfilment performance monitoring",
      input,
      config,
      () => this.fulfilmentEngine.assess(input, config),
      "supplier_monitoring",
    );
  }

  monitorReliability(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
    return this.runMonitorOp(
      "monitor_reliability",
      "Supplier reliability monitoring",
      input,
      config,
      () => {
        const signals = computeSupplierSignals("reliability", input, config);
        return buildSupplierScalingRecord({
          ...signals,
          recommendationSummary: `Reliability ${signals.reliabilityScore} · ${signals.recommendationSummary}`,
          config,
        });
      },
      "supplier_monitoring",
    );
  }

  detectSupplierBottlenecks(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateSupplier("Bottleneck detection", input, config);
      if (validation.decision === "fail") {
        return this.failReport("detect_bottlenecks", validation.errors, Date.now() - started);
      }
      if (this.scalingRecords.length === 0) {
        this.storeRecord(this.capacityEngine.assess(input, config));
      }
      const bottlenecks = this.bottleneckDetector.detect(this.scalingRecords, config);
      for (const b of bottlenecks) this.storeRecord(b);
      engineRecord.currentOperationalState = "active";
      appendSseLog({
        event: "bottleneck_detection",
        level: "info",
        details: `Detected ${bottlenecks.length} supplier bottlenecks`,
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
      appendSseLog({ event: "supplier_failure", level: "error", details: message });
      return this.failReport("detect_bottlenecks", [message], Date.now() - started);
    }
  }

  detectScalingRisks(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
    const started = Date.now();
    try {
      if (!config.scalingThresholdsEnabled) {
        return this.failReport(
          "detect_scaling_risks",
          ["Scaling thresholds disabled"],
          Date.now() - started,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateSupplier(
        "Supplier scaling risk detection",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "detect_scaling_risks",
          validation.errors,
          Date.now() - started,
        );
      }
      if (this.scalingRecords.length === 0) {
        this.storeRecord(this.capacityEngine.assess(input, config));
      }
      const risks = this.scalingRecords.filter(
        (r) =>
          r.capacityScore < config.minCapacityScore ||
          r.reliabilityScore < config.minReliabilityScore ||
          r.fulfilmentReadiness < config.minFulfilmentReadiness ||
          r.capacityScore < config.bottleneckThreshold ||
          r.reliabilityScore < config.bottleneckThreshold,
      );
      engineRecord.currentOperationalState = "active";
      appendSseLog({
        event: "scaling_risk_detection",
        level: "info",
        details: `Detected ${risks.length} supplier scaling risks`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_scaling_risks",
        engineRecord,
        scalingRecords: risks.length > 0 ? risks : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSseLog({ event: "supplier_failure", level: "error", details: message });
      return this.failReport("detect_scaling_risks", [message], Date.now() - started);
    }
  }

  recommendSupplierExpansion(
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled && !config.supplierOptimizationRulesEnabled) {
        return this.failReport("recommend_expansion", ["Recommendation rules disabled"], 0);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateSupplier(
        "Supplier expansion recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport("recommend_expansion", validation.errors, Date.now() - started);
      }
      this.recommendations = this.recommendationEngine.generate(this.scalingRecords, config);
      engineRecord.currentOperationalState = "active";
      appendSseLog({
        event: "supplier_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} supplier expansion recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_expansion",
        engineRecord,
        scalingRecords: this.scalingRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSseLog({ event: "supplier_failure", level: "error", details: message });
      return this.failReport("recommend_expansion", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunSseDiagnosticsInput,
    config: SupplierScaleEngineConfiguration,
  ): SseRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `sse-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: SUPPLIER_SCALE_ENGINE_ID,
        engineVersion: "PILLOW-SSE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...SSE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SSE_METADATA_VERSION,
      } satisfies SupplierScaleEngineRecord);

    appendSseLog({
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
