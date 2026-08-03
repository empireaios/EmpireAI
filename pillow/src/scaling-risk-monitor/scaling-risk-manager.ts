/** X3-13 — Scaling Risk Monitor Manager. */

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
import {
  SCALING_RISK_MONITOR_ID,
  SRM_CAPABILITIES,
  SRM_METADATA_VERSION,
} from "./paths.js";
import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import { appendSrmLog } from "./srm-logging.js";
import { RiskDetectionEngine } from "./risk-detection-engine.js";
import { OperationalRiskAnalyzer } from "./operational-risk-analyzer.js";
import { FinancialRiskAnalyzer } from "./financial-risk-analyzer.js";
import { InfrastructureRiskAnalyzer } from "./infrastructure-risk-analyzer.js";
import { RiskPrioritizationEngine } from "./risk-prioritization-engine.js";
import { RiskRecommendationEngine } from "./risk-recommendation-engine.js";
import { ScalingRiskMetadataGenerator } from "./scaling-risk-metadata-generator.js";
import { ScalingRiskValidator } from "./scaling-risk-validator.js";
import type {
  RiskMitigationRecommendation,
  ScalingRiskMonitorRecord,
  ScalingRiskInput,
  ScalingRiskRecord,
  ScalingRiskValidationReport,
  SrmRunReport,
  ConnectScalingRiskMonitorInput,
  RunSrmDiagnosticsInput,
} from "./types.js";

export type ScalingRiskMonitorDependencies = {
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
};

export class ScalingRiskManager {
  private engineRecord: ScalingRiskMonitorRecord | null = null;
  private scalingRiskRecords: ScalingRiskRecord[] = [];
  private recommendations: RiskMitigationRecommendation[] = [];

  private readonly riskDetectionEngine = new RiskDetectionEngine();
  private readonly operationalAnalyzer = new OperationalRiskAnalyzer();
  private readonly financialAnalyzer = new FinancialRiskAnalyzer();
  private readonly infrastructureAnalyzer = new InfrastructureRiskAnalyzer();
  private readonly prioritizationEngine = new RiskPrioritizationEngine();
  private readonly recommendationEngine = new RiskRecommendationEngine();
  private readonly metadataGenerator = new ScalingRiskMetadataGenerator();
  private readonly validator = new ScalingRiskValidator();

  constructor(private readonly deps: ScalingRiskMonitorDependencies = {}) {}

  getEngineRecord(): ScalingRiskMonitorRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getScalingRiskRecords(): ScalingRiskRecord[] {
    return this.scalingRiskRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): RiskMitigationRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  criticalRiskCount(): number {
    return this.scalingRiskRecords.filter((r) => r.riskSeverity === "critical").length;
  }

  averageRiskProbability(): number {
    if (this.scalingRiskRecords.length === 0) return 0;
    const sum = this.scalingRiskRecords.reduce((acc, r) => acc + r.riskProbability, 0);
    return Math.round(sum / this.scalingRiskRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.scalingRiskRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): ScalingRiskMonitorRecord["dependencyPresence"] {
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
    };
  }

  private sourceAvailableFor(
    kind:
      | "scaling_risk"
      | "operational_risk"
      | "financial_risk"
      | "supplier_risk"
      | "marketing_risk"
      | "workforce_risk"
      | "infrastructure_risk"
      | "uncontrolled_expansion",
  ): boolean {
    const p = this.dependencyPresence();
    switch (kind) {
      case "operational_risk":
      case "scaling_risk":
        return (
          p.capacityPlanningEngine ||
          p.operationalElasticityEngine ||
          p.bottleneckIntelligence ||
          p.autonomousScalingFramework
        );
      case "financial_risk":
        return p.financialScaleEngine || p.autonomousScalingFramework;
      case "supplier_risk":
        return p.supplierScaleEngine || p.autonomousScalingFramework;
      case "marketing_risk":
        return p.marketingScaleEngine || p.winningProductDetector || p.autonomousScalingFramework;
      case "workforce_risk":
        return p.workforceIntelligence || p.autonomousScalingFramework;
      case "infrastructure_risk":
        return (
          p.capacityPlanningEngine ||
          p.operationalElasticityEngine ||
          p.performancePreservationEngine ||
          p.autonomousScalingFramework
        );
      case "uncontrolled_expansion":
        return (
          p.scalingDecisionEngine ||
          p.executiveScalingDashboard ||
          p.performancePreservationEngine ||
          p.autonomousScalingFramework
        );
      default:
        return true;
    }
  }

  private requireConnected(): ScalingRiskMonitorRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Scaling Risk Monitor not connected — call connectScalingRiskMonitor first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: ScalingRiskRecord): void {
    const idx = this.scalingRiskRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.riskCategory === record.riskCategory,
    );
    if (idx >= 0) this.scalingRiskRecords[idx] = record;
    else this.scalingRiskRecords.push(record);
  }

  failReport(
    action: SrmRunReport["action"],
    errors: string[],
    durationMs: number,
  ): SrmRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "srm-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: SCALING_RISK_MONITOR_ID,
        engineVersion: "PILLOW-SRM-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...SRM_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SRM_METADATA_VERSION,
      } satisfies ScalingRiskMonitorRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `srm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: SRM_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: ScalingRiskMonitorConfiguration): {
    frameworkModuleId: string | null;
    validation: ScalingRiskValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: SCALING_RISK_MONITOR_ID,
        moduleVersion: SRM_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-13",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "scaling_risk.monitored",
            "scaling_risk.uncontrolled_expansion",
            "scaling_risk.ranked",
            "scaling_risk.recommendation",
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
      this.deps.autonomousScalingFramework.activateScalingModule(SCALING_RISK_MONITOR_ID);
    }

    appendSrmLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Scaling Risk Monitor with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `srm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: SRM_METADATA_VERSION,
      },
    };
  }

  connectScalingRiskMonitor(
    _input: ConnectScalingRiskMonitorInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
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
      engineRecordId: `srm-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SCALING_RISK_MONITOR_ID,
      engineVersion: "PILLOW-SRM-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 12
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...SRM_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: SRM_METADATA_VERSION,
    };

    appendSrmLog({
      event: "engine_connected",
      level: "info",
      details:
        "Scaling Risk Monitor connected — never suppress critical scaling risks; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never suppress critical scaling risks",
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
    action: SrmRunReport["action"],
    label: string,
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
    logEvent: string,
    produce: () => ScalingRiskRecord,
  ): SrmRunReport {
    const started = Date.now();
    try {
      if (!config.monitoringRulesEnabled) {
        return this.failReport(action, ["Monitoring rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateScalingRisk(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendSrmLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.riskCategory} · severity=${record.riskSeverity} · probability=${record.riskProbability}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        scalingRiskRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSrmLog({ event: "scaling_risk_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorScalingRisks(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    return this.runMonitorOp(
      "monitor_scaling_risks",
      "Scaling risk monitoring",
      input,
      config,
      "scaling_risk_monitoring",
      () =>
        this.riskDetectionEngine.assess(
          "scaling_risk",
          input,
          config,
          this.sourceAvailableFor("scaling_risk"),
        ),
    );
  }

  monitorOperationalRisks(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    return this.runMonitorOp(
      "monitor_operational_risks",
      "Operational risk monitoring",
      input,
      config,
      "scaling_risk_monitoring",
      () =>
        this.operationalAnalyzer.monitor(
          input,
          config,
          this.sourceAvailableFor("operational_risk"),
        ),
    );
  }

  monitorFinancialRisks(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    return this.runMonitorOp(
      "monitor_financial_risks",
      "Financial risk monitoring",
      input,
      config,
      "scaling_risk_monitoring",
      () =>
        this.financialAnalyzer.monitor(
          input,
          config,
          this.sourceAvailableFor("financial_risk"),
        ),
    );
  }

  monitorSupplierRisks(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    return this.runMonitorOp(
      "monitor_supplier_risks",
      "Supplier risk monitoring",
      input,
      config,
      "scaling_risk_monitoring",
      () =>
        this.riskDetectionEngine.assess(
          "supplier_risk",
          input,
          config,
          this.sourceAvailableFor("supplier_risk"),
        ),
    );
  }

  monitorMarketingRisks(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    return this.runMonitorOp(
      "monitor_marketing_risks",
      "Marketing risk monitoring",
      input,
      config,
      "scaling_risk_monitoring",
      () =>
        this.riskDetectionEngine.assess(
          "marketing_risk",
          input,
          config,
          this.sourceAvailableFor("marketing_risk"),
        ),
    );
  }

  monitorWorkforceRisks(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    return this.runMonitorOp(
      "monitor_workforce_risks",
      "Workforce risk monitoring",
      input,
      config,
      "scaling_risk_monitoring",
      () =>
        this.riskDetectionEngine.assess(
          "workforce_risk",
          input,
          config,
          this.sourceAvailableFor("workforce_risk"),
        ),
    );
  }

  monitorInfrastructureRisks(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    return this.runMonitorOp(
      "monitor_infrastructure_risks",
      "Infrastructure risk monitoring",
      input,
      config,
      "scaling_risk_monitoring",
      () =>
        this.infrastructureAnalyzer.monitor(
          input,
          config,
          this.sourceAvailableFor("infrastructure_risk"),
        ),
    );
  }

  detectUncontrolledExpansion(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateScalingRisk(
        "Uncontrolled expansion detection",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "detect_uncontrolled_expansion",
          validation.errors,
          Date.now() - started,
        );
      }
      const record = this.riskDetectionEngine.detectUncontrolledExpansion(
        input,
        config,
        this.sourceAvailableFor("uncontrolled_expansion"),
      );
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      appendSrmLog({
        event: "uncontrolled_expansion_detection",
        level: "info",
        details: `Detected expansion risk · probability=${record.riskProbability} · severity=${record.riskSeverity}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_uncontrolled_expansion",
        engineRecord,
        scalingRiskRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSrmLog({ event: "scaling_risk_failure", level: "error", details: message });
      return this.failReport("detect_uncontrolled_expansion", [message], Date.now() - started);
    }
  }

  rankScalingRisks(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateScalingRisk(
        "Scaling risk ranking",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport("rank_scaling_risks", validation.errors, Date.now() - started);
      }
      const ranked = this.prioritizationEngine.rank(this.scalingRiskRecords, config);
      this.scalingRiskRecords = ranked;
      engineRecord.currentOperationalState = "active";
      appendSrmLog({
        event: "scaling_risk_ranking",
        level: "info",
        details: `Ranked ${ranked.length} scaling risks — never suppress critical`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "rank_scaling_risks",
        engineRecord,
        scalingRiskRecords: ranked,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSrmLog({ event: "scaling_risk_failure", level: "error", details: message });
      return this.failReport("rank_scaling_risks", [message], Date.now() - started);
    }
  }

  recommendRiskMitigations(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled) {
        return this.failReport(
          "recommend_risk_mitigations",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateScalingRisk(
        "Risk mitigation recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "recommend_risk_mitigations",
          validation.errors,
          Date.now() - started,
        );
      }
      this.recommendations = this.recommendationEngine.generate(
        this.scalingRiskRecords,
        config,
      );
      engineRecord.currentOperationalState = "active";
      appendSrmLog({
        event: "scaling_risk_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} risk mitigation recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_risk_mitigations",
        engineRecord,
        scalingRiskRecords: this.scalingRiskRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendSrmLog({ event: "scaling_risk_failure", level: "error", details: message });
      return this.failReport("recommend_risk_mitigations", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunSrmDiagnosticsInput,
    config: ScalingRiskMonitorConfiguration,
  ): SrmRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `srm-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: SCALING_RISK_MONITOR_ID,
        engineVersion: "PILLOW-SRM-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...SRM_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SRM_METADATA_VERSION,
      } satisfies ScalingRiskMonitorRecord);

    appendSrmLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.scalingRiskRecords.length} · critical=${this.criticalRiskCount()} · avgProbability=${this.averageRiskProbability()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      scalingRiskRecords: this.scalingRiskRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
