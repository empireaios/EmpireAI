/** X4-05 — Currency Intelligence Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CountryIntelligenceEngine } from "../country-intelligence-engine/engine.js";
import type { LocalizationEngine } from "../localization-engine/engine.js";
import type { LanguageIntelligenceEngine } from "../language-intelligence/engine.js";
import {
  CUR_CAPABILITIES,
  CUR_METADATA_VERSION,
  CURRENCY_INTELLIGENCE_ID,
} from "./paths.js";
import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import { appendCurLog } from "./cur-logging.js";
import { CurrencyManagementEngine } from "./currency-management-engine.js";
import { ExchangeRateEngine } from "./exchange-rate-engine.js";
import { RegionalPricingEngine } from "./regional-pricing-engine.js";
import { CurrencyAnalyticsEngine } from "./currency-analytics-engine.js";
import { CurrencyRecommendationEngine } from "./currency-recommendation-engine.js";
import { CurrencyMetadataGenerator } from "./currency-metadata-generator.js";
import { CurrencyValidator } from "./currency-validator.js";
import type {
  ConnectCurrencyIntelligenceInput,
  CurrencyAnalysisInput,
  CurrencyIntelligenceEngineRecord,
  CurrencyIntelligenceRecord,
  CurrencyRecommendation,
  CurrencyValidationReport,
  CurRunReport,
  RunCurDiagnosticsInput,
} from "./types.js";

export type CurrencyIntelligenceDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
  countryIntelligenceEngine?: CountryIntelligenceEngine | null;
  localizationEngine?: LocalizationEngine | null;
  languageIntelligence?: LanguageIntelligenceEngine | null;
};

export class CurrencyIntelligenceManager {
  private engineRecord: CurrencyIntelligenceEngineRecord | null = null;
  private currencyRecords: CurrencyIntelligenceRecord[] = [];
  private recommendations: CurrencyRecommendation[] = [];

  private readonly managementEngine = new CurrencyManagementEngine();
  private readonly exchangeEngine = new ExchangeRateEngine();
  private readonly pricingEngine = new RegionalPricingEngine();
  private readonly analyticsEngine = new CurrencyAnalyticsEngine();
  private readonly recommendationEngine = new CurrencyRecommendationEngine();
  private readonly metadataGenerator = new CurrencyMetadataGenerator();
  private readonly validator = new CurrencyValidator();

  constructor(private readonly deps: CurrencyIntelligenceDependencies = {}) {}

  getEngineRecord(): CurrencyIntelligenceEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getCurrencyRecords(): CurrencyIntelligenceRecord[] {
    return this.currencyRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): CurrencyRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  anomalyCount(): number {
    return this.analyticsEngine.filterAnomalies(this.currencyRecords).length;
  }

  averageFluctuationPercent(): number {
    if (this.currencyRecords.length === 0) return 0;
    const sum = this.currencyRecords.reduce((acc, r) => acc + r.fluctuationPercent, 0);
    return Math.round((sum / this.currencyRecords.length) * 10) / 10;
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.currencyRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): CurrencyIntelligenceEngineRecord["dependencyPresence"] {
    return {
      globalExpansionFramework: Boolean(this.deps.globalExpansionFramework),
      countryIntelligenceEngine: Boolean(this.deps.countryIntelligenceEngine),
      localizationEngine: Boolean(this.deps.localizationEngine),
      languageIntelligence: Boolean(this.deps.languageIntelligence),
    };
  }

  private requireConnected(): CurrencyIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Currency Intelligence not connected — call connectCurrencyIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: CurrencyIntelligenceRecord): void {
    const idx = this.currencyRecords.findIndex((r) => r.currencyCode === record.currencyCode);
    if (idx >= 0) this.currencyRecords[idx] = record;
    else this.currencyRecords.push(record);
  }

  failReport(
    action: CurRunReport["action"],
    errors: string[],
    durationMs: number,
  ): CurRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "cur-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: CURRENCY_INTELLIGENCE_ID,
        engineVersion: "PILLOW-CUR-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...CUR_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: CUR_METADATA_VERSION,
      } satisfies CurrencyIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `cur-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: CUR_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: CurrencyIntelligenceConfiguration): {
    frameworkModuleId: string | null;
    validation: CurrencyValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: CURRENCY_INTELLIGENCE_ID,
        moduleVersion: CUR_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-05",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "currency.managed",
            "currency.preference",
            "currency.converted",
            "currency.rates.refreshed",
            "currency.fluctuation",
            "currency.pricing",
            "currency.anomaly",
            "currency.recommended",
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
          "global_expansion_module_registration",
          "international_expansion_lifecycle_management",
          "global_expansion_event_routing",
          "regional_data_abstraction",
          "global_expansion_validation",
          "diagnostics",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.globalExpansionFramework.activateExpansionModule(CURRENCY_INTELLIGENCE_ID);
    }

    appendCurLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Currency Intelligence with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `cur-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CUR_METADATA_VERSION,
      },
    };
  }

  connectCurrencyIntelligence(
    _input: ConnectCurrencyIntelligenceInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady =
      presence.globalExpansionFramework &&
      presence.countryIntelligenceEngine &&
      presence.localizationEngine &&
      presence.languageIntelligence;

    this.engineRecord = {
      engineRecordId: `cur-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CURRENCY_INTELLIGENCE_ID,
      engineVersion: "PILLOW-CUR-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...CUR_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: CUR_METADATA_VERSION,
    };

    appendCurLog({
      event: "engine_connected",
      level: "info",
      details:
        "Currency Intelligence connected — structural FX only; never convert with unvalidated exchange data",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      `Supported currencies: ${config.supportedCurrencies.join(", ")}`,
      "Structural FX baselines only — no live exchange provider APIs",
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
            : !depsReady
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  private runValidated(
    action: CurRunReport["action"],
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
    producer: () => CurrencyIntelligenceRecord,
    opts: { requireExchangeValidation?: boolean } = {},
  ): CurRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config, opts);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendCurLog({
        event: action,
        level: "info",
        details: `${record.currencyCode} source=${record.exchangeRateSource} fluct=${record.fluctuationPercent}%`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        currencyRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCurLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  manageCurrencies(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport("manage_currencies", validation.errors, Date.now() - started);
      }
      const records = this.managementEngine.manageSupported(input, config);
      for (const record of records) this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      appendCurLog({
        event: "manage_currencies",
        level: "info",
        details: `Managed ${records.length} supported currencies`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "manage_currencies",
        engineRecord,
        currencyRecords: records,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCurLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("manage_currencies", [message], Date.now() - started);
    }
  }

  detectPreference(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurRunReport {
    return this.runValidated("detect_preference", input, config, () =>
      this.managementEngine.detectPreference(input, config),
    );
  }

  convertPrice(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config, {
        requireExchangeValidation: true,
      });
      if (validation.decision === "fail") {
        return this.failReport("convert_price", validation.errors, Date.now() - started);
      }

      const result = this.exchangeEngine.convert(input, config);
      if (result.blocked) {
        this.storeRecord(result.record);
        return this.failReport(
          "convert_price",
          [result.reason ?? "Conversion blocked"],
          Date.now() - started,
        );
      }

      this.storeRecord(result.record);
      engineRecord.currentOperationalState = "active";
      appendCurLog({
        event: "currency_conversion",
        level: "info",
        details: `Converted ${input.currencyCode ?? "USD"}→${input.targetCurrencyCode ?? "USD"} (validated structural)`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "convert_price",
        engineRecord,
        currencyRecords: [result.record],
        validation,
        durationMs: Date.now() - started,
        convertedAmount: result.convertedAmount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCurLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("convert_price", [message], Date.now() - started);
    }
  }

  refreshExchangeRates(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurRunReport {
    if (!config.exchangeRateRefreshRulesEnabled) {
      return this.failReport("refresh_exchange_rates", ["Exchange rate refresh rules disabled"], 0);
    }
    return this.runValidated("refresh_exchange_rates", input, config, () =>
      this.exchangeEngine.refresh(input, config),
    );
  }

  monitorFluctuations(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurRunReport {
    return this.runValidated("monitor_fluctuations", input, config, () =>
      this.exchangeEngine.monitorFluctuations(input, config),
    );
  }

  regionalPricing(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurRunReport {
    return this.runValidated("regional_pricing", input, config, () =>
      this.pricingEngine.price(input, config),
    );
  }

  detectAnomalies(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurRunReport {
    return this.runValidated("detect_anomalies", input, config, () =>
      this.analyticsEngine.detectAnomalies(input, config),
    );
  }

  recommendCurrency(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport("recommend_currency", validation.errors, Date.now() - started);
      }

      if (this.currencyRecords.length === 0) {
        const seed = this.managementEngine.detectPreference(input, config);
        this.storeRecord(seed);
      }

      const eligible = this.currencyRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverPerformFinancialConversionsUsingUnvalidatedExchangeData === true,
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_currency",
          ["No validated currency records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendCurLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} currency recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_currency",
        engineRecord,
        currencyRecords: this.currencyRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCurLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_currency", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunCurDiagnosticsInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `cur-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: CURRENCY_INTELLIGENCE_ID,
        engineVersion: "PILLOW-CUR-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...CUR_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: CUR_METADATA_VERSION,
      } satisfies CurrencyIntelligenceEngineRecord);

    appendCurLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · currencies=${this.currencyRecords.length} · anomalies=${this.anomalyCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      currencyRecords: this.currencyRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
