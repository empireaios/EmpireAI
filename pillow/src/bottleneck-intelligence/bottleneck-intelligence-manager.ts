/** X3-10 — Bottleneck Intelligence Manager. */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";
import type { ScalingDecisionEngine } from "../scaling-decision-engine/engine.js";
import type { CapacityPlanningEngine } from "../capacity-planning-engine/engine.js";
import type { MarketingScaleEngine } from "../marketing-scale-engine/engine.js";
import type { SupplierScaleEngine } from "../supplier-scale-engine/engine.js";
import type { FinancialScaleEngine } from "../financial-scale-engine/engine.js";
import type { WorkforceIntelligenceEngine } from "../workforce-intelligence/engine.js";
import type { ExecutiveScalingDashboardEngine } from "../executive-scaling-dashboard/engine.js";
import {
  BOTTLENECK_INTELLIGENCE_ID,
  BNI_CAPABILITIES,
  BNI_METADATA_VERSION,
} from "./paths.js";
import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import { appendBniLog } from "./bni-logging.js";
import { BottleneckDetectionEngine } from "./bottleneck-detection-engine.js";
import { ThroughputAnalysisEngine } from "./throughput-analysis-engine.js";
import { ConstraintAnalysisEngine } from "./constraint-analysis-engine.js";
import { ImpactAssessmentEngine } from "./impact-assessment-engine.js";
import { ResolutionRecommendationEngine } from "./resolution-recommendation-engine.js";
import { BottleneckMetadataGenerator } from "./bottleneck-metadata-generator.js";
import { BottleneckValidator } from "./bottleneck-validator.js";
import type {
  BottleneckCategory,
  BottleneckRecommendation,
  BottleneckIntelligenceEngineRecord,
  BottleneckIntelligenceInput,
  BottleneckRecord,
  BottleneckValidationReport,
  BniRunReport,
  ConnectBottleneckIntelligenceInput,
  RunBniDiagnosticsInput,
} from "./types.js";

export type BottleneckIntelligenceDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
  winningProductDetector?: WinningProductDetectorEngine | null;
  scalingDecisionEngine?: ScalingDecisionEngine | null;
  capacityPlanningEngine?: CapacityPlanningEngine | null;
  marketingScaleEngine?: MarketingScaleEngine | null;
  supplierScaleEngine?: SupplierScaleEngine | null;
  financialScaleEngine?: FinancialScaleEngine | null;
  workforceIntelligence?: WorkforceIntelligenceEngine | null;
  executiveScalingDashboard?: ExecutiveScalingDashboardEngine | null;
};

export class BottleneckIntelligenceManager {
  private engineRecord: BottleneckIntelligenceEngineRecord | null = null;
  private bottleneckRecords: BottleneckRecord[] = [];
  private recommendations: BottleneckRecommendation[] = [];

  private readonly detectionEngine = new BottleneckDetectionEngine();
  private readonly throughputEngine = new ThroughputAnalysisEngine();
  private readonly constraintEngine = new ConstraintAnalysisEngine();
  private readonly impactEngine = new ImpactAssessmentEngine();
  private readonly recommendationEngine = new ResolutionRecommendationEngine();
  private readonly metadataGenerator = new BottleneckMetadataGenerator();
  private readonly validator = new BottleneckValidator();

  constructor(private readonly deps: BottleneckIntelligenceDependencies = {}) {}

  getEngineRecord(): BottleneckIntelligenceEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getBottleneckRecords(): BottleneckRecord[] {
    return this.bottleneckRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): BottleneckRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  highSeverityCount(config?: BottleneckIntelligenceConfiguration): number {
    const threshold = config?.highSeverityThreshold ?? 70;
    return this.bottleneckRecords.filter((r) => r.severityScore >= threshold).length;
  }

  averageImpact(): number {
    if (this.bottleneckRecords.length === 0) return 0;
    const sum = this.bottleneckRecords.reduce((acc, r) => acc + r.businessImpactScore, 0);
    return Math.round(sum / this.bottleneckRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.bottleneckRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): BottleneckIntelligenceEngineRecord["dependencyPresence"] {
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
    };
  }

  private sourceAvailableFor(category: BottleneckCategory): boolean {
    const p = this.dependencyPresence();
    switch (category) {
      case "operational":
        return p.capacityPlanningEngine || p.autonomousScalingFramework;
      case "infrastructure":
        return p.autonomousScalingFramework || p.scalingDecisionEngine;
      case "supplier":
        return p.supplierScaleEngine;
      case "marketing":
        return p.marketingScaleEngine;
      case "financial":
        return p.financialScaleEngine;
      case "workforce":
        return p.workforceIntelligence;
      case "throughput":
        return (
          p.capacityPlanningEngine ||
          p.workforceIntelligence ||
          p.executiveScalingDashboard ||
          p.autonomousScalingFramework
        );
      default:
        return true;
    }
  }

  private requireConnected(): BottleneckIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Bottleneck Intelligence not connected — call connectBottleneckIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: BottleneckRecord): void {
    const idx = this.bottleneckRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.bottleneckCategory === record.bottleneckCategory &&
        r.affectedComponent === record.affectedComponent,
    );
    if (idx >= 0) this.bottleneckRecords[idx] = record;
    else this.bottleneckRecords.push(record);
  }

  failReport(
    action: BniRunReport["action"],
    errors: string[],
    durationMs: number,
  ): BniRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "bni-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: BOTTLENECK_INTELLIGENCE_ID,
        engineVersion: "PILLOW-BNI-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...BNI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: BNI_METADATA_VERSION,
      } satisfies BottleneckIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `bni-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: BNI_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: BottleneckIntelligenceConfiguration): {
    frameworkModuleId: string | null;
    validation: BottleneckValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: BOTTLENECK_INTELLIGENCE_ID,
        moduleVersion: BNI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-10",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "bottleneck.monitored",
            "bottleneck.throughput.constrained",
            "bottleneck.ranked",
            "bottleneck.resolution.recommended",
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
      this.deps.autonomousScalingFramework.activateScalingModule(BOTTLENECK_INTELLIGENCE_ID);
    }

    appendBniLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Bottleneck Intelligence with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `bni-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: BNI_METADATA_VERSION,
      },
    };
  }

  connectBottleneckIntelligence(
    _input: ConnectBottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
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
      engineRecordId: `bni-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BOTTLENECK_INTELLIGENCE_ID,
      engineVersion: "PILLOW-BNI-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 9
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...BNI_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: BNI_METADATA_VERSION,
    };

    appendBniLog({
      event: "engine_connected",
      level: "info",
      details:
        "Bottleneck Intelligence connected — never generate unsupported bottleneck conclusions; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never generate unsupported bottleneck conclusions",
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
    action: BniRunReport["action"],
    label: string,
    category: Exclude<BottleneckCategory, "throughput">,
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
    logEvent: string,
  ): BniRunReport {
    const started = Date.now();
    try {
      if (!config.monitoringRulesEnabled) {
        return this.failReport(action, ["Monitoring rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateBottleneck(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = this.detectionEngine.assess(
        category,
        input,
        config,
        this.sourceAvailableFor(category),
      );
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendBniLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.affectedComponent} · severity=${record.severityScore} · impact=${record.businessImpactScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        bottleneckRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendBniLog({ event: "bottleneck_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorOperationalBottlenecks(
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
    return this.runMonitorOp(
      "monitor_operational_bottlenecks",
      "Operational bottleneck monitoring",
      "operational",
      input,
      config,
      "bottleneck_monitoring",
    );
  }

  monitorInfrastructureBottlenecks(
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
    return this.runMonitorOp(
      "monitor_infrastructure_bottlenecks",
      "Infrastructure bottleneck monitoring",
      "infrastructure",
      input,
      config,
      "bottleneck_monitoring",
    );
  }

  monitorSupplierBottlenecks(
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
    return this.runMonitorOp(
      "monitor_supplier_bottlenecks",
      "Supplier bottleneck monitoring",
      "supplier",
      input,
      config,
      "bottleneck_monitoring",
    );
  }

  monitorMarketingBottlenecks(
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
    return this.runMonitorOp(
      "monitor_marketing_bottlenecks",
      "Marketing bottleneck monitoring",
      "marketing",
      input,
      config,
      "bottleneck_monitoring",
    );
  }

  monitorFinancialBottlenecks(
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
    return this.runMonitorOp(
      "monitor_financial_bottlenecks",
      "Financial bottleneck monitoring",
      "financial",
      input,
      config,
      "bottleneck_monitoring",
    );
  }

  monitorWorkforceBottlenecks(
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
    return this.runMonitorOp(
      "monitor_workforce_bottlenecks",
      "Workforce bottleneck monitoring",
      "workforce",
      input,
      config,
      "bottleneck_monitoring",
    );
  }

  detectThroughputConstraints(
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateBottleneck(
        "Throughput constraint detection",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "detect_throughput_constraints",
          validation.errors,
          Date.now() - started,
        );
      }
      const record = this.throughputEngine.detectConstraints(
        input,
        config,
        this.sourceAvailableFor("throughput"),
      );
      this.storeRecord(record);
      const constraints = this.constraintEngine.analyze([record], config);
      engineRecord.currentOperationalState = "active";
      appendBniLog({
        event: "throughput_constraint_detection",
        level: "info",
        details: `Detected throughput constraints · severity=${record.severityScore} · constrained=${constraints.length}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_throughput_constraints",
        engineRecord,
        bottleneckRecords: constraints.length > 0 ? constraints : [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendBniLog({ event: "bottleneck_failure", level: "error", details: message });
      return this.failReport("detect_throughput_constraints", [message], Date.now() - started);
    }
  }

  rankBottlenecksByImpact(
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
    const started = Date.now();
    try {
      if (!config.impactRankingEnabled) {
        return this.failReport(
          "rank_bottlenecks_by_impact",
          ["Impact ranking disabled"],
          Date.now() - started,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateBottleneck("Bottleneck impact ranking", input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "rank_bottlenecks_by_impact",
          validation.errors,
          Date.now() - started,
        );
      }
      if (this.bottleneckRecords.length === 0) {
        this.storeRecord(
          this.detectionEngine.assess(
            "operational",
            input,
            config,
            this.sourceAvailableFor("operational"),
          ),
        );
      }
      const ranked = this.impactEngine.rankByImpact(this.bottleneckRecords, config);
      for (const r of ranked) this.storeRecord(r);
      engineRecord.currentOperationalState = "active";
      appendBniLog({
        event: "bottleneck_impact_ranking",
        level: "info",
        details: `Ranked ${ranked.length} bottlenecks by impact`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "rank_bottlenecks_by_impact",
        engineRecord,
        bottleneckRecords: ranked,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendBniLog({ event: "bottleneck_failure", level: "error", details: message });
      return this.failReport("rank_bottlenecks_by_impact", [message], Date.now() - started);
    }
  }

  recommendBottleneckResolutions(
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled) {
        return this.failReport(
          "recommend_bottleneck_resolutions",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateBottleneck(
        "Bottleneck resolution recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "recommend_bottleneck_resolutions",
          validation.errors,
          Date.now() - started,
        );
      }
      this.recommendations = this.recommendationEngine.generate(this.bottleneckRecords, config);
      engineRecord.currentOperationalState = "active";
      appendBniLog({
        event: "bottleneck_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} bottleneck resolution recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_bottleneck_resolutions",
        engineRecord,
        bottleneckRecords: this.bottleneckRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendBniLog({ event: "bottleneck_failure", level: "error", details: message });
      return this.failReport("recommend_bottleneck_resolutions", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunBniDiagnosticsInput,
    config: BottleneckIntelligenceConfiguration,
  ): BniRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `bni-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: BOTTLENECK_INTELLIGENCE_ID,
        engineVersion: "PILLOW-BNI-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...BNI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: BNI_METADATA_VERSION,
      } satisfies BottleneckIntelligenceEngineRecord);

    appendBniLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.bottleneckRecords.length} · highSeverity=${this.highSeverityCount(config)} · avgImpact=${this.averageImpact()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      bottleneckRecords: this.bottleneckRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
