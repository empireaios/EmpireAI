/** R3-06 — Profit Calculation Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import { PROFIT_CALCULATION_ENGINE_ID, PC_METADATA_VERSION } from "./paths.js";
import { appendPcLog } from "./pc-logging.js";
import { ProfitRegistry } from "./profit-registry.js";
import { ProfitCalculationEngineCore } from "./profit-calculation-engine.js";
import { ProfitAggregationEngine } from "./profit-aggregation-engine.js";
import { MarginCalculationEngine } from "./margin-calculation-engine.js";
import { ProfitAnalyticsEngine } from "./profit-analytics-engine.js";
import { ProfitRetryManager } from "./profit-retry-manager.js";
import { ProfitValidator, ProfitValidationEngine } from "./profit-validator.js";
import { ProfitMetadataGenerator } from "./profit-metadata-generator.js";
import type { ProfitCalculationEngineConfiguration } from "./configuration.js";
import type {
  AggregateProfitInput,
  CalculateProfitByMarketplaceInput,
  CalculateProfitByOrderInput,
  CalculateProfitByProductInput,
  CalculateProfitBySupplierInput,
  CalculateProfitInput,
  ConnectProfitCalculationEngineInput,
  ProfitCalculationRunReport,
  ProfitEngineRecord,
} from "./types.js";

export class ProfitCalculationManager {
  private engineRecord: ProfitEngineRecord | null = null;
  private readonly registry = new ProfitRegistry();
  private readonly validator = new ProfitValidator();
  private readonly validationEngine = new ProfitValidationEngine(this.validator);
  private readonly metadataGenerator = new ProfitMetadataGenerator();
  private readonly marginEngine = new MarginCalculationEngine();
  private readonly retryManager = new ProfitRetryManager();
  private readonly calculationEngine: ProfitCalculationEngineCore;
  private readonly aggregationEngine: ProfitAggregationEngine;
  private readonly analyticsEngine: ProfitAnalyticsEngine;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
  ) {
    this.calculationEngine = new ProfitCalculationEngineCore(
      this.registry,
      this.metadataGenerator,
      this.marginEngine,
      this.validationEngine,
      revenueEngine,
      expenseEngine,
    );
    this.aggregationEngine = new ProfitAggregationEngine(this.registry, this.metadataGenerator);
    this.analyticsEngine = new ProfitAnalyticsEngine(this.registry);
  }

  getEngineRecord(): ProfitEngineRecord | null {
    return this.engineRecord;
  }

  getProfitRecords() {
    return this.registry.list();
  }

  private isRevenueEngineConnected(): boolean {
    try {
      const record = this.revenueEngine?.getEngineRecord();
      return (
        record?.currentOperationalState === "active" ||
        record?.currentOperationalState === "connected"
      );
    } catch {
      return false;
    }
  }

  private isExpenseEngineConnected(): boolean {
    try {
      const record = this.expenseEngine?.getEngineRecord();
      return (
        record?.currentOperationalState === "active" ||
        record?.currentOperationalState === "connected"
      );
    } catch {
      return false;
    }
  }

  registerWithFramework(
    config: ProfitCalculationEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: ProfitCalculationRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: PROFIT_CALCULATION_ENGINE_ID,
        moduleVersion: PC_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-06",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://profit-calculation-engine",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["profit.calculated", "profit.aggregated", "profit.anomaly"],
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

    appendPcLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered profit engine with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `pc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PC_METADATA_VERSION,
      },
    };
  }

  connectProfitCalculationEngine(
    _input: ConnectProfitCalculationEngineInput,
    config: ProfitCalculationEngineConfiguration,
  ): ProfitCalculationRunReport {
    const started = Date.now();
    const reConnected = this.isRevenueEngineConnected();
    const exConnected = this.isExpenseEngineConnected();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(PROFIT_CALCULATION_ENGINE_ID);
    }

    const allConnected = reConnected && exConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      profitRecords: [],
      aggregation: null,
      anomalies: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private runCalculation(
    action: ProfitCalculationRunReport["action"],
    calcFn: () => {
      record: import("./types.js").ProfitRecord | null;
      error: string | null;
      warnings: string[];
    },
    config: ProfitCalculationEngineConfiguration,
  ): ProfitCalculationRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Profit calculation engine not connected");

    const result = calcFn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    const profitRecords = result.record ? [result.record] : [];
    const anomalies = result.record
      ? this.analyticsEngine.detectAnomalies(profitRecords, config)
      : [];

    if (this.framework && result.record) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: PROFIT_CALCULATION_ENGINE_ID,
        topic: "profit.calculated",
        payloadRef: result.record.profitRecordId,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      profitRecords,
      aggregation: null,
      anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  calculateProfit(
    input: CalculateProfitInput,
    config: ProfitCalculationEngineConfiguration,
  ): ProfitCalculationRunReport {
    return this.runCalculation(
      "calculate",
      () => this.calculationEngine.calculateProfit(input, config),
      config,
    );
  }

  calculateProfitByMarketplace(
    input: CalculateProfitByMarketplaceInput,
    config: ProfitCalculationEngineConfiguration,
  ): ProfitCalculationRunReport {
    return this.runCalculation(
      "calculate_marketplace",
      () => this.calculationEngine.calculateByMarketplace(input, config),
      config,
    );
  }

  calculateProfitBySupplier(
    input: CalculateProfitBySupplierInput,
    config: ProfitCalculationEngineConfiguration,
  ): ProfitCalculationRunReport {
    return this.runCalculation(
      "calculate_supplier",
      () => this.calculationEngine.calculateBySupplier(input, config),
      config,
    );
  }

  calculateProfitByProduct(
    input: CalculateProfitByProductInput,
    config: ProfitCalculationEngineConfiguration,
  ): ProfitCalculationRunReport {
    return this.runCalculation(
      "calculate_product",
      () => this.calculationEngine.calculateByProduct(input, config),
      config,
    );
  }

  calculateProfitByOrder(
    input: CalculateProfitByOrderInput,
    config: ProfitCalculationEngineConfiguration,
  ): ProfitCalculationRunReport {
    return this.runCalculation(
      "calculate_order",
      () => this.calculationEngine.calculateByOrder(input, config),
      config,
    );
  }

  aggregateProfit(
    input: AggregateProfitInput,
    config: ProfitCalculationEngineConfiguration,
  ): ProfitCalculationRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Profit calculation engine not connected");

    try {
      const aggregation = this.aggregationEngine.aggregate(input, config);
      const validation = this.validator.validateEngineRecord(engineRecord);

      if (this.framework) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: PROFIT_CALCULATION_ENGINE_ID,
          topic: "profit.aggregated",
          payloadRef: aggregation.summaryId,
        });
      }

      return this.metadataGenerator.buildRunReport({
        action: "aggregate",
        engineRecord,
        profitRecords: this.registry.listValidated(),
        aggregation,
        anomalies: [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateEngineRecord(engineRecord);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Aggregation failed");
      return this.metadataGenerator.buildRunReport({
        action: "aggregate",
        engineRecord,
        profitRecords: [],
        aggregation: null,
        anomalies: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
