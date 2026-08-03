/** X3-04 — Capacity Planning Manager. */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";
import type { ScalingDecisionEngine } from "../scaling-decision-engine/engine.js";
import {
  CAPACITY_PLANNING_ENGINE_ID,
  CPE_CAPABILITIES,
  CPE_METADATA_VERSION,
} from "./paths.js";
import type { CapacityPlanningEngineConfiguration } from "./configuration.js";
import { appendCpeLog } from "./cpe-logging.js";
import { CapacityAssessmentEngine } from "./capacity-assessment-engine.js";
import { InfrastructureCapacityEngine } from "./infrastructure-capacity-engine.js";
import { SupplierCapacityEngine } from "./supplier-capacity-engine.js";
import { CapacityForecastEngine } from "./capacity-forecast-engine.js";
import { BottleneckDetectionEngine } from "./bottleneck-detection-engine.js";
import { CapacityRecommendationEngine } from "./capacity-recommendation-engine.js";
import { CapacityMetadataGenerator } from "./capacity-metadata-generator.js";
import { CapacityValidator } from "./capacity-validator.js";
import { buildCapacityRecord, computeDomainSignals } from "./structural-signals.js";
import type {
  CapacityDomain,
  CapacityPlanningEngineRecord,
  CapacityPlanningInput,
  CapacityPlanningRecord,
  CapacityRecommendation,
  CapacityValidationReport,
  ConnectCapacityPlanningEngineInput,
  CpeRunReport,
  RunCpeDiagnosticsInput,
} from "./types.js";

export type CapacityPlanningEngineDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
  winningProductDetector?: WinningProductDetectorEngine | null;
  scalingDecisionEngine?: ScalingDecisionEngine | null;
};

export class CapacityPlanningManager {
  private engineRecord: CapacityPlanningEngineRecord | null = null;
  private planningRecords: CapacityPlanningRecord[] = [];
  private recommendations: CapacityRecommendation[] = [];

  private readonly assessmentEngine = new CapacityAssessmentEngine();
  private readonly infrastructureEngine = new InfrastructureCapacityEngine();
  private readonly supplierEngine = new SupplierCapacityEngine();
  private readonly forecastEngine = new CapacityForecastEngine();
  private readonly bottleneckEngine = new BottleneckDetectionEngine();
  private readonly recommendationEngine = new CapacityRecommendationEngine();
  private readonly metadataGenerator = new CapacityMetadataGenerator();
  private readonly validator = new CapacityValidator();

  constructor(private readonly deps: CapacityPlanningEngineDependencies = {}) {}

  getEngineRecord(): CapacityPlanningEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getPlanningRecords(): CapacityPlanningRecord[] {
    return this.planningRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): CapacityRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  bottleneckCount(): number {
    return this.planningRecords.filter((r) =>
      /bottleneck|critical/i.test(r.bottleneckSummary),
    ).length;
  }

  averageUtilization(): number {
    if (this.planningRecords.length === 0) return 0;
    const sum = this.planningRecords.reduce((acc, r) => acc + r.capacityUtilization, 0);
    return Math.round(sum / this.planningRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.planningRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): CapacityPlanningEngineRecord["dependencyPresence"] {
    return {
      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),
      winningProductDetector: Boolean(this.deps.winningProductDetector),
      scalingDecisionEngine: Boolean(this.deps.scalingDecisionEngine),
    };
  }

  private requireConnected(): CapacityPlanningEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Capacity Planning Engine not connected — call connectCapacityPlanningEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: CapacityPlanningRecord): void {
    const idx = this.planningRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.productReference === record.productReference &&
        r.domain === record.domain,
    );
    if (idx >= 0) this.planningRecords[idx] = record;
    else this.planningRecords.push(record);
  }

  failReport(
    action: CpeRunReport["action"],
    errors: string[],
    durationMs: number,
  ): CpeRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "cpe-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: CAPACITY_PLANNING_ENGINE_ID,
        engineVersion: "PILLOW-CPE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...CPE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: CPE_METADATA_VERSION,
      } satisfies CapacityPlanningEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `cpe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: CPE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: CapacityPlanningEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: CapacityValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: CAPACITY_PLANNING_ENGINE_ID,
        moduleVersion: CPE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-04",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "capacity.monitored",
            "capacity.forecasted",
            "capacity.bottleneck.detected",
            "capacity.expansion.recommended",
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
      this.deps.autonomousScalingFramework.activateScalingModule(CAPACITY_PLANNING_ENGINE_ID);
    }

    appendCpeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Capacity Planning Engine with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `cpe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CPE_METADATA_VERSION,
      },
    };
  }

  connectCapacityPlanningEngine(
    _input: ConnectCapacityPlanningEngineInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
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
      engineRecordId: `cpe-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CAPACITY_PLANNING_ENGINE_ID,
      engineVersion: "PILLOW-CPE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 3
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...CPE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: CPE_METADATA_VERSION,
    };

    appendCpeLog({
      event: "engine_connected",
      level: "info",
      details:
        "Capacity Planning Engine connected — never recommend beyond validated limits; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never recommend beyond validated capacity limits",
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

  private runDomainOp(
    action: CpeRunReport["action"],
    label: string,
    domain: CapacityDomain,
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
    produce: () => CapacityPlanningRecord,
    logEvent: string,
  ): CpeRunReport {
    const started = Date.now();
    try {
      if (!config.monitoringRulesEnabled && action.startsWith("monitor_")) {
        return this.failReport(action, ["Monitoring rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePlanning(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendCpeLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${domain} · ${record.productReference} · util=${record.capacityUtilization}%`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        planningRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCpeLog({ event: "planning_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorOperationalCapacity(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
    return this.runDomainOp(
      "monitor_operational",
      "Operational capacity monitoring",
      "operational",
      input,
      config,
      () => this.assessmentEngine.assess(input, config),
      "capacity_monitoring",
    );
  }

  monitorInfrastructureCapacity(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
    return this.runDomainOp(
      "monitor_infrastructure",
      "Infrastructure capacity monitoring",
      "infrastructure",
      input,
      config,
      () => this.infrastructureEngine.assess(input, config),
      "capacity_monitoring",
    );
  }

  monitorSupplierCapacity(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
    return this.runDomainOp(
      "monitor_supplier",
      "Supplier capacity monitoring",
      "supplier",
      input,
      config,
      () => this.supplierEngine.assess(input, config),
      "capacity_monitoring",
    );
  }

  monitorFulfilmentCapacity(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
    return this.runDomainOp(
      "monitor_fulfilment",
      "Fulfilment capacity monitoring",
      "fulfilment",
      input,
      config,
      () => {
        const signals = computeDomainSignals("fulfilment", input, config);
        return buildCapacityRecord({ ...signals, domain: "fulfilment", config });
      },
      "capacity_monitoring",
    );
  }

  monitorInventoryCapacity(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
    return this.runDomainOp(
      "monitor_inventory",
      "Inventory capacity monitoring",
      "inventory",
      input,
      config,
      () => {
        const signals = computeDomainSignals("inventory", input, config);
        return buildCapacityRecord({ ...signals, domain: "inventory", config });
      },
      "capacity_monitoring",
    );
  }

  monitorWorkforceCapacity(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
    return this.runDomainOp(
      "monitor_workforce",
      "Workforce capacity monitoring",
      "workforce",
      input,
      config,
      () => {
        const signals = computeDomainSignals("workforce", input, config);
        return buildCapacityRecord({ ...signals, domain: "workforce", config });
      },
      "capacity_monitoring",
    );
  }

  forecastCapacity(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
    const started = Date.now();
    try {
      if (!config.forecastingRulesEnabled) {
        return this.failReport("forecast", ["Forecasting rules disabled"], 0);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePlanning("Capacity forecast", input, config);
      if (validation.decision === "fail") {
        return this.failReport("forecast", validation.errors, Date.now() - started);
      }
      const record = this.forecastEngine.forecast(input, config);
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      appendCpeLog({
        event: "capacity_forecasting",
        level: "info",
        details: `Forecast · ${record.domain} · demand=${record.forecastDemand} · util=${record.capacityUtilization}%`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "forecast",
        engineRecord,
        planningRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCpeLog({ event: "planning_failure", level: "error", details: message });
      return this.failReport("forecast", [message], Date.now() - started);
    }
  }

  detectBottlenecks(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePlanning("Bottleneck detection", input, config);
      if (validation.decision === "fail") {
        return this.failReport("detect_bottlenecks", validation.errors, Date.now() - started);
      }
      if (this.planningRecords.length === 0) {
        this.storeRecord(this.assessmentEngine.assess(input, config));
      }
      const bottlenecks = this.bottleneckEngine.detect(this.planningRecords, config);
      for (const b of bottlenecks) this.storeRecord(b);
      engineRecord.currentOperationalState = "active";
      appendCpeLog({
        event: "bottleneck_detection",
        level: "info",
        details: `Detected ${bottlenecks.length} capacity bottlenecks`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_bottlenecks",
        engineRecord,
        planningRecords: bottlenecks.length > 0 ? bottlenecks : this.planningRecords,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCpeLog({ event: "planning_failure", level: "error", details: message });
      return this.failReport("detect_bottlenecks", [message], Date.now() - started);
    }
  }

  recommendExpansion(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled) {
        return this.failReport("recommend_expansion", ["Recommendation rules disabled"], 0);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePlanning(
        "Capacity expansion recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport("recommend_expansion", validation.errors, Date.now() - started);
      }
      this.recommendations = this.recommendationEngine.generate(this.planningRecords);
      engineRecord.currentOperationalState = "active";
      appendCpeLog({
        event: "capacity_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} capacity expansion recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_expansion",
        engineRecord,
        planningRecords: this.planningRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCpeLog({ event: "planning_failure", level: "error", details: message });
      return this.failReport("recommend_expansion", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunCpeDiagnosticsInput,
    config: CapacityPlanningEngineConfiguration,
  ): CpeRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `cpe-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: CAPACITY_PLANNING_ENGINE_ID,
        engineVersion: "PILLOW-CPE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...CPE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: CPE_METADATA_VERSION,
      } satisfies CapacityPlanningEngineRecord);

    appendCpeLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · plans=${this.planningRecords.length} · bottlenecks=${this.bottleneckCount()} · avgUtil=${this.averageUtilization()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      planningRecords: this.planningRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
