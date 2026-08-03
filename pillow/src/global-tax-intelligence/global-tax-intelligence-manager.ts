/** X4-07 — Global Tax Intelligence Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CountryIntelligenceEngine } from "../country-intelligence-engine/engine.js";
import type { LocalizationEngine } from "../localization-engine/engine.js";
import type { LanguageIntelligenceEngine } from "../language-intelligence/engine.js";
import type { CurrencyIntelligenceEngine } from "../currency-intelligence/engine.js";
import type { RegionalComplianceEngine } from "../regional-compliance-engine/engine.js";
import {
  GTI_CAPABILITIES,
  GTI_METADATA_VERSION,
  GLOBAL_TAX_INTELLIGENCE_ID,
} from "./paths.js";
import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import { appendGtiLog } from "./gti-logging.js";
import { InternationalTaxRulesEngine } from "./international-tax-rules-engine.js";
import { TaxCalculationEngine } from "./tax-calculation-engine.js";
import { TaxComplianceEngine } from "./tax-compliance-engine.js";
import { TaxRiskAnalyzer } from "./tax-risk-analyzer.js";
import { TaxRecommendationEngine } from "./tax-recommendation-engine.js";
import { TaxMetadataGenerator } from "./tax-metadata-generator.js";
import { TaxValidator } from "./tax-validator.js";
import type {
  ConnectGlobalTaxIntelligenceInput,
  GlobalTaxIntelligenceEngineRecord,
  GtiRunReport,
  RunGtiDiagnosticsInput,
  TaxAnalysisInput,
  TaxIntelligenceRecord,
  TaxRecommendation,
  TaxValidationReport,
} from "./types.js";

export type GlobalTaxIntelligenceDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
  countryIntelligenceEngine?: CountryIntelligenceEngine | null;
  localizationEngine?: LocalizationEngine | null;
  languageIntelligence?: LanguageIntelligenceEngine | null;
  currencyIntelligence?: CurrencyIntelligenceEngine | null;
  regionalComplianceEngine?: RegionalComplianceEngine | null;
};

export class GlobalTaxIntelligenceManager {
  private engineRecord: GlobalTaxIntelligenceEngineRecord | null = null;
  private taxRecords: TaxIntelligenceRecord[] = [];
  private recommendations: TaxRecommendation[] = [];

  private readonly rulesEngine = new InternationalTaxRulesEngine();
  private readonly calculationEngine = new TaxCalculationEngine();
  private readonly complianceEngine = new TaxComplianceEngine();
  private readonly riskAnalyzer = new TaxRiskAnalyzer();
  private readonly recommendationEngine = new TaxRecommendationEngine();
  private readonly metadataGenerator = new TaxMetadataGenerator();
  private readonly validator = new TaxValidator();

  constructor(private readonly deps: GlobalTaxIntelligenceDependencies = {}) {}

  getEngineRecord(): GlobalTaxIntelligenceEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getTaxRecords(): TaxIntelligenceRecord[] {
    return this.taxRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): TaxRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  highRiskCount(): number {
    return this.riskAnalyzer.highRiskCount(this.taxRecords);
  }

  optimizationCount(): number {
    return this.riskAnalyzer.optimizationCount(this.taxRecords);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.taxRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): GlobalTaxIntelligenceEngineRecord["dependencyPresence"] {
    return {
      globalExpansionFramework: Boolean(this.deps.globalExpansionFramework),
      countryIntelligenceEngine: Boolean(this.deps.countryIntelligenceEngine),
      localizationEngine: Boolean(this.deps.localizationEngine),
      languageIntelligence: Boolean(this.deps.languageIntelligence),
      currencyIntelligence: Boolean(this.deps.currencyIntelligence),
      regionalComplianceEngine: Boolean(this.deps.regionalComplianceEngine),
    };
  }

  private requireConnected(): GlobalTaxIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Global Tax Intelligence not connected — call connectGlobalTaxIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: TaxIntelligenceRecord): void {
    const key = `${record.country}::${record.taxCategory}`;
    const idx = this.taxRecords.findIndex((r) => `${r.country}::${r.taxCategory}` === key);
    if (idx >= 0) this.taxRecords[idx] = record;
    else this.taxRecords.push(record);
  }

  failReport(
    action: GtiRunReport["action"],
    errors: string[],
    durationMs: number,
  ): GtiRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "gti-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: GLOBAL_TAX_INTELLIGENCE_ID,
        engineVersion: "PILLOW-GTI-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...GTI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: GTI_METADATA_VERSION,
      } satisfies GlobalTaxIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `gti-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: GTI_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: GlobalTaxIntelligenceConfiguration): {
    frameworkModuleId: string | null;
    validation: TaxValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: GLOBAL_TAX_INTELLIGENCE_ID,
        moduleVersion: GTI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-07",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "tax.country_rules",
            "tax.regulation_update",
            "tax.indirect",
            "tax.direct",
            "tax.cross_border",
            "tax.obligation",
            "tax.compliance_risk",
            "tax.optimization",
            "tax.recommended",
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
      this.deps.globalExpansionFramework.activateExpansionModule(GLOBAL_TAX_INTELLIGENCE_ID);
    }

    appendGtiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Global Tax Intelligence with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `gti-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: GTI_METADATA_VERSION,
      },
    };
  }

  connectGlobalTaxIntelligence(
    _input: ConnectGlobalTaxIntelligenceInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady = Object.values(presence).every(Boolean);

    this.engineRecord = {
      engineRecordId: `gti-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: GLOBAL_TAX_INTELLIGENCE_ID,
      engineVersion: "PILLOW-GTI-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...GTI_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: GTI_METADATA_VERSION,
    };

    appendGtiLog({
      event: "engine_connected",
      level: "info",
      details:
        "Global Tax Intelligence connected — structural signals only; never authoritative legal advice",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural tax signals only — no live tax authority APIs; never authoritative legal advice",
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
    action: GtiRunReport["action"],
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
    producer: () => TaxIntelligenceRecord,
  ): GtiRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      if (
        record.authoritativeLegalAdviceClaim !== "none" ||
        !record.neverProvideUnvalidatedTaxAsLegalAdvice
      ) {
        return this.failReport(
          action,
          ["Never provide unvalidated tax calculations as authoritative legal advice"],
          Date.now() - started,
        );
      }
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendGtiLog({
        event: action,
        level: "info",
        details: `${record.country}/${record.taxCategory} status=${record.complianceStatus} risk=${record.riskLevel}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        taxRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendGtiLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  manageCountryTaxRules(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    return this.runValidated("manage_country_tax_rules", input, config, () =>
      this.rulesEngine.manageCountryTaxRules(input, config),
    );
  }

  monitorTaxRegulationUpdates(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    if (!config.taxUpdateRulesEnabled) {
      return this.failReport(
        "monitor_tax_regulation_updates",
        ["Tax update rules disabled"],
        0,
      );
    }
    return this.runValidated("monitor_tax_regulation_updates", input, config, () =>
      this.rulesEngine.monitorTaxRegulationUpdates(input, config),
    );
  }

  manageIndirectTaxes(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    return this.runValidated("manage_indirect_taxes", input, config, () =>
      this.rulesEngine.manageIndirectTaxes(input, config),
    );
  }

  manageDirectTaxes(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    return this.runValidated("manage_direct_taxes", input, config, () =>
      this.rulesEngine.manageDirectTaxes(input, config),
    );
  }

  manageCrossBorder(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    return this.runValidated("manage_cross_border", input, config, () =>
      this.rulesEngine.manageCrossBorder(input, config),
    );
  }

  estimateTaxObligation(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    return this.runValidated("estimate_tax_obligation", input, config, () =>
      this.calculationEngine.estimateTaxObligation(input, config),
    );
  }

  detectComplianceRisks(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    return this.runValidated("detect_compliance_risks", input, config, () =>
      this.riskAnalyzer.detectComplianceRisks(input, config),
    );
  }

  detectOptimizationOpportunities(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    return this.runValidated("detect_optimization_opportunities", input, config, () =>
      this.riskAnalyzer.detectOptimizationOpportunities(input, config),
    );
  }

  recommendTax(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport("recommend_tax", validation.errors, Date.now() - started);
      }

      if (this.taxRecords.length === 0) {
        const seed = this.rulesEngine.manageCountryTaxRules(input, config);
        this.storeRecord(seed);
      }

      // Keep compliance engine exercised for assessments feeding recommendations.
      this.complianceEngine.assessCompliance(input, config);

      const eligible = this.taxRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverProvideUnvalidatedTaxAsLegalAdvice === true &&
          r.authoritativeLegalAdviceClaim === "none",
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_tax",
          ["No validated tax intelligence records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendGtiLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} tax recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_tax",
        engineRecord,
        taxRecords: this.taxRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendGtiLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_tax", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunGtiDiagnosticsInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): GtiRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `gti-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: GLOBAL_TAX_INTELLIGENCE_ID,
        engineVersion: "PILLOW-GTI-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...GTI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: GTI_METADATA_VERSION,
      } satisfies GlobalTaxIntelligenceEngineRecord);

    appendGtiLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.taxRecords.length} · high-risk=${this.highRiskCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      taxRecords: this.taxRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
