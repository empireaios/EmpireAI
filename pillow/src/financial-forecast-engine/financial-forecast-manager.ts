/** R3-13 — Financial Forecast Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { MultiCurrencyEngine } from "../multi-currency-engine/engine.js";
import { FINANCIAL_FORECAST_ENGINE_ID, FCT_METADATA_VERSION } from "./paths.js";
import { appendFctLog } from "./fct-logging.js";
import { ForecastRegistry } from "./forecast-registry.js";
import { ForecastDataSource } from "./forecast-data-source.js";
import { RevenueForecastEngine } from "./revenue-forecast-engine.js";
import { ExpenseForecastEngine } from "./expense-forecast-engine.js";
import { CashFlowForecastEngine } from "./cash-flow-forecast-engine.js";
import { FinancialTrendAnalyzer } from "./financial-trend-analyzer.js";
import { ForecastAnalyticsEngine } from "./forecast-analytics-engine.js";
import { ForecastMetadataGenerator } from "./forecast-metadata-generator.js";
import { ForecastValidator } from "./forecast-validator.js";
import { ForecastDeviationDetector } from "./forecast-deviation-detector.js";
import { ForecastRetryManager } from "./forecast-retry-manager.js";
import type { FinancialForecastEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeFinancialTrendsInput,
  ConnectFinancialForecastEngineInput,
  DetectForecastDeviationsInput,
  FinancialForecastEngineRecord,
  FinancialForecastRunReport,
  FinancialRisk,
  FinancialTrend,
  ForecastDeviation,
  ForecastRecord,
  GenerateFinancialProjectionInput,
} from "./types.js";

export class FinancialForecastManager {
  private engineRecord: FinancialForecastEngineRecord | null = null;
  private readonly registry = new ForecastRegistry();
  private readonly validator = new ForecastValidator();
  private readonly metadataGenerator = new ForecastMetadataGenerator();
  private readonly revenueForecastEngine = new RevenueForecastEngine();
  private readonly expenseForecastEngine = new ExpenseForecastEngine();
  private readonly cashFlowForecastEngine = new CashFlowForecastEngine();
  private readonly trendAnalyzer = new FinancialTrendAnalyzer();
  private readonly analyticsEngine = new ForecastAnalyticsEngine();
  private readonly deviationDetector = new ForecastDeviationDetector();
  private readonly retryManager = new ForecastRetryManager();
  private readonly dataSource: ForecastDataSource;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly cashFlowMonitor: CashFlowMonitorEngine | null,
    private readonly multiCurrencyEngine: MultiCurrencyEngine | null,
  ) {
    this.dataSource = new ForecastDataSource(
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      cashFlowMonitor,
      multiCurrencyEngine,
    );
  }

  getEngineRecord(): FinancialForecastEngineRecord | null {
    return this.engineRecord;
  }

  getForecastRecords() {
    return this.registry.list();
  }

  private isConnected(record: { currentOperationalState?: string } | null | undefined): boolean {
    const state = record?.currentOperationalState;
    return state === "active" || state === "connected";
  }

  private probeConnections() {
    const reConnected = this.isConnected(this.revenueEngine?.getEngineRecord?.());
    const exConnected = this.isConnected(this.expenseEngine?.getEngineRecord?.());
    const pcConnected = this.isConnected(this.profitCalculationEngine?.getEngineRecord?.());
    const cfConnected = this.isConnected(this.cashFlowMonitor?.getMonitorRecord?.());
    const mcConnected = this.isConnected(this.multiCurrencyEngine?.getEngineRecord?.());
    return { reConnected, exConnected, pcConnected, cfConnected, mcConnected };
  }

  registerWithFramework(
    config: FinancialForecastEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: FinancialForecastRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: FINANCIAL_FORECAST_ENGINE_ID,
        moduleVersion: FCT_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-13",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://financial-forecast-engine",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["forecast.generated", "forecast.deviation", "forecast.failed"],
          maxEventsPerMinute: 120,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: false,
          requestsPerMinute: 120,
          burstLimit: 20,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "financial_module_registration",
          "financial_module_activation",
          "financial_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendFctLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered financial forecast engine with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `fct-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: FCT_METADATA_VERSION,
      },
    };
  }

  connectFinancialForecastEngine(
    _input: ConnectFinancialForecastEngineInput,
    config: FinancialForecastEngineConfiguration,
  ): FinancialForecastRunReport {
    const started = Date.now();
    const { reConnected, exConnected, pcConnected, cfConnected, mcConnected } =
      this.probeConnections();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(FINANCIAL_FORECAST_ENGINE_ID);
    }

    const allConnected = reConnected && exConnected && cfConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      profitCalculationEngineConnected: pcConnected,
      cashFlowMonitorConnected: cfConnected,
      multiCurrencyEngineConnected: mcConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!cfConnected) validation.warnings.push("Cash Flow Monitor not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      forecastRecords: [],
      trends: [],
      deviations: [],
      risks: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private buildProjection(
    period: string,
    config: FinancialForecastEngineConfiguration,
    dedupeKey: string,
  ): {
    record: ForecastRecord | null;
    trends: FinancialTrend[];
    deviations: ForecastDeviation[];
    risks: FinancialRisk[];
    error: string | null;
    warnings: string[];
  } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return {
        record: null,
        trends: [],
        deviations: [],
        risks: [],
        error: "Duplicate forecast projection",
        warnings: [],
      };
    }

    const periodResolved = this.analyticsEngine.resolvePeriodMultiplier(period, config);
    if (periodResolved.error) {
      return {
        record: null,
        trends: [],
        deviations: [],
        risks: [],
        error: periodResolved.error,
        warnings: [],
      };
    }

    const snapshot = this.dataSource.snapshot();
    const warnings = [...snapshot.warnings];

    const revenue = this.revenueForecastEngine.forecast(
      snapshot,
      periodResolved.multiplier,
      config,
    );
    const expense = this.expenseForecastEngine.forecast(
      snapshot,
      periodResolved.multiplier,
      config,
    );
    warnings.push(...revenue.warnings, ...expense.warnings);

    const profitForecast = Math.round((revenue.amount - expense.amount) * 100) / 100;
    const cashFlowResult = this.cashFlowForecastEngine.forecastCashFlow(
      snapshot,
      revenue.amount,
      expense.amount,
      periodResolved.multiplier,
      config,
    );
    warnings.push(...cashFlowResult.warnings);

    const confidence = this.analyticsEngine.computeConfidence(snapshot, config);
    const record = this.metadataGenerator.buildForecastRecord({
      forecastPeriod: period,
      revenueForecast: revenue.amount,
      expenseForecast: expense.amount,
      profitForecast,
      cashFlowForecast: cashFlowResult.cashFlow,
      liquidityForecast: cashFlowResult.liquidity,
      forecastConfidenceScore: confidence,
      validationStatus: "passed",
    });

    const recordValidation = this.validator.validateForecastRecord(record, config);
    warnings.push(...recordValidation.warnings);
    if (recordValidation.decision === "fail") {
      return {
        record: null,
        trends: [],
        deviations: [],
        risks: [],
        error: recordValidation.errors.join("; "),
        warnings,
      };
    }

    const prior = this.registry.latest();
    this.registry.store(record, dedupeKey);
    const trends = this.trendAnalyzer.analyze(snapshot);
    const deviations = this.deviationDetector.detectDeviations(record, prior, config);
    const risks = this.deviationDetector.detectRisks(record, snapshot, config);

    appendFctLog({
      event: "forecast_generation",
      level: "info",
      details: `Projection ${record.forecastRecordId} period=${period} confidence=${confidence}`,
    });

    return { record, trends, deviations, risks, error: null, warnings };
  }

  private runForecastAction(
    action: FinancialForecastRunReport["action"],
    fn: () => {
      records: ForecastRecord[];
      trends: FinancialTrend[];
      deviations: ForecastDeviation[];
      risks: FinancialRisk[];
      error: string | null;
      warnings: string[];
    },
    config: FinancialForecastEngineConfiguration,
    eventTopic?: string,
  ): FinancialForecastRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Financial forecast engine not connected");

    const result = fn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    if (this.framework && result.records.length > 0 && eventTopic) {
      for (const record of result.records) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: FINANCIAL_FORECAST_ENGINE_ID,
          topic: eventTopic,
          payloadRef: record.forecastRecordId,
        });
      }
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      forecastRecords: result.records,
      trends: result.trends,
      deviations: result.deviations,
      risks: result.risks,
      validation,
      durationMs: Date.now() - started,
    });
  }

  generateFinancialProjection(
    input: GenerateFinancialProjectionInput,
    config: FinancialForecastEngineConfiguration,
  ): FinancialForecastRunReport {
    const period = input.forecastPeriod ?? config.defaultForecastPeriod;
    const dedupeKey = `projection:${period}`;
    return this.runForecastAction(
      "generate_projection",
      () => {
        const result = this.buildProjection(period, config, dedupeKey);
        return {
          records: result.record ? [result.record] : [],
          trends: result.trends,
          deviations: result.deviations,
          risks: result.risks,
          error: result.error,
          warnings: result.warnings,
        };
      },
      config,
      "forecast.generated",
    );
  }

  analyzeFinancialTrends(
    input: AnalyzeFinancialTrendsInput,
    config: FinancialForecastEngineConfiguration,
  ): FinancialForecastRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Financial forecast engine not connected");

    const snapshot = this.dataSource.snapshot();
    const trends = this.trendAnalyzer.analyze(snapshot);
    const validation = this.validator.validateEngineRecord(engineRecord);
    validation.warnings.push(...snapshot.warnings);

    appendFctLog({
      event: "trend_analysis",
      level: "info",
      details: `Analyzed ${trends.length} financial trends`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "analyze_trends",
      engineRecord,
      forecastRecords: [],
      trends,
      deviations: [],
      risks: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  detectForecastDeviations(
    input: DetectForecastDeviationsInput,
    config: FinancialForecastEngineConfiguration,
  ): FinancialForecastRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Financial forecast engine not connected");

    const target = input.forecastRecordId
      ? this.registry.get(input.forecastRecordId)
      : this.registry.latest();

    if (!target) {
      const validation = this.validator.validateEngineRecord(engineRecord);
      validation.decision = "fail";
      validation.errors.push("No forecast record available for deviation detection");
      return this.metadataGenerator.buildRunReport({
        action: "detect_deviations",
        engineRecord,
        forecastRecords: [],
        trends: [],
        deviations: [],
        risks: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const prior = this.registry.list().find((r) => r.forecastRecordId !== target.forecastRecordId) ?? null;
    const snapshot = this.dataSource.snapshot();
    const deviations = this.deviationDetector.detectDeviations(target, prior, config);
    const risks = this.deviationDetector.detectRisks(target, snapshot, config);
    const validation = this.validator.validateEngineRecord(engineRecord);

    appendFctLog({
      event: "forecast_deviation",
      level: deviations.length > 0 ? "warn" : "info",
      details: `Detected ${deviations.length} deviation(s) and ${risks.length} risk(s)`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "detect_deviations",
      engineRecord,
      forecastRecords: [target],
      trends: [],
      deviations,
      risks,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
