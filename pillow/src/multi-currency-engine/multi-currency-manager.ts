/** R3-12 — Multi-Currency Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { TaxIntelligenceEngine } from "../tax-intelligence-engine/engine.js";
import { MULTI_CURRENCY_ENGINE_ID, MC_METADATA_VERSION } from "./paths.js";
import { appendMcLog } from "./mc-logging.js";
import { CurrencyRegistry, ExchangeRateRegistry } from "./currency-registry.js";
import { CurrencyDataSource } from "./currency-data-source.js";
import { ExchangeRateProvider } from "./exchange-rate-provider.js";
import { ExchangeRateManager } from "./exchange-rate-manager.js";
import { CurrencyConversionEngine } from "./currency-conversion-engine.js";
import { CurrencyAnalyticsEngine } from "./currency-analytics-engine.js";
import { CurrencyMetadataGenerator } from "./currency-metadata-generator.js";
import { CurrencyValidator, CurrencyValidationEngine } from "./currency-validator.js";
import { CurrencyAnomalyDetector } from "./currency-anomaly-detector.js";
import { CurrencyRetryManager } from "./currency-retry-manager.js";
import type { MultiCurrencyEngineConfiguration } from "./configuration.js";
import type {
  CalculateCurrencyGainLossInput,
  ConnectMultiCurrencyEngineInput,
  ConvertCurrencyInput,
  CurrencyGainLossRecord,
  CurrencyRecord,
  GenerateCurrencySummaryInput,
  MultiCurrencyEngineRecord,
  MultiCurrencyRunReport,
  RecordTransactionCurrencyInput,
  RefreshExchangeRatesInput,
} from "./types.js";

export class MultiCurrencyManager {
  private engineRecord: MultiCurrencyEngineRecord | null = null;
  private readonly registry = new CurrencyRegistry();
  private readonly rateRegistry = new ExchangeRateRegistry();
  private readonly validator = new CurrencyValidator();
  private readonly validationEngine = new CurrencyValidationEngine(this.validator);
  private readonly metadataGenerator = new CurrencyMetadataGenerator();
  private readonly rateProvider = new ExchangeRateProvider();
  private readonly rateManager = new ExchangeRateManager(this.rateProvider, this.rateRegistry);
  private readonly analyticsEngine = new CurrencyAnalyticsEngine();
  private readonly anomalyDetector = new CurrencyAnomalyDetector();
  private readonly retryManager = new CurrencyRetryManager();
  private readonly dataSource: CurrencyDataSource;
  private readonly conversionEngine: CurrencyConversionEngine;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly bankingIntegration: BankingIntegrationEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly taxIntelligenceEngine: TaxIntelligenceEngine | null,
  ) {
    this.dataSource = new CurrencyDataSource(
      bankingIntegration,
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      taxIntelligenceEngine,
    );
    this.conversionEngine = new CurrencyConversionEngine(
      this.rateManager,
      this.registry,
      this.metadataGenerator,
      this.dataSource,
    );
  }

  getEngineRecord(): MultiCurrencyEngineRecord | null {
    return this.engineRecord;
  }

  getCurrencyRecords() {
    return this.registry.list();
  }

  getExchangeRateHistory() {
    return this.rateManager.getHistory();
  }

  private isConnected(record: { currentOperationalState?: string } | null | undefined): boolean {
    const state = record?.currentOperationalState;
    return state === "active" || state === "connected";
  }

  private probeConnections() {
    const biConnected = this.isConnected(this.bankingIntegration?.getIntegrationRecord?.());
    const reConnected = this.isConnected(this.revenueEngine?.getEngineRecord?.());
    const exConnected = this.isConnected(this.expenseEngine?.getEngineRecord?.());
    const pcConnected = this.isConnected(this.profitCalculationEngine?.getEngineRecord?.());
    const txConnected = this.isConnected(this.taxIntelligenceEngine?.getEngineRecord?.());
    return { biConnected, reConnected, exConnected, pcConnected, txConnected };
  }

  registerWithFramework(
    config: MultiCurrencyEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: MultiCurrencyRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: MULTI_CURRENCY_ENGINE_ID,
        moduleVersion: MC_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-12",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://multi-currency-engine",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["currency.converted", "currency.rate_updated", "currency.failed"],
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

    appendMcLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered multi-currency engine with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `mc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: MC_METADATA_VERSION,
      },
    };
  }

  connectMultiCurrencyEngine(
    _input: ConnectMultiCurrencyEngineInput,
    config: MultiCurrencyEngineConfiguration,
  ): MultiCurrencyRunReport {
    const started = Date.now();
    const { biConnected, reConnected, exConnected, pcConnected, txConnected } =
      this.probeConnections();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(MULTI_CURRENCY_ENGINE_ID);
    }

    this.rateManager.refreshRates(config, true);

    const allConnected = reConnected && exConnected && biConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      bankingIntegrationConnected: biConnected,
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      profitCalculationEngineConnected: pcConnected,
      taxIntelligenceEngineConnected: txConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!biConnected) validation.warnings.push("Banking Integration not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      currencyRecords: [],
      exchangeRates: this.rateRegistry.list(),
      gainLossRecords: [],
      anomalies: [],
      summary: null,
      validation,
      durationMs: Date.now() - started,
    });
  }

  private runCurrencyAction(
    action: MultiCurrencyRunReport["action"],
    fn: () => {
      records: CurrencyRecord[];
      exchangeRates: import("./types.js").ExchangeRateRecord[];
      gainLossRecords: CurrencyGainLossRecord[];
      error: string | null;
      warnings: string[];
      summary?: import("./types.js").CurrencySummary | null;
    },
    config: MultiCurrencyEngineConfiguration,
    eventTopic?: string,
  ): MultiCurrencyRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Multi-currency engine not connected");

    const result = fn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    const anomalies = result.records.flatMap((r) =>
      this.anomalyDetector.detect(r, config),
    );

    if (this.framework && result.records.length > 0 && eventTopic) {
      for (const record of result.records) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: MULTI_CURRENCY_ENGINE_ID,
          topic: eventTopic,
          payloadRef: record.currencyRecordId,
        });
      }
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      currencyRecords: result.records,
      exchangeRates: result.exchangeRates,
      gainLossRecords: result.gainLossRecords,
      anomalies,
      summary: result.summary ?? null,
      validation,
      durationMs: Date.now() - started,
    });
  }

  recordTransactionCurrency(
    input: RecordTransactionCurrencyInput,
    config: MultiCurrencyEngineConfiguration,
  ): MultiCurrencyRunReport {
    const dedupeKey = `txn:${input.sourceCurrency}:${input.originalAmount}:${input.revenueReference ?? ""}:${input.expenseReference ?? ""}`;
    return this.runCurrencyAction(
      "record_transaction_currency",
      () => {
        const result = this.conversionEngine.recordTransactionCurrency(input, config, dedupeKey);
        if (result.error || !result.record) {
          return {
            records: [],
            exchangeRates: [],
            gainLossRecords: [],
            error: result.error,
            warnings: result.warnings,
          };
        }
        return {
          records: [result.record],
          exchangeRates: [],
          gainLossRecords: [],
          error: null,
          warnings: result.warnings,
        };
      },
      config,
      "currency.converted",
    );
  }

  convertCurrency(
    input: ConvertCurrencyInput,
    config: MultiCurrencyEngineConfiguration,
  ): MultiCurrencyRunReport {
    const dedupeKey = `convert:${input.sourceCurrency}:${input.targetCurrency}:${input.originalAmount}`;
    return this.runCurrencyAction(
      "convert_currency",
      () => {
        const result = this.conversionEngine.convertCurrency(input, config, dedupeKey);
        if (result.error || !result.record) {
          return {
            records: [],
            exchangeRates: [],
            gainLossRecords: [],
            error: result.error,
            warnings: result.warnings,
          };
        }
        const validation = this.validationEngine.validateForConversion(result.record, config);
        if (validation.decision === "fail") {
          return {
            records: [],
            exchangeRates: [],
            gainLossRecords: [],
            error: validation.errors.join("; "),
            warnings: [...result.warnings, ...validation.warnings],
          };
        }
        return {
          records: [result.record],
          exchangeRates: this.rateRegistry.list(),
          gainLossRecords: [],
          error: null,
          warnings: [...result.warnings, ...validation.warnings],
        };
      },
      config,
      "currency.converted",
    );
  }

  refreshExchangeRates(
    input: RefreshExchangeRatesInput,
    config: MultiCurrencyEngineConfiguration,
  ): MultiCurrencyRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Multi-currency engine not connected");

    const refresh = this.rateManager.refreshRates(config, input.forceRefresh ?? false);
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (refresh.errors.length > 0) {
      validation.warnings.push(...refresh.errors);
      if (refresh.records.length === 0) validation.decision = "fail";
    }
    validation.warnings.push(...refresh.warnings);

    if (this.framework && refresh.records.length > 0) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: MULTI_CURRENCY_ENGINE_ID,
        topic: "currency.rate_updated",
        payloadRef: refresh.records[0]!.rateId,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "refresh_exchange_rates",
      engineRecord,
      currencyRecords: [],
      exchangeRates: refresh.records,
      gainLossRecords: [],
      anomalies: [],
      summary: null,
      validation,
      durationMs: Date.now() - started,
    });
  }

  calculateCurrencyGainLoss(
    input: CalculateCurrencyGainLossInput,
    config: MultiCurrencyEngineConfiguration,
  ): MultiCurrencyRunReport {
    const reportingCurrency = input.reportingCurrency ?? config.reportingCurrency;
    const dedupeKey = `gl:${input.sourceCurrency}:${input.originalAmount}:${reportingCurrency}`;

    return this.runCurrencyAction(
      "calculate_gain_loss",
      () => {
        if (this.registry.hasDedupeKey(dedupeKey)) {
          return {
            records: [],
            exchangeRates: [],
            gainLossRecords: [],
            error: "Duplicate gain/loss calculation",
            warnings: [],
          };
        }

        const convertResult = this.conversionEngine.convertCurrency(
          {
            sourceCurrency: input.sourceCurrency,
            targetCurrency: reportingCurrency,
            originalAmount: input.originalAmount,
          },
          config,
          `${dedupeKey}:convert`,
        );

        if (convertResult.error || !convertResult.record) {
          return {
            records: [],
            exchangeRates: [],
            gainLossRecords: [],
            error: convertResult.error,
            warnings: convertResult.warnings,
          };
        }

        const gainLossAmount =
          Math.round((convertResult.record.convertedAmount - input.originalAmount) * 100) / 100;

        const gainLoss = this.metadataGenerator.buildGainLossRecord({
          sourceCurrency: input.sourceCurrency,
          reportingCurrency,
          originalAmount: input.originalAmount,
          convertedAmount: convertResult.record.convertedAmount,
          gainLossAmount,
        });
        this.registry.storeGainLoss(gainLoss);
        this.registry.markDedupeKey(dedupeKey);
        this.registry.store(convertResult.record, `${dedupeKey}:convert`);

        appendMcLog({
          event: "gain_loss_calculation",
          level: "info",
          details: `Gain/loss ${gainLoss.gainLossAmount} ${reportingCurrency} for ${input.sourceCurrency}`,
        });

        return {
          records: [convertResult.record],
          exchangeRates: this.rateRegistry.list(),
          gainLossRecords: [gainLoss],
          error: null,
          warnings: convertResult.warnings,
        };
      },
      config,
      "currency.converted",
    );
  }

  generateCurrencySummary(
    input: GenerateCurrencySummaryInput,
    config: MultiCurrencyEngineConfiguration,
  ): MultiCurrencyRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Multi-currency engine not connected");

    const reportingCurrency = input.reportingCurrency ?? config.reportingCurrency;
    const summary = this.analyticsEngine.generateSummary(this.registry, reportingCurrency);
    const validation = this.validator.validateEngineRecord(engineRecord);

    appendMcLog({
      event: "currency_summary",
      level: "info",
      details: `Summary: ${summary.totalConversions} conversions in ${reportingCurrency}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_summary",
      engineRecord,
      currencyRecords: [],
      exchangeRates: [],
      gainLossRecords: [],
      anomalies: [],
      summary,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.rateRegistry.resetForTesting();
    this.rateManager.resetForTesting();
    this.retryManager.reset();
  }
}
