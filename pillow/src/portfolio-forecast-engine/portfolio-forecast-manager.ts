/** X2-14 — Portfolio Forecast Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { ExecutivePortfolioDashboard } from "../executive-portfolio-dashboard/engine.js";
import type { PortfolioRiskEngine } from "../portfolio-risk-engine/engine.js";
import type { PortfolioBalanceEngine } from "../portfolio-balance-engine/engine.js";
import type { BusinessHealthRanking } from "../business-health-ranking/engine.js";
import type { SharedCustomerIntelligence } from "../shared-customer-intelligence/engine.js";
import type { SharedSupplierIntelligence } from "../shared-supplier-intelligence/engine.js";
import {
  PFE_CAPABILITIES,
  PFE_METADATA_VERSION,
  PORTFOLIO_FORECAST_ENGINE_ID,
} from "./paths.js";
import { appendPfeLog } from "./pfe-logging.js";
import { RevenueForecastEngine } from "./revenue-forecast-engine.js";
import { GrowthForecastEngine } from "./growth-forecast-engine.js";
import { CapitalForecastEngine } from "./capital-forecast-engine.js";
import { RiskForecastEngine } from "./risk-forecast-engine.js";
import { ForecastScenarioEngine } from "./forecast-scenario-engine.js";
import { ForecastValidator } from "./forecast-validator.js";
import { ForecastMetadataGenerator } from "./forecast-metadata-generator.js";
import type { PortfolioForecastEngineConfiguration } from "./configuration.js";
import type {
  ConnectPortfolioForecastEngineInput,
  ForecastPeriod,
  ForecastRecord,
  ForecastRequestInput,
  ForecastRunReport,
  ForecastScenario,
  GenerateExecutiveForecastInput,
  GenerateScenariosInput,
  PortfolioForecastEngineRecord,
  RunForecastDiagnosticsInput,
} from "./types.js";

export type PortfolioForecastEngineDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  executivePortfolioDashboard: ExecutivePortfolioDashboard | null;
  portfolioRiskEngine: PortfolioRiskEngine | null;
  portfolioBalanceEngine: PortfolioBalanceEngine | null;
  businessHealthRanking: BusinessHealthRanking | null;
  sharedCustomerIntelligence: SharedCustomerIntelligence | null;
  sharedSupplierIntelligence: SharedSupplierIntelligence | null;
};

export class PortfolioForecastManager {
  private engineRecord: PortfolioForecastEngineRecord | null = null;
  private forecasts = new Map<string, ForecastRecord>();
  private scenarios: ForecastScenario[] = [];
  private readonly revenueEngine = new RevenueForecastEngine();
  private readonly growthEngine = new GrowthForecastEngine();
  private readonly capitalEngine = new CapitalForecastEngine();
  private readonly riskEngine = new RiskForecastEngine();
  private readonly scenarioEngine = new ForecastScenarioEngine();
  private readonly validator = new ForecastValidator();
  private readonly metadataGenerator = new ForecastMetadataGenerator();

  constructor(private readonly deps: PortfolioForecastEngineDependencies) {}

  getEngineRecord(): PortfolioForecastEngineRecord | null {
    return this.engineRecord;
  }

  getForecastRecords(): ForecastRecord[] {
    return [...this.forecasts.values()];
  }

  getScenarios(): ForecastScenario[] {
    return [...this.scenarios];
  }

  averageConfidence(): number {
    const records = this.getForecastRecords();
    if (records.length === 0) return 0;
    return Math.round(
      records.reduce((sum, r) => sum + r.confidenceScore, 0) / records.length,
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.forecasts.clear();
    this.scenarios = [];
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): PortfolioForecastEngineRecord["dependencyPresence"] {
    return {
      enterprisePortfolioFramework: this.deps.enterprisePortfolioFramework
        ? this.probe(() => this.deps.enterprisePortfolioFramework!.getState())
        : false,
      multiCompanyRegistry: this.deps.multiCompanyRegistry
        ? this.probe(() => this.deps.multiCompanyRegistry!.getState())
        : false,
      portfolioPerformanceEngine: this.deps.portfolioPerformanceEngine
        ? this.probe(() => this.deps.portfolioPerformanceEngine!.getState())
        : false,
      capitalDistributionEngine: this.deps.capitalDistributionEngine
        ? this.probe(() => this.deps.capitalDistributionEngine!.getState())
        : false,
      executivePortfolioDashboard: this.deps.executivePortfolioDashboard
        ? this.probe(() => this.deps.executivePortfolioDashboard!.getState())
        : false,
      portfolioRiskEngine: this.deps.portfolioRiskEngine
        ? this.probe(() => this.deps.portfolioRiskEngine!.getState())
        : false,
      portfolioBalanceEngine: this.deps.portfolioBalanceEngine
        ? this.probe(() => this.deps.portfolioBalanceEngine!.getState())
        : false,
      businessHealthRanking: this.deps.businessHealthRanking
        ? this.probe(() => this.deps.businessHealthRanking!.getState())
        : false,
      sharedCustomerIntelligence: this.deps.sharedCustomerIntelligence
        ? this.probe(() => this.deps.sharedCustomerIntelligence!.getState())
        : false,
      sharedSupplierIntelligence: this.deps.sharedSupplierIntelligence
        ? this.probe(() => this.deps.sharedSupplierIntelligence!.getState())
        : false,
    };
  }

  private requireConnected(): PortfolioForecastEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Portfolio Forecast Engine not connected — call connectPortfolioForecastEngine first",
      );
    }
    return this.engineRecord;
  }

  private companyCount(): number {
    if (!this.deps.multiCompanyRegistry) return 1;
    try {
      return Math.max(1, this.deps.multiCompanyRegistry.getCompanyRecords().length);
    } catch {
      return 1;
    }
  }

  private resolvePortfolioRef(input?: string): string {
    return input?.trim() || "enterprise-portfolio";
  }

  private resolvePeriod(
    input: ForecastPeriod | undefined,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastPeriod {
    return input ?? config.defaultForecastPeriod;
  }

  private store(record: ForecastRecord): ForecastRecord {
    this.forecasts.set(record.portfolioReference, record);
    return { ...record };
  }

  private ensureBase(
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRecord {
    const portfolioReference = this.resolvePortfolioRef(input.portfolioReference);
    const existing = this.forecasts.get(portfolioReference);
    if (existing) return existing;
    return this.buildCompositeForecast(input, config);
  }

  private buildCompositeForecast(
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRecord {
    const portfolioReference = this.resolvePortfolioRef(input.portfolioReference);
    const forecastPeriod = this.resolvePeriod(input.forecastPeriod, config);
    const companyCount = input.companyCount ?? this.companyCount();
    const baselineRevenue = input.baselineRevenue ?? 100_000 * companyCount;
    const baselineProfit = input.baselineProfit ?? Math.round(baselineRevenue * 0.15);
    const presence = this.dependencyPresence();

    const revenue = this.revenueEngine.forecastRevenue({
      baselineRevenue,
      forecastPeriod,
      config,
      companyCount,
    });
    const profit = this.revenueEngine.forecastProfit({
      revenueForecast: revenue.revenueForecast,
      baselineProfit,
      config,
    });
    const growth = this.growthEngine.forecastCompanyGrowth({
      companyCount,
      forecastPeriod,
      config,
    });
    const customer = this.growthEngine.forecastCustomerGrowth({
      companyCount,
      forecastPeriod,
      config,
      customerSignalPresent: presence.sharedCustomerIntelligence,
    });
    const supplier = this.growthEngine.forecastSupplierCapacity({
      companyCount,
      forecastPeriod,
      config,
      supplierSignalPresent: presence.sharedSupplierIntelligence,
    });
    const capital = this.capitalEngine.forecastCapital({
      baselineRevenue,
      growthForecast: growth.growthForecast,
      companyCount,
      forecastPeriod,
      config,
      capitalSignalPresent: presence.capitalDistributionEngine,
    });
    const risk = this.riskEngine.forecastRisk({
      growthForecast: growth.growthForecast,
      capitalRequirementForecast: capital.capitalRequirementForecast,
      companyCount,
      forecastPeriod,
      config,
      riskSignalPresent: presence.portfolioRiskEngine,
    });

    const confidenceScore = Math.round(
      (revenue.confidenceScore +
        profit.confidenceScore +
        growth.confidenceScore +
        customer.confidenceScore +
        supplier.confidenceScore +
        capital.confidenceScore +
        risk.confidenceScore) /
        7,
    );

    return this.store({
      forecastId: `pfe-fc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      portfolioReference,
      forecastPeriod,
      revenueForecast: revenue.revenueForecast,
      profitForecast: profit.profitForecast,
      growthForecast: growth.growthForecast,
      riskForecast: risk.riskForecast,
      confidenceScore,
      validationStatus: "passed",
      metadataVersion: PFE_METADATA_VERSION,
      customerGrowthForecast: customer.customerGrowthForecast,
      supplierCapacityForecast: supplier.supplierCapacityForecast,
      capitalRequirementForecast: capital.capitalRequirementForecast,
      notGuaranteedOutcome: true,
      structuralSignalOnly: true,
      sensitiveEnterpriseData: false,
    });
  }

  private failReport(
    action: ForecastRunReport["action"],
    errors: string[],
    durationMs: number,
  ): ForecastRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "pfe-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: PORTFOLIO_FORECAST_ENGINE_ID,
        engineVersion: "PILLOW-PFE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...PFE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: PFE_METADATA_VERSION,
      } satisfies PortfolioForecastEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `pfe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: PFE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: PortfolioForecastEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: ForecastRunReport["validation"];
  } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: PORTFOLIO_FORECAST_ENGINE_ID,
        moduleVersion: PFE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-14",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "forecast.generated",
            "forecast.scenario",
            "forecast.executive",
            "forecast.risk",
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
          "portfolio_module_registration",
          "portfolio_event_routing",
          "portfolio_validation",
          "diagnostics",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.enterprisePortfolioFramework.activatePortfolioModule(
        PORTFOLIO_FORECAST_ENGINE_ID,
      );
    }

    appendPfeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Portfolio Forecast Engine with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `pfe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PFE_METADATA_VERSION,
      },
    };
  }

  connectPortfolioForecastEngine(
    _input: ConnectPortfolioForecastEngineInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const connectedCount = Object.values(presence).filter(Boolean).length;
    const corePresent =
      presence.enterprisePortfolioFramework && presence.portfolioPerformanceEngine;

    this.engineRecord = {
      engineRecordId: `pfe-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PORTFOLIO_FORECAST_ENGINE_ID,
      engineVersion: "PILLOW-PFE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent ? (connectedCount >= 6 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...PFE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: PFE_METADATA_VERSION,
    };

    appendPfeLog({
      event: "engine_connected",
      level: "info",
      details: "Portfolio Forecast Engine connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Forecasts are structural projections — never guaranteed outcomes",
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

  private runScopedForecast(
    action: ForecastRunReport["action"],
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
    apply: (record: ForecastRecord) => ForecastRecord,
  ): ForecastRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateForecastRequest(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const base = this.ensureBase(input, config);
      const updated = this.store(apply(base));
      appendPfeLog({
        event: "forecast_generation",
        level: "info",
        details: `${action} portfolio=${updated.portfolioReference} period=${updated.forecastPeriod} confidence=${updated.confidenceScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        forecastRecords: [updated],
        validation: {
          ...validation,
          warnings: [
            ...validation.warnings,
            "Forecast is a structural projection — not a guaranteed outcome",
          ],
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        action,
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  forecastRevenue(
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    return this.runScopedForecast("forecast_revenue", input, config, (base) => {
      const companyCount = input.companyCount ?? this.companyCount();
      const baselineRevenue = input.baselineRevenue ?? base.revenueForecast;
      const result = this.revenueEngine.forecastRevenue({
        baselineRevenue,
        forecastPeriod: this.resolvePeriod(input.forecastPeriod, config),
        config,
        companyCount,
      });
      return {
        ...base,
        forecastId: `pfe-fc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        forecastPeriod: this.resolvePeriod(input.forecastPeriod, config),
        revenueForecast: result.revenueForecast,
        confidenceScore: Math.round((base.confidenceScore + result.confidenceScore) / 2),
      };
    });
  }

  forecastProfit(
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    return this.runScopedForecast("forecast_profit", input, config, (base) => {
      const baselineProfit = input.baselineProfit ?? base.profitForecast;
      const result = this.revenueEngine.forecastProfit({
        revenueForecast: base.revenueForecast,
        baselineProfit,
        config,
      });
      return {
        ...base,
        forecastId: `pfe-fc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        profitForecast: result.profitForecast,
        confidenceScore: Math.round((base.confidenceScore + result.confidenceScore) / 2),
      };
    });
  }

  forecastGrowth(
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    return this.runScopedForecast("forecast_growth", input, config, (base) => {
      const result = this.growthEngine.forecastCompanyGrowth({
        companyCount: input.companyCount ?? this.companyCount(),
        forecastPeriod: this.resolvePeriod(input.forecastPeriod, config),
        config,
      });
      return {
        ...base,
        forecastId: `pfe-fc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        forecastPeriod: this.resolvePeriod(input.forecastPeriod, config),
        growthForecast: result.growthForecast,
        confidenceScore: Math.round((base.confidenceScore + result.confidenceScore) / 2),
      };
    });
  }

  forecastCapital(
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    return this.runScopedForecast("forecast_capital", input, config, (base) => {
      const presence = this.dependencyPresence();
      const result = this.capitalEngine.forecastCapital({
        baselineRevenue: input.baselineRevenue ?? base.revenueForecast,
        growthForecast: base.growthForecast,
        companyCount: input.companyCount ?? this.companyCount(),
        forecastPeriod: this.resolvePeriod(input.forecastPeriod, config),
        config,
        capitalSignalPresent: presence.capitalDistributionEngine,
      });
      return {
        ...base,
        forecastId: `pfe-fc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        capitalRequirementForecast: result.capitalRequirementForecast,
        confidenceScore: Math.round((base.confidenceScore + result.confidenceScore) / 2),
      };
    });
  }

  forecastCustomerGrowth(
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    return this.runScopedForecast("forecast_customer_growth", input, config, (base) => {
      const presence = this.dependencyPresence();
      const result = this.growthEngine.forecastCustomerGrowth({
        companyCount: input.companyCount ?? this.companyCount(),
        forecastPeriod: this.resolvePeriod(input.forecastPeriod, config),
        config,
        customerSignalPresent: presence.sharedCustomerIntelligence,
      });
      return {
        ...base,
        forecastId: `pfe-fc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        customerGrowthForecast: result.customerGrowthForecast,
        confidenceScore: Math.round((base.confidenceScore + result.confidenceScore) / 2),
      };
    });
  }

  forecastSupplierCapacity(
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    return this.runScopedForecast("forecast_supplier_capacity", input, config, (base) => {
      const presence = this.dependencyPresence();
      const result = this.growthEngine.forecastSupplierCapacity({
        companyCount: input.companyCount ?? this.companyCount(),
        forecastPeriod: this.resolvePeriod(input.forecastPeriod, config),
        config,
        supplierSignalPresent: presence.sharedSupplierIntelligence,
      });
      return {
        ...base,
        forecastId: `pfe-fc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        supplierCapacityForecast: result.supplierCapacityForecast,
        confidenceScore: Math.round((base.confidenceScore + result.confidenceScore) / 2),
      };
    });
  }

  forecastRisks(
    input: ForecastRequestInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    return this.runScopedForecast("forecast_risks", input, config, (base) => {
      const presence = this.dependencyPresence();
      const result = this.riskEngine.forecastRisk({
        growthForecast: base.growthForecast,
        capitalRequirementForecast: base.capitalRequirementForecast,
        companyCount: input.companyCount ?? this.companyCount(),
        forecastPeriod: this.resolvePeriod(input.forecastPeriod, config),
        config,
        riskSignalPresent: presence.portfolioRiskEngine,
      });
      return {
        ...base,
        forecastId: `pfe-fc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        riskForecast: result.riskForecast,
        confidenceScore: Math.round((base.confidenceScore + result.confidenceScore) / 2),
      };
    });
  }

  generateScenarios(
    input: GenerateScenariosInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateScenarios(input, config);
      if (validation.decision === "fail") {
        return this.failReport("generate_scenarios", validation.errors, Date.now() - started);
      }

      const base = this.ensureBase(
        {
          portfolioReference: input.portfolioReference,
          forecastPeriod: input.forecastPeriod,
          validated: true,
        },
        config,
      );
      const scenarios = this.scenarioEngine.generateScenarios({ base, config });
      this.scenarios = scenarios;

      appendPfeLog({
        event: "scenario_generation",
        level: "info",
        details: `Generated ${scenarios.length} scenarios for ${base.portfolioReference}`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "generate_scenarios",
        engineRecord,
        forecastRecords: [base],
        scenarios,
        validation: {
          ...validation,
          warnings: [
            ...validation.warnings,
            "Scenarios are structural projections — not guaranteed outcomes",
          ],
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_scenarios",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  generateExecutiveForecast(
    input: GenerateExecutiveForecastInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateExecutive(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "generate_executive_forecast",
          validation.errors,
          Date.now() - started,
        );
      }

      const period = this.resolvePeriod(input.forecastPeriod, config);
      const base = this.ensureBase(
        {
          portfolioReference: input.portfolioReference,
          forecastPeriod: period,
          validated: true,
        },
        config,
      );
      let scenarios = this.scenarios.filter((s) => s.portfolioReference === base.portfolioReference);
      if (scenarios.length === 0) {
        scenarios = this.scenarioEngine.generateScenarios({ base, config });
        this.scenarios = scenarios;
      }
      const executive = this.scenarioEngine.buildExecutiveForecast({
        base,
        scenarios,
        forecastPeriod: period,
      });
      this.store(executive);

      appendPfeLog({
        event: "confidence_calculation",
        level: "info",
        details: `Executive forecast confidence=${executive.confidenceScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "generate_executive_forecast",
        engineRecord,
        forecastRecords: [executive],
        scenarios,
        validation: {
          ...validation,
          warnings: [
            ...validation.warnings,
            "Executive forecast is a structural projection — not a guaranteed outcome",
          ],
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_executive_forecast",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    _input: RunForecastDiagnosticsInput,
    config: PortfolioForecastEngineConfiguration,
  ): ForecastRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) {
      return this.failReport(
        "diagnostics",
        ["Engine not connected"],
        Date.now() - started,
      );
    }

    const presence = this.dependencyPresence();
    const warnings = Object.entries(presence)
      .filter(([, ok]) => !ok)
      .map(([key]) => `${key} unavailable`);

    appendPfeLog({
      event: "health_information",
      level: "info",
      details: `Diagnostics forecasts=${this.forecasts.size} scenarios=${this.scenarios.length}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord: {
        ...engineRecord,
        dependencyPresence: presence,
        healthStatus: warnings.length > 4 ? "degraded" : engineRecord.healthStatus,
      },
      forecastRecords: this.getForecastRecords(),
      scenarios: this.scenarios,
      validation: {
        validationReportId: `pfe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? (warnings.length > 6 ? "partial" : "pass") : "partial",
        errors: [],
        warnings: [
          ...warnings,
          "Forecasts are structural projections — never guaranteed outcomes",
        ],
        durationMs: Date.now() - started,
        metadataVersion: PFE_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
    });
  }
}
