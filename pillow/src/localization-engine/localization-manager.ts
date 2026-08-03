/** X4-03 — Localization Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CountryIntelligenceEngine } from "../country-intelligence-engine/engine.js";
import {
  LOC_CAPABILITIES,
  LOC_METADATA_VERSION,
  LOCALIZATION_ENGINE_ID,
} from "./paths.js";
import type { LocalizationEngineConfiguration } from "./configuration.js";
import { appendLocLog } from "./loc-logging.js";
import { ProductLocalizationEngine } from "./product-localization-engine.js";
import { ContentLocalizationEngine } from "./content-localization-engine.js";
import { BrandLocalizationEngine } from "./brand-localization-engine.js";
import { RegionalAdaptationEngine } from "./regional-adaptation-engine.js";
import { LocalizationRecommendationEngine } from "./localization-recommendation-engine.js";
import { LocalizationMetadataGenerator } from "./localization-metadata-generator.js";
import { LocalizationValidator } from "./localization-validator.js";
import type {
  ConnectLocalizationEngineInput,
  LocalizationCategory,
  LocalizationEngineRecord,
  LocalizationInput,
  LocalizationRecommendation,
  LocalizationRecord,
  LocalizationValidationReport,
  LocRunReport,
  RunLocDiagnosticsInput,
} from "./types.js";

export type LocalizationEngineDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
  countryIntelligenceEngine?: CountryIntelligenceEngine | null;
};

export class LocalizationManager {
  private engineRecord: LocalizationEngineRecord | null = null;
  private localizationRecords: LocalizationRecord[] = [];
  private recommendations: LocalizationRecommendation[] = [];

  private readonly productEngine = new ProductLocalizationEngine();
  private readonly contentEngine = new ContentLocalizationEngine();
  private readonly brandEngine = new BrandLocalizationEngine();
  private readonly regionalEngine = new RegionalAdaptationEngine();
  private readonly recommendationEngine = new LocalizationRecommendationEngine();
  private readonly metadataGenerator = new LocalizationMetadataGenerator();
  private readonly validator = new LocalizationValidator();

  constructor(private readonly deps: LocalizationEngineDependencies = {}) {}

  getEngineRecord(): LocalizationEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getLocalizationRecords(): LocalizationRecord[] {
    return this.localizationRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): LocalizationRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  gapCount(): number {
    return this.localizationRecords.filter(
      (r) => r.gapScore >= 35 || r.readinessScore < 60,
    ).length;
  }

  averageReadinessScore(): number {
    if (this.localizationRecords.length === 0) return 0;
    const sum = this.localizationRecords.reduce((acc, r) => acc + r.readinessScore, 0);
    return Math.round(sum / this.localizationRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.localizationRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): LocalizationEngineRecord["dependencyPresence"] {
    return {
      globalExpansionFramework: Boolean(this.deps.globalExpansionFramework),
      countryIntelligenceEngine: Boolean(this.deps.countryIntelligenceEngine),
    };
  }

  private requireConnected(): LocalizationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Localization Engine not connected — call connectLocalizationEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: LocalizationRecord): void {
    const key = `${record.targetCountry}::${record.localizationCategory}`;
    const idx = this.localizationRecords.findIndex(
      (r) => `${r.targetCountry}::${r.localizationCategory}` === key,
    );
    if (idx >= 0) this.localizationRecords[idx] = record;
    else this.localizationRecords.push(record);
  }

  failReport(
    action: LocRunReport["action"],
    errors: string[],
    durationMs: number,
  ): LocRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "loc-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: LOCALIZATION_ENGINE_ID,
        engineVersion: "PILLOW-LOC-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...LOC_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: LOC_METADATA_VERSION,
      } satisfies LocalizationEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `loc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: LOC_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: LocalizationEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: LocalizationValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: LOCALIZATION_ENGINE_ID,
        moduleVersion: LOC_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-03",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "localization.product",
            "localization.service",
            "localization.storefront",
            "localization.brand",
            "localization.marketing",
            "localization.customer_experience",
            "localization.regional",
            "localization.gaps",
            "localization.recommended",
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
      this.deps.globalExpansionFramework.activateExpansionModule(LOCALIZATION_ENGINE_ID);
    }

    appendLocLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Localization Engine with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `loc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: LOC_METADATA_VERSION,
      },
    };
  }

  connectLocalizationEngine(
    _input: ConnectLocalizationEngineInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady =
      presence.globalExpansionFramework && presence.countryIntelligenceEngine;

    this.engineRecord = {
      engineRecordId: `loc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: LOCALIZATION_ENGINE_ID,
      engineVersion: "PILLOW-LOC-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...LOC_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: LOC_METADATA_VERSION,
    };

    appendLocLog({
      event: "engine_connected",
      level: "info",
      details:
        "Localization Engine connected — structural signals only; never overwrite canonical source content",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural localization signals only — never overwrite canonical source content",
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
    action: LocRunReport["action"],
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
    producer: () => LocalizationRecord,
  ): LocRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendLocLog({
        event: action,
        level: "info",
        details: `${record.targetCountry}/${record.localizationCategory} readiness=${record.readinessScore} gap=${record.gapScore}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        localizationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendLocLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  localizeProduct(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    return this.runValidated("localize_product", input, config, () =>
      this.productEngine.localize(input, config),
    );
  }

  localizeService(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    return this.runValidated("localize_service", input, config, () =>
      this.contentEngine.localize(input, config, "service"),
    );
  }

  localizeStorefront(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    return this.runValidated("localize_storefront", input, config, () =>
      this.contentEngine.localize(input, config, "storefront"),
    );
  }

  localizeBrand(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    return this.runValidated("localize_brand", input, config, () =>
      this.brandEngine.localize(input, config),
    );
  }

  localizeMarketing(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    return this.runValidated("localize_marketing", input, config, () =>
      this.contentEngine.localize(input, config, "marketing"),
    );
  }

  localizeCustomerExperience(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    return this.runValidated("localize_customer_experience", input, config, () =>
      this.contentEngine.localize(input, config, "customer_experience"),
    );
  }

  adaptRegion(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    if (!config.regionalAdaptationRulesEnabled) {
      return this.failReport("adapt_region", ["Regional adaptation rules disabled"], 0);
    }
    return this.runValidated("adapt_region", input, config, () =>
      this.regionalEngine.adapt(input, config),
    );
  }

  detectGaps(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(
        { ...input, validated: input.validated ?? true },
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport("detect_gaps", validation.errors, Date.now() - started);
      }

      if (this.localizationRecords.length === 0) {
        const seed = this.productEngine.localize(
          { ...input, validated: true },
          config,
        );
        this.storeRecord(seed);
      }

      const gaps = this.regionalEngine.detectGaps(this.localizationRecords);
      engineRecord.currentOperationalState = "active";

      appendLocLog({
        event: "localization_gap_detection",
        level: "info",
        details: `Detected ${gaps.length} localization gaps`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "detect_gaps",
        engineRecord,
        localizationRecords: gaps,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendLocLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("detect_gaps", [message], Date.now() - started);
    }
  }

  recommendLocalization(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport(
          "recommend_localization",
          validation.errors,
          Date.now() - started,
        );
      }

      if (this.localizationRecords.length === 0) {
        const seed = this.productEngine.localize(input, config);
        this.storeRecord(seed);
      }

      // Never recommend overwriting canonical source; only validated structural records.
      const eligible = this.localizationRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverOverwriteCanonicalSourceContent === true,
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_localization",
          ["No validated localization records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendLocLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} localization recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_localization",
        engineRecord,
        localizationRecords: this.localizationRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendLocLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_localization", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunLocDiagnosticsInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `loc-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: LOCALIZATION_ENGINE_ID,
        engineVersion: "PILLOW-LOC-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...LOC_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: LOC_METADATA_VERSION,
      } satisfies LocalizationEngineRecord);

    appendLocLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · localizations=${this.localizationRecords.length} · gaps=${this.gapCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      localizationRecords: this.localizationRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }

  /** Convenience for category-routed localization (internal/tests). */
  localizeCategory(
    category: LocalizationCategory,
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocRunReport {
    switch (category) {
      case "product":
        return this.localizeProduct(input, config);
      case "service":
        return this.localizeService(input, config);
      case "storefront":
        return this.localizeStorefront(input, config);
      case "branding":
        return this.localizeBrand(input, config);
      case "marketing":
        return this.localizeMarketing(input, config);
      case "customer_experience":
        return this.localizeCustomerExperience(input, config);
      default:
        return this.failReport("localize_product", [`Unknown category: ${category}`], 0);
    }
  }
}
