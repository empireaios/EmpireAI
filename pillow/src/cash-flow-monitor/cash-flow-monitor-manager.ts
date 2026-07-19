/** R3-07 — Cash Flow Monitor Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import { CASH_FLOW_MONITOR_ID, CF_METADATA_VERSION } from "./paths.js";
import { appendCfLog } from "./cf-logging.js";
import { CashFlowRegistry } from "./cash-flow-registry.js";
import { CashFlowDataSource } from "./cash-flow-data-source.js";
import { CashFlowMonitoringEngine } from "./cash-flow-monitoring-engine.js";
import { CashFlowAggregationEngine } from "./cash-flow-aggregation-engine.js";
import { CashFlowAnalysisEngine } from "./cash-flow-analysis-engine.js";
import { CashFlowForecastEngine } from "./cash-flow-forecast-engine.js";
import { LiquidityMonitoringEngine } from "./liquidity-monitoring-engine.js";
import { CashFlowRetryManager } from "./cash-flow-retry-manager.js";
import { CashFlowValidator, CashFlowValidationEngine } from "./cash-flow-validator.js";
import { CashFlowMetadataGenerator } from "./cash-flow-metadata-generator.js";
import type { CashFlowMonitorConfiguration } from "./configuration.js";
import type {
  AggregateCashFlowInput,
  CashFlowMonitorRecord,
  CashFlowMonitorRunReport,
  ConnectCashFlowMonitorInput,
  ForecastCashAvailabilityInput,
  MonitorCashFlowInput,
  MonitorInflowsInput,
  MonitorLiquidityInput,
  MonitorOutflowsInput,
} from "./types.js";

export class CashFlowMonitorManager {
  private monitorRecord: CashFlowMonitorRecord | null = null;
  private readonly registry = new CashFlowRegistry();
  private readonly validator = new CashFlowValidator();
  private readonly validationEngine = new CashFlowValidationEngine(this.validator);
  private readonly metadataGenerator = new CashFlowMetadataGenerator();
  private readonly liquidityEngine = new LiquidityMonitoringEngine();
  private readonly retryManager = new CashFlowRetryManager();
  private readonly dataSource: CashFlowDataSource;
  private readonly monitoringEngine: CashFlowMonitoringEngine;
  private readonly aggregationEngine: CashFlowAggregationEngine;
  private readonly analysisEngine: CashFlowAnalysisEngine;
  private readonly forecastEngine: CashFlowForecastEngine;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly bankingIntegration: BankingIntegrationEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
  ) {
    this.dataSource = new CashFlowDataSource(
      bankingIntegration,
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
    );
    this.monitoringEngine = new CashFlowMonitoringEngine(
      this.registry,
      this.metadataGenerator,
      this.validationEngine,
      this.liquidityEngine,
      this.dataSource,
    );
    this.aggregationEngine = new CashFlowAggregationEngine(
      this.registry,
      this.metadataGenerator,
      this.liquidityEngine,
    );
    this.analysisEngine = new CashFlowAnalysisEngine(this.registry);
    this.forecastEngine = new CashFlowForecastEngine(
      this.dataSource,
      this.metadataGenerator,
      this.liquidityEngine,
    );
  }

  getMonitorRecord(): CashFlowMonitorRecord | null {
    return this.monitorRecord;
  }

  getCashFlowRecords() {
    return this.registry.list();
  }

  private isConnected(engine: { getEngineRecord?: () => unknown; getIntegrationRecord?: () => unknown } | null, field: "engine" | "integration"): boolean {
    try {
      const record =
        field === "integration"
          ? (engine as BankingIntegrationEngine | null)?.getIntegrationRecord?.()
          : (engine as RevenueEngine | null)?.getEngineRecord?.();
      const state = (record as { currentOperationalState?: string } | null)?.currentOperationalState;
      return state === "active" || state === "connected";
    } catch {
      return false;
    }
  }

  registerWithFramework(
    config: CashFlowMonitorConfiguration,
  ): { frameworkModuleId: string | null; validation: CashFlowMonitorRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: CASH_FLOW_MONITOR_ID,
        moduleVersion: CF_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-07",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://cash-flow-monitor",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["cashflow.monitored", "cashflow.forecast", "cashflow.anomaly"],
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

    appendCfLog({
      event: "monitor_initialization",
      level: "info",
      details: `Registered cash flow monitor with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `cf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CF_METADATA_VERSION,
      },
    };
  }

  connectCashFlowMonitor(
    _input: ConnectCashFlowMonitorInput,
    config: CashFlowMonitorConfiguration,
  ): CashFlowMonitorRunReport {
    const started = Date.now();
    const biConnected = this.isConnected(this.bankingIntegration, "integration");
    const reConnected = this.isConnected(this.revenueEngine, "engine");
    const exConnected = this.isConnected(this.expenseEngine, "engine");
    const pcConnected = this.isConnected(this.profitCalculationEngine, "engine");

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(CASH_FLOW_MONITOR_ID);
    }

    const allConnected = biConnected && reConnected && exConnected;
    const record = this.metadataGenerator.buildMonitorRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      bankingIntegrationConnected: biConnected,
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      profitCalculationEngineConnected: pcConnected,
    });
    this.monitorRecord = record;

    const validation = this.validator.validateMonitorRecord(record);
    if (!biConnected) validation.warnings.push("Banking Integration not active");
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      monitorRecord: record,
      cashFlowRecords: [],
      forecast: null,
      aggregation: null,
      anomalies: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private runMonitorAction(
    action: CashFlowMonitorRunReport["action"],
    fn: () => {
      record: import("./types.js").CashFlowRecord | null;
      error: string | null;
      warnings: string[];
    },
    config: CashFlowMonitorConfiguration,
  ): CashFlowMonitorRunReport {
    const started = Date.now();
    const monitorRecord = this.monitorRecord;
    if (!monitorRecord) throw new Error("Cash flow monitor not connected");

    const result = fn();
    const validation = this.validator.validateMonitorRecord(monitorRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    const cashFlowRecords = result.record ? [result.record] : [];
    const anomalies = result.record
      ? this.analysisEngine.detectAnomalies(cashFlowRecords, config)
      : [];

    if (this.framework && result.record) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: CASH_FLOW_MONITOR_ID,
        topic: "cashflow.monitored",
        payloadRef: result.record.cashFlowRecordId,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action,
      monitorRecord,
      cashFlowRecords,
      forecast: null,
      aggregation: null,
      anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  monitorCashFlow(
    input: MonitorCashFlowInput,
    config: CashFlowMonitorConfiguration,
  ): CashFlowMonitorRunReport {
    return this.runMonitorAction(
      "monitor",
      () => this.monitoringEngine.monitorCashFlow(input, config),
      config,
    );
  }

  monitorInflows(
    input: MonitorInflowsInput,
    config: CashFlowMonitorConfiguration,
  ): CashFlowMonitorRunReport {
    return this.runMonitorAction(
      "monitor_inflows",
      () => this.monitoringEngine.monitorInflows(input, config),
      config,
    );
  }

  monitorOutflows(
    input: MonitorOutflowsInput,
    config: CashFlowMonitorConfiguration,
  ): CashFlowMonitorRunReport {
    return this.runMonitorAction(
      "monitor_outflows",
      () => this.monitoringEngine.monitorOutflows(input, config),
      config,
    );
  }

  monitorLiquidity(
    input: MonitorLiquidityInput,
    config: CashFlowMonitorConfiguration,
  ): CashFlowMonitorRunReport {
    return this.runMonitorAction(
      "monitor_liquidity",
      () => this.monitoringEngine.monitorLiquidity(input, config),
      config,
    );
  }

  forecastCashAvailability(
    input: ForecastCashAvailabilityInput,
    config: CashFlowMonitorConfiguration,
  ): CashFlowMonitorRunReport {
    const started = Date.now();
    const monitorRecord = this.monitorRecord;
    if (!monitorRecord) throw new Error("Cash flow monitor not connected");

    try {
      const forecast = this.forecastEngine.forecast(input, config);
      const validation = this.validator.validateMonitorRecord(monitorRecord);

      if (this.framework) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: CASH_FLOW_MONITOR_ID,
          topic: "cashflow.forecast",
          payloadRef: forecast.forecastId,
        });
      }

      return this.metadataGenerator.buildRunReport({
        action: "forecast",
        monitorRecord,
        cashFlowRecords: [],
        forecast,
        aggregation: null,
        anomalies: [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateMonitorRecord(monitorRecord);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Forecast failed");
      return this.metadataGenerator.buildRunReport({
        action: "forecast",
        monitorRecord,
        cashFlowRecords: [],
        forecast: null,
        aggregation: null,
        anomalies: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  aggregateCashFlow(
    input: AggregateCashFlowInput,
    config: CashFlowMonitorConfiguration,
  ): CashFlowMonitorRunReport {
    const started = Date.now();
    const monitorRecord = this.monitorRecord;
    if (!monitorRecord) throw new Error("Cash flow monitor not connected");

    try {
      const aggregation = this.aggregationEngine.aggregate(input, config);
      const validation = this.validator.validateMonitorRecord(monitorRecord);

      if (this.framework) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: CASH_FLOW_MONITOR_ID,
          topic: "cashflow.monitored",
          payloadRef: aggregation.summaryId,
        });
      }

      return this.metadataGenerator.buildRunReport({
        action: "aggregate",
        monitorRecord,
        cashFlowRecords: this.registry.listValidated(),
        forecast: null,
        aggregation,
        anomalies: [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateMonitorRecord(monitorRecord);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Aggregation failed");
      return this.metadataGenerator.buildRunReport({
        action: "aggregate",
        monitorRecord,
        cashFlowRecords: [],
        forecast: null,
        aggregation: null,
        anomalies: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  resetForTesting(): void {
    this.monitorRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
