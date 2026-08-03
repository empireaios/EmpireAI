/** X4-04 — Language Intelligence Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CountryIntelligenceEngine } from "../country-intelligence-engine/engine.js";
import type { LocalizationEngine } from "../localization-engine/engine.js";
import {
  LI_CAPABILITIES,
  LI_METADATA_VERSION,
  LANGUAGE_INTELLIGENCE_ID,
} from "./paths.js";
import type { LanguageIntelligenceConfiguration } from "./configuration.js";
import { appendLiLog } from "./li-logging.js";
import { LanguageDetectionEngine } from "./language-detection-engine.js";
import { TranslationEngine } from "./translation-engine.js";
import { TerminologyManagementEngine } from "./terminology-management-engine.js";
import { TranslationQualityEngine } from "./translation-quality-engine.js";
import { LanguageRecommendationEngine } from "./language-recommendation-engine.js";
import { LanguageMetadataGenerator } from "./language-metadata-generator.js";
import { LanguageValidator } from "./language-validator.js";
import { buildLanguageIntelligenceRecord, computeStructuralLanguageSignals } from "./structural-signals.js";
import type {
  ConnectLanguageIntelligenceInput,
  LanguageAnalysisInput,
  LanguageIntelligenceEngineRecord,
  LanguageIntelligenceRecord,
  LanguageRecommendation,
  LanguageValidationReport,
  LiRunReport,
  RunLiDiagnosticsInput,
} from "./types.js";

export type LanguageIntelligenceDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
  countryIntelligenceEngine?: CountryIntelligenceEngine | null;
  localizationEngine?: LocalizationEngine | null;
};

export class LanguageIntelligenceManager {
  private engineRecord: LanguageIntelligenceEngineRecord | null = null;
  private languageRecords: LanguageIntelligenceRecord[] = [];
  private recommendations: LanguageRecommendation[] = [];

  private readonly detectionEngine = new LanguageDetectionEngine();
  private readonly translationEngine = new TranslationEngine();
  private readonly terminologyEngine = new TerminologyManagementEngine();
  private readonly qualityEngine = new TranslationQualityEngine();
  private readonly recommendationEngine = new LanguageRecommendationEngine();
  private readonly metadataGenerator = new LanguageMetadataGenerator();
  private readonly validator = new LanguageValidator();

  constructor(private readonly deps: LanguageIntelligenceDependencies = {}) {}

  getEngineRecord(): LanguageIntelligenceEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getLanguageRecords(): LanguageIntelligenceRecord[] {
    return this.languageRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): LanguageRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  unsupportedCount(): number {
    return this.languageRecords.filter((r) => r.supportedLanguageStatus === "unsupported")
      .length;
  }

  averageQualityScore(): number {
    if (this.languageRecords.length === 0) return 0;
    const sum = this.languageRecords.reduce((acc, r) => acc + r.translationQualityScore, 0);
    return Math.round(sum / this.languageRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.languageRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): LanguageIntelligenceEngineRecord["dependencyPresence"] {
    return {
      globalExpansionFramework: Boolean(this.deps.globalExpansionFramework),
      countryIntelligenceEngine: Boolean(this.deps.countryIntelligenceEngine),
      localizationEngine: Boolean(this.deps.localizationEngine),
    };
  }

  private requireConnected(): LanguageIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Language Intelligence not connected — call connectLanguageIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: LanguageIntelligenceRecord): void {
    const key = `${record.language}::${record.translationCategory}`;
    const idx = this.languageRecords.findIndex(
      (r) => `${r.language}::${r.translationCategory}` === key,
    );
    if (idx >= 0) this.languageRecords[idx] = record;
    else this.languageRecords.push(record);
  }

  failReport(
    action: LiRunReport["action"],
    errors: string[],
    durationMs: number,
  ): LiRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "li-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: LANGUAGE_INTELLIGENCE_ID,
        engineVersion: "PILLOW-LI-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...LI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: LI_METADATA_VERSION,
      } satisfies LanguageIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `li-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: LI_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: LanguageIntelligenceConfiguration): {
    frameworkModuleId: string | null;
    validation: LanguageValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: LANGUAGE_INTELLIGENCE_ID,
        moduleVersion: LI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-04",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "language.detected",
            "language.translated",
            "language.terminology",
            "language.quality",
            "language.unsupported",
            "language.recommended",
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
      this.deps.globalExpansionFramework.activateExpansionModule(LANGUAGE_INTELLIGENCE_ID);
    }

    appendLiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Language Intelligence with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `li-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: LI_METADATA_VERSION,
      },
    };
  }

  connectLanguageIntelligence(
    _input: ConnectLanguageIntelligenceInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
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
      presence.localizationEngine;

    this.engineRecord = {
      engineRecordId: `li-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: LANGUAGE_INTELLIGENCE_ID,
      engineVersion: "PILLOW-LI-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...LI_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: LI_METADATA_VERSION,
    };

    appendLiLog({
      event: "engine_connected",
      level: "info",
      details:
        "Language Intelligence connected — structural signals only; never overwrite canonical source automatically",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      `Supported languages: ${config.supportedLanguages.join(", ")}`,
      "Structural language signals only — no live translation APIs",
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
    action: LiRunReport["action"],
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
    producer: () => LanguageIntelligenceRecord,
  ): LiRunReport {
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
      appendLiLog({
        event: action,
        level: "info",
        details: `${record.language}/${record.translationCategory} quality=${record.translationQualityScore} status=${record.supportedLanguageStatus}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        languageRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendLiLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  detectLanguage(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
    return this.runValidated("detect_language", input, config, () =>
      this.detectionEngine.detect(input, config),
    );
  }

  manageSupportedLanguages(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "manage_supported_languages",
          validation.errors,
          Date.now() - started,
        );
      }

      const records = config.supportedLanguages.map((language) => {
        const signals = computeStructuralLanguageSignals(
          { ...input, language, validated: true },
          config,
        );
        return buildLanguageIntelligenceRecord({
          ...signals,
          recommendationSummary: `Managed supported language ${language} (${signals.supportedLanguageStatus})`,
        });
      });
      for (const record of records) this.storeRecord(record);
      engineRecord.currentOperationalState = "active";

      appendLiLog({
        event: "manage_supported_languages",
        level: "info",
        details: `Managed ${records.length} supported languages`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "manage_supported_languages",
        engineRecord,
        languageRecords: records,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendLiLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("manage_supported_languages", [message], Date.now() - started);
    }
  }

  translateCustomerFacing(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
    return this.runValidated("translate_customer_facing", input, config, () =>
      this.translationEngine.translate(input, config, "customer_facing"),
    );
  }

  translateOperational(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
    return this.runValidated("translate_operational", input, config, () =>
      this.translationEngine.translate(input, config, "operational"),
    );
  }

  translateAiWorkforce(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
    return this.runValidated("translate_ai_workforce", input, config, () =>
      this.translationEngine.translate(input, config, "ai_workforce"),
    );
  }

  maintainTerminology(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
    return this.runValidated("maintain_terminology", input, config, () =>
      this.terminologyEngine.maintain(input, config),
    );
  }

  analyzeQuality(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
    return this.runValidated("analyze_quality", input, config, () =>
      this.qualityEngine.analyze(input, config),
    );
  }

  detectUnsupported(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(
        { ...input, validated: input.validated ?? true },
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport("detect_unsupported", validation.errors, Date.now() - started);
      }

      if (this.languageRecords.length === 0) {
        const seed = this.detectionEngine.detect({ ...input, validated: true }, config);
        this.storeRecord(seed);
      }

      const unsupported = this.qualityEngine.detectUnsupported(this.languageRecords);
      engineRecord.currentOperationalState = "active";

      appendLiLog({
        event: "unsupported_language_detection",
        level: "info",
        details: `Detected ${unsupported.length} unsupported language requests`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "detect_unsupported",
        engineRecord,
        languageRecords: unsupported,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendLiLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("detect_unsupported", [message], Date.now() - started);
    }
  }

  recommendLanguage(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport("recommend_language", validation.errors, Date.now() - started);
      }

      if (this.languageRecords.length === 0) {
        const seed = this.detectionEngine.detect(input, config);
        this.storeRecord(seed);
      }

      const eligible = this.languageRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverOverwriteCanonicalSourceContentAutomatically === true,
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_language",
          ["No validated language records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendLiLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} language recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_language",
        engineRecord,
        languageRecords: this.languageRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendLiLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_language", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunLiDiagnosticsInput,
    config: LanguageIntelligenceConfiguration,
  ): LiRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `li-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: LANGUAGE_INTELLIGENCE_ID,
        engineVersion: "PILLOW-LI-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...LI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: LI_METADATA_VERSION,
      } satisfies LanguageIntelligenceEngineRecord);

    appendLiLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · languages=${this.languageRecords.length} · unsupported=${this.unsupportedCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      languageRecords: this.languageRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
