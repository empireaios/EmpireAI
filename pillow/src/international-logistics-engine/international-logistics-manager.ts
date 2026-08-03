/** X4-08 — International Logistics Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CountryIntelligenceEngine } from "../country-intelligence-engine/engine.js";
import type { LocalizationEngine } from "../localization-engine/engine.js";
import type { LanguageIntelligenceEngine } from "../language-intelligence/engine.js";
import type { CurrencyIntelligenceEngine } from "../currency-intelligence/engine.js";
import type { RegionalComplianceEngine } from "../regional-compliance-engine/engine.js";
import type { GlobalTaxIntelligenceEngine } from "../global-tax-intelligence/engine.js";
import {
  ILE_CAPABILITIES,
  ILE_METADATA_VERSION,
  INTERNATIONAL_LOGISTICS_ENGINE_ID,
} from "./paths.js";
import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import { appendIleLog } from "./ile-logging.js";
import { GlobalShippingEngine } from "./global-shipping-engine.js";
import { LogisticsProviderEngine } from "./logistics-provider-engine.js";
import { FulfillmentIntelligenceEngine } from "./fulfillment-intelligence-engine.js";
import { RouteOptimizationEngine } from "./route-optimization-engine.js";
import { LogisticsRecommendationEngine } from "./logistics-recommendation-engine.js";
import { LogisticsMetadataGenerator } from "./logistics-metadata-generator.js";
import { LogisticsValidator } from "./logistics-validator.js";
import type {
  ConnectInternationalLogisticsEngineInput,
  IleRunReport,
  InternationalLogisticsEngineRecord,
  LogisticsAnalysisInput,
  LogisticsRecommendation,
  LogisticsRecord,
  LogisticsValidationReport,
  RunIleDiagnosticsInput,
} from "./types.js";

export type InternationalLogisticsEngineDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
  countryIntelligenceEngine?: CountryIntelligenceEngine | null;
  localizationEngine?: LocalizationEngine | null;
  languageIntelligence?: LanguageIntelligenceEngine | null;
  currencyIntelligence?: CurrencyIntelligenceEngine | null;
  regionalComplianceEngine?: RegionalComplianceEngine | null;
  globalTaxIntelligence?: GlobalTaxIntelligenceEngine | null;
};

export class InternationalLogisticsManager {
  private engineRecord: InternationalLogisticsEngineRecord | null = null;
  private logisticsRecords: LogisticsRecord[] = [];
  private recommendations: LogisticsRecommendation[] = [];

  private readonly shippingEngine = new GlobalShippingEngine();
  private readonly providerEngine = new LogisticsProviderEngine();
  private readonly fulfillmentEngine = new FulfillmentIntelligenceEngine();
  private readonly routeEngine = new RouteOptimizationEngine();
  private readonly recommendationEngine = new LogisticsRecommendationEngine();
  private readonly metadataGenerator = new LogisticsMetadataGenerator();
  private readonly validator = new LogisticsValidator();

  constructor(private readonly deps: InternationalLogisticsEngineDependencies = {}) {}

  getEngineRecord(): InternationalLogisticsEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getLogisticsRecords(): LogisticsRecord[] {
    return this.logisticsRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): LogisticsRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  bottleneckCount(): number {
    return this.fulfillmentEngine.bottleneckCount(this.logisticsRecords);
  }

  fulfillmentRiskCount(): number {
    return this.fulfillmentEngine.fulfillmentRiskCount(this.logisticsRecords);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.logisticsRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): InternationalLogisticsEngineRecord["dependencyPresence"] {
    return {
      globalExpansionFramework: Boolean(this.deps.globalExpansionFramework),
      countryIntelligenceEngine: Boolean(this.deps.countryIntelligenceEngine),
      localizationEngine: Boolean(this.deps.localizationEngine),
      languageIntelligence: Boolean(this.deps.languageIntelligence),
      currencyIntelligence: Boolean(this.deps.currencyIntelligence),
      regionalComplianceEngine: Boolean(this.deps.regionalComplianceEngine),
      globalTaxIntelligence: Boolean(this.deps.globalTaxIntelligence),
    };
  }

  private requireConnected(): InternationalLogisticsEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "International Logistics Engine not connected — call connectInternationalLogisticsEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: LogisticsRecord): void {
    const key = `${record.originRegion}::${record.destinationRegion}::${record.logisticsCategory}`;
    const idx = this.logisticsRecords.findIndex(
      (r) =>
        `${r.originRegion}::${r.destinationRegion}::${r.logisticsCategory}` === key,
    );
    if (idx >= 0) this.logisticsRecords[idx] = record;
    else this.logisticsRecords.push(record);
  }

  failReport(
    action: IleRunReport["action"],
    errors: string[],
    durationMs: number,
  ): IleRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "ile-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: INTERNATIONAL_LOGISTICS_ENGINE_ID,
        engineVersion: "PILLOW-ILE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...ILE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: ILE_METADATA_VERSION,
      } satisfies InternationalLogisticsEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `ile-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: ILE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: InternationalLogisticsEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: LogisticsValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: INTERNATIONAL_LOGISTICS_ENGINE_ID,
        moduleVersion: ILE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-08",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "logistics.shipping_network",
            "logistics.provider",
            "logistics.performance",
            "logistics.delivery",
            "logistics.capacity",
            "logistics.cost",
            "logistics.bottleneck",
            "logistics.fulfillment_risk",
            "logistics.route",
            "logistics.recommended",
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
      this.deps.globalExpansionFramework.activateExpansionModule(
        INTERNATIONAL_LOGISTICS_ENGINE_ID,
      );
    }

    appendIleLog({
      event: "framework_registration",
      level: "info",
      details: `Registered International Logistics Engine with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `ile-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: ILE_METADATA_VERSION,
      },
    };
  }

  connectInternationalLogisticsEngine(
    _input: ConnectInternationalLogisticsEngineInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady = Object.values(presence).every(Boolean);

    this.engineRecord = {
      engineRecordId: `ile-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: INTERNATIONAL_LOGISTICS_ENGINE_ID,
      engineVersion: "PILLOW-ILE-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...ILE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: ILE_METADATA_VERSION,
    };

    appendIleLog({
      event: "engine_connected",
      level: "info",
      details:
        "International Logistics Engine connected — structural signals only; never recommend with unvalidated data",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural logistics signals only — no live carrier APIs; never recommend with unvalidated data",
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
    action: IleRunReport["action"],
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
    producer: () => LogisticsRecord,
  ): IleRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      if (
        record.unvalidatedRecommendationClaim !== "none" ||
        !record.neverRecommendWithUnvalidatedLogisticsData
      ) {
        return this.failReport(
          action,
          ["Never generate shipping recommendations using unvalidated logistics data"],
          Date.now() - started,
        );
      }
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendIleLog({
        event: action,
        level: "info",
        details: `${record.originRegion}->${record.destinationRegion}/${record.logisticsCategory} status=${record.fulfillmentStatus}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        logisticsRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendIleLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  manageShippingNetworks(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    return this.runValidated("manage_shipping_networks", input, config, () =>
      this.shippingEngine.manageShippingNetworks(input, config),
    );
  }

  monitorProviders(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    return this.runValidated("monitor_providers", input, config, () =>
      this.providerEngine.monitorProviders(input, config),
    );
  }

  monitorShippingPerformance(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    return this.runValidated("monitor_shipping_performance", input, config, () =>
      this.shippingEngine.monitorShippingPerformance(input, config),
    );
  }

  monitorDeliveryTimes(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    return this.runValidated("monitor_delivery_times", input, config, () =>
      this.shippingEngine.monitorDeliveryTimes(input, config),
    );
  }

  monitorFulfillmentCapacity(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    return this.runValidated("monitor_fulfillment_capacity", input, config, () =>
      this.fulfillmentEngine.monitorFulfillmentCapacity(input, config),
    );
  }

  monitorShippingCosts(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    return this.runValidated("monitor_shipping_costs", input, config, () =>
      this.shippingEngine.monitorShippingCosts(input, config),
    );
  }

  detectBottlenecks(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    return this.runValidated("detect_bottlenecks", input, config, () =>
      this.fulfillmentEngine.detectBottlenecks(input, config),
    );
  }

  detectFulfillmentRisks(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    return this.runValidated("detect_fulfillment_risks", input, config, () =>
      this.fulfillmentEngine.detectFulfillmentRisks(input, config),
    );
  }

  optimizeRoutes(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    return this.runValidated("optimize_routes", input, config, () =>
      this.routeEngine.optimizeRoutes(input, config),
    );
  }

  recommendLogistics(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport(
          "recommend_logistics",
          validation.errors,
          Date.now() - started,
        );
      }

      if (this.logisticsRecords.length === 0) {
        const seed = this.shippingEngine.manageShippingNetworks(input, config);
        this.storeRecord(seed);
      }

      const eligible = this.logisticsRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverRecommendWithUnvalidatedLogisticsData === true &&
          r.unvalidatedRecommendationClaim === "none",
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_logistics",
          ["No validated logistics records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendIleLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} logistics recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_logistics",
        engineRecord,
        logisticsRecords: this.logisticsRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendIleLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_logistics", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunIleDiagnosticsInput,
    config: InternationalLogisticsEngineConfiguration,
  ): IleRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `ile-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: INTERNATIONAL_LOGISTICS_ENGINE_ID,
        engineVersion: "PILLOW-ILE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...ILE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: ILE_METADATA_VERSION,
      } satisfies InternationalLogisticsEngineRecord);

    appendIleLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.logisticsRecords.length} · bottlenecks=${this.bottleneckCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      logisticsRecords: this.logisticsRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
