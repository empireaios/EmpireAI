/** X3-07 — Financial Scale Manager. */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";
import type { ScalingDecisionEngine } from "../scaling-decision-engine/engine.js";
import type { CapacityPlanningEngine } from "../capacity-planning-engine/engine.js";
import type { MarketingScaleEngine } from "../marketing-scale-engine/engine.js";
import type { SupplierScaleEngine } from "../supplier-scale-engine/engine.js";
import {
  FINANCIAL_SCALE_ENGINE_ID,
  FSE_CAPABILITIES,
  FSE_METADATA_VERSION,
} from "./paths.js";
import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import { appendFseLog } from "./fse-logging.js";
import { CapitalPlanningEngine } from "./capital-planning-engine.js";
import { CashFlowAnalysisEngine } from "./cash-flow-analysis-engine.js";
import { ProfitabilityAnalysisEngine } from "./profitability-analysis-engine.js";
import { InvestmentEfficiencyEngine } from "./investment-efficiency-engine.js";
import { FinancialBottleneckAnalyzer } from "./financial-bottleneck-analyzer.js";
import { FinancialRecommendationEngine } from "./financial-recommendation-engine.js";
import { FinancialScalingMetadataGenerator } from "./financial-scaling-metadata-generator.js";
import { FinancialScalingValidator } from "./financial-scaling-validator.js";
import type {
  ConnectFinancialScaleEngineInput,
  FinancialRecommendation,
  FinancialScaleEngineRecord,
  FinancialScaleInput,
  FinancialScalingRecord,
  FinancialValidationReport,
  FseRunReport,
  RunFseDiagnosticsInput,
} from "./types.js";

export type FinancialScaleEngineDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
  winningProductDetector?: WinningProductDetectorEngine | null;
  scalingDecisionEngine?: ScalingDecisionEngine | null;
  capacityPlanningEngine?: CapacityPlanningEngine | null;
  marketingScaleEngine?: MarketingScaleEngine | null;
  supplierScaleEngine?: SupplierScaleEngine | null;
};

export class FinancialScaleManager {
  private engineRecord: FinancialScaleEngineRecord | null = null;
  private scalingRecords: FinancialScalingRecord[] = [];
  private recommendations: FinancialRecommendation[] = [];

  private readonly capitalEngine = new CapitalPlanningEngine();
  private readonly cashFlowEngine = new CashFlowAnalysisEngine();
  private readonly profitabilityEngine = new ProfitabilityAnalysisEngine();
  private readonly investmentEngine = new InvestmentEfficiencyEngine();
  private readonly bottleneckAnalyzer = new FinancialBottleneckAnalyzer();
  private readonly recommendationEngine = new FinancialRecommendationEngine();
  private readonly metadataGenerator = new FinancialScalingMetadataGenerator();
  private readonly validator = new FinancialScalingValidator();

  constructor(private readonly deps: FinancialScaleEngineDependencies = {}) {}

  getEngineRecord(): FinancialScaleEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getScalingRecords(): FinancialScalingRecord[] {
    return this.scalingRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): FinancialRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  bottleneckCount(): number {
    return this.scalingRecords.filter((r) =>
      /bottleneck|critical|do not scale|hold/i.test(r.recommendationSummary),
    ).length;
  }

  averageReadiness(): number {
    if (this.scalingRecords.length === 0) return 0;
    const sum = this.scalingRecords.reduce(
      (acc, r) => acc + r.investmentEfficiencyScore,
      0,
    );
    return Math.round(sum / this.scalingRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.scalingRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): FinancialScaleEngineRecord["dependencyPresence"] {
    return {
      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),
      winningProductDetector: Boolean(this.deps.winningProductDetector),
      scalingDecisionEngine: Boolean(this.deps.scalingDecisionEngine),
      capacityPlanningEngine: Boolean(this.deps.capacityPlanningEngine),
      marketingScaleEngine: Boolean(this.deps.marketingScaleEngine),
      supplierScaleEngine: Boolean(this.deps.supplierScaleEngine),
    };
  }

  private requireConnected(): FinancialScaleEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Financial Scale Engine not connected — call connectFinancialScaleEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: FinancialScalingRecord): void {
    const idx = this.scalingRecords.findIndex(
      (r) =>
        r.companyReference === record.companyReference &&
        r.scalingInitiativeReference === record.scalingInitiativeReference,
    );
    if (idx >= 0) this.scalingRecords[idx] = record;
    else this.scalingRecords.push(record);
  }

  failReport(
    action: FseRunReport["action"],
    errors: string[],
    durationMs: number,
  ): FseRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "fse-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: FINANCIAL_SCALE_ENGINE_ID,
        engineVersion: "PILLOW-FSE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...FSE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: FSE_METADATA_VERSION,
      } satisfies FinancialScaleEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `fse-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: FSE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: FinancialScaleEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: FinancialValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: FINANCIAL_SCALE_ENGINE_ID,
        moduleVersion: FSE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-07",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "financial.monitored",
            "financial.capital.shortage.detected",
            "financial.bottleneck.detected",
            "financial.scaling.recommended",
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
      this.deps.autonomousScalingFramework.activateScalingModule(FINANCIAL_SCALE_ENGINE_ID);
    }

    appendFseLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Financial Scale Engine with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `fse-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: FSE_METADATA_VERSION,
      },
    };
  }

  connectFinancialScaleEngine(
    _input: ConnectFinancialScaleEngineInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
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
      engineRecordId: `fse-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: FINANCIAL_SCALE_ENGINE_ID,
      engineVersion: "PILLOW-FSE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 6
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...FSE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: FSE_METADATA_VERSION,
    };

    appendFseLog({
      event: "engine_connected",
      level: "info",
      details:
        "Financial Scale Engine connected — never recommend scaling without validated financial readiness; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never recommend scaling without validated financial readiness",
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
    action: FseRunReport["action"],
    label: string,
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
    produce: () => FinancialScalingRecord,
    logEvent: string,
  ): FseRunReport {
    const started = Date.now();
    try {
      if (!config.monitoringRulesEnabled && action.startsWith("monitor_")) {
        return this.failReport(action, ["Monitoring rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateFinancial(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = produce();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendFseLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${record.scalingInitiativeReference} · efficiency=${record.investmentEfficiencyScore} · capital=${record.capitalRequirement} · profitability=${record.profitabilityScore}`,
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
      appendFseLog({ event: "financial_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorCapitalRequirements(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
    return this.runMonitorOp(
      "monitor_capital_requirements",
      "Capital requirements monitoring",
      input,
      config,
      () => {
        if (!config.capitalEvaluationRulesEnabled) {
          throw new Error("Capital evaluation rules disabled");
        }
        return this.capitalEngine.assess(input, config);
      },
      "financial_monitoring",
    );
  }

  monitorCashFlowReadiness(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
    return this.runMonitorOp(
      "monitor_cash_flow_readiness",
      "Cash flow readiness monitoring",
      input,
      config,
      () => this.cashFlowEngine.assess(input, config),
      "financial_monitoring",
    );
  }

  monitorProfitability(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
    return this.runMonitorOp(
      "monitor_profitability",
      "Profitability monitoring",
      input,
      config,
      () => this.profitabilityEngine.assess(input, config, "profitability"),
      "financial_monitoring",
    );
  }

  monitorWorkingCapital(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
    return this.runMonitorOp(
      "monitor_working_capital",
      "Working capital monitoring",
      input,
      config,
      () => this.profitabilityEngine.assess(input, config, "working_capital"),
      "financial_monitoring",
    );
  }

  monitorOperatingExpenses(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
    return this.runMonitorOp(
      "monitor_operating_expenses",
      "Operating expense monitoring",
      input,
      config,
      () => this.profitabilityEngine.assess(input, config, "operating_expense"),
      "financial_monitoring",
    );
  }

  monitorInvestmentEfficiency(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
    return this.runMonitorOp(
      "monitor_investment_efficiency",
      "Investment efficiency monitoring",
      input,
      config,
      () => this.investmentEngine.assess(input, config),
      "financial_monitoring",
    );
  }

  detectFinancialBottlenecks(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateFinancial("Bottleneck detection", input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "detect_financial_bottlenecks",
          validation.errors,
          Date.now() - started,
        );
      }
      if (this.scalingRecords.length === 0) {
        this.storeRecord(this.capitalEngine.assess(input, config));
      }
      const bottlenecks = this.bottleneckAnalyzer.detect(this.scalingRecords, config);
      for (const b of bottlenecks) this.storeRecord(b);
      engineRecord.currentOperationalState = "active";
      appendFseLog({
        event: "bottleneck_detection",
        level: "info",
        details: `Detected ${bottlenecks.length} financial bottlenecks`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_financial_bottlenecks",
        engineRecord,
        scalingRecords: bottlenecks.length > 0 ? bottlenecks : this.scalingRecords,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendFseLog({ event: "financial_failure", level: "error", details: message });
      return this.failReport("detect_financial_bottlenecks", [message], Date.now() - started);
    }
  }

  detectCapitalShortages(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
    const started = Date.now();
    try {
      if (!config.scalingThresholdsEnabled) {
        return this.failReport(
          "detect_capital_shortages",
          ["Scaling thresholds disabled"],
          Date.now() - started,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateFinancial(
        "Capital shortage detection",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "detect_capital_shortages",
          validation.errors,
          Date.now() - started,
        );
      }
      if (this.scalingRecords.length === 0) {
        this.storeRecord(this.capitalEngine.assess(input, config));
      }
      const shortages = this.scalingRecords.filter(
        (r) =>
          r.capitalRequirement < config.minCapitalRequirement ||
          r.profitabilityScore < config.minProfitabilityScore ||
          r.investmentEfficiencyScore < config.minInvestmentEfficiencyScore ||
          r.capitalRequirement < config.bottleneckThreshold ||
          r.profitabilityScore < config.bottleneckThreshold,
      );
      engineRecord.currentOperationalState = "active";
      appendFseLog({
        event: "capital_shortage_detection",
        level: "info",
        details: `Detected ${shortages.length} capital shortages`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_capital_shortages",
        engineRecord,
        scalingRecords: shortages.length > 0 ? shortages : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendFseLog({ event: "financial_failure", level: "error", details: message });
      return this.failReport("detect_capital_shortages", [message], Date.now() - started);
    }
  }

  recommendFinancialScaling(
    input: FinancialScaleInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled && !config.financialOptimizationRulesEnabled) {
        return this.failReport(
          "recommend_financial_scaling",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateFinancial(
        "Financial scaling recommendation",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "recommend_financial_scaling",
          validation.errors,
          Date.now() - started,
        );
      }
      this.recommendations = this.recommendationEngine.generate(this.scalingRecords, config);
      engineRecord.currentOperationalState = "active";
      appendFseLog({
        event: "financial_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} financial scaling recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend_financial_scaling",
        engineRecord,
        scalingRecords: this.scalingRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendFseLog({ event: "financial_failure", level: "error", details: message });
      return this.failReport("recommend_financial_scaling", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunFseDiagnosticsInput,
    config: FinancialScaleEngineConfiguration,
  ): FseRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `fse-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: FINANCIAL_SCALE_ENGINE_ID,
        engineVersion: "PILLOW-FSE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...FSE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: FSE_METADATA_VERSION,
      } satisfies FinancialScaleEngineRecord);

    appendFseLog({
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
