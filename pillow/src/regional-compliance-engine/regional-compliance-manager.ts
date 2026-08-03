/** X4-06 — Regional Compliance Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CountryIntelligenceEngine } from "../country-intelligence-engine/engine.js";
import type { LocalizationEngine } from "../localization-engine/engine.js";
import type { LanguageIntelligenceEngine } from "../language-intelligence/engine.js";
import type { CurrencyIntelligenceEngine } from "../currency-intelligence/engine.js";
import {
  RCE_CAPABILITIES,
  RCE_METADATA_VERSION,
  REGIONAL_COMPLIANCE_ENGINE_ID,
} from "./paths.js";
import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import { appendRceLog } from "./rce-logging.js";
import { RegulatoryIntelligenceEngine } from "./regulatory-intelligence-engine.js";
import { ComplianceRulesEngine } from "./compliance-rules-engine.js";
import { ComplianceAssessmentEngine } from "./compliance-assessment-engine.js";
import { ComplianceRiskAnalyzer } from "./compliance-risk-analyzer.js";
import { ComplianceRecommendationEngine } from "./compliance-recommendation-engine.js";
import { ComplianceMetadataGenerator } from "./compliance-metadata-generator.js";
import { ComplianceValidator } from "./compliance-validator.js";
import type {
  ComplianceAnalysisInput,
  ComplianceRecommendation,
  ComplianceRecord,
  ComplianceValidationReport,
  ConnectRegionalComplianceEngineInput,
  RegionalComplianceEngineRecord,
  RceRunReport,
  RunRceDiagnosticsInput,
} from "./types.js";

export type RegionalComplianceEngineDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
  countryIntelligenceEngine?: CountryIntelligenceEngine | null;
  localizationEngine?: LocalizationEngine | null;
  languageIntelligence?: LanguageIntelligenceEngine | null;
  currencyIntelligence?: CurrencyIntelligenceEngine | null;
};

export class RegionalComplianceManager {
  private engineRecord: RegionalComplianceEngineRecord | null = null;
  private complianceRecords: ComplianceRecord[] = [];
  private recommendations: ComplianceRecommendation[] = [];

  private readonly regulatoryEngine = new RegulatoryIntelligenceEngine();
  private readonly rulesEngine = new ComplianceRulesEngine();
  private readonly assessmentEngine = new ComplianceAssessmentEngine();
  private readonly riskAnalyzer = new ComplianceRiskAnalyzer();
  private readonly recommendationEngine = new ComplianceRecommendationEngine();
  private readonly metadataGenerator = new ComplianceMetadataGenerator();
  private readonly validator = new ComplianceValidator();

  constructor(private readonly deps: RegionalComplianceEngineDependencies = {}) {}

  getEngineRecord(): RegionalComplianceEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getComplianceRecords(): ComplianceRecord[] {
    return this.complianceRecords.map((r) => ({
      ...r,
      requiredActions: [...r.requiredActions],
    }));
  }

  getRecommendations(): ComplianceRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  violationCount(): number {
    return this.riskAnalyzer.filterViolations(this.complianceRecords).length;
  }

  highRiskCount(): number {
    return this.riskAnalyzer.highRiskCount(this.complianceRecords);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.complianceRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): RegionalComplianceEngineRecord["dependencyPresence"] {
    return {
      globalExpansionFramework: Boolean(this.deps.globalExpansionFramework),
      countryIntelligenceEngine: Boolean(this.deps.countryIntelligenceEngine),
      localizationEngine: Boolean(this.deps.localizationEngine),
      languageIntelligence: Boolean(this.deps.languageIntelligence),
      currencyIntelligence: Boolean(this.deps.currencyIntelligence),
    };
  }

  private requireConnected(): RegionalComplianceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Regional Compliance Engine not connected — call connectRegionalComplianceEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: ComplianceRecord): void {
    const key = `${record.country}::${record.regulationCategory}`;
    const idx = this.complianceRecords.findIndex(
      (r) => `${r.country}::${r.regulationCategory}` === key,
    );
    if (idx >= 0) this.complianceRecords[idx] = record;
    else this.complianceRecords.push(record);
  }

  failReport(
    action: RceRunReport["action"],
    errors: string[],
    durationMs: number,
  ): RceRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "rce-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: REGIONAL_COMPLIANCE_ENGINE_ID,
        engineVersion: "PILLOW-RCE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...RCE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: RCE_METADATA_VERSION,
      } satisfies RegionalComplianceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `rce-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: RCE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: RegionalComplianceEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: ComplianceValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: REGIONAL_COMPLIANCE_ENGINE_ID,
        moduleVersion: RCE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-06",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "compliance.country",
            "compliance.regulatory",
            "compliance.rules",
            "compliance.operational",
            "compliance.marketplace",
            "compliance.data_protection",
            "compliance.violation",
            "compliance.risk",
            "compliance.recommended",
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
        REGIONAL_COMPLIANCE_ENGINE_ID,
      );
    }

    appendRceLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Regional Compliance Engine with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `rce-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: RCE_METADATA_VERSION,
      },
    };
  }

  connectRegionalComplianceEngine(
    _input: ConnectRegionalComplianceEngineInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady = Object.values(presence).every(Boolean);

    this.engineRecord = {
      engineRecordId: `rce-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: REGIONAL_COMPLIANCE_ENGINE_ID,
      engineVersion: "PILLOW-RCE-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...RCE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: RCE_METADATA_VERSION,
    };

    appendRceLog({
      event: "engine_connected",
      level: "info",
      details:
        "Regional Compliance Engine connected — structural signals only; never falsely certify compliance",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural compliance signals only — no live regulatory APIs; never falsely certify",
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
    action: RceRunReport["action"],
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
    producer: () => ComplianceRecord,
  ): RceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      // Safety: never allow accidental certification claims.
      if (record.certificationClaim !== "none" || !record.neverFalselyCertifyCompliance) {
        return this.failReport(
          action,
          ["Never falsely certify compliance"],
          Date.now() - started,
        );
      }
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendRceLog({
        event: action,
        level: "info",
        details: `${record.country}/${record.regulationCategory} status=${record.complianceStatus} risk=${record.riskLevel}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        complianceRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendRceLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  manageCountryRequirements(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    return this.runValidated("manage_country_requirements", input, config, () =>
      this.regulatoryEngine.manageCountryRequirements(input, config),
    );
  }

  monitorRegulatoryChanges(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    if (!config.regulatoryUpdateRulesEnabled) {
      return this.failReport(
        "monitor_regulatory_changes",
        ["Regulatory update rules disabled"],
        0,
      );
    }
    return this.runValidated("monitor_regulatory_changes", input, config, () =>
      this.regulatoryEngine.monitorRegulatoryChanges(input, config),
    );
  }

  manageBusinessRules(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    return this.runValidated("manage_business_rules", input, config, () =>
      this.rulesEngine.manageBusinessRules(input, config),
    );
  }

  assessOperational(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    return this.runValidated("assess_operational", input, config, () =>
      this.assessmentEngine.assess(input, config, "operational"),
    );
  }

  assessMarketplace(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    return this.runValidated("assess_marketplace", input, config, () =>
      this.assessmentEngine.assess(input, config, "marketplace"),
    );
  }

  assessDataProtection(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    return this.runValidated("assess_data_protection", input, config, () =>
      this.assessmentEngine.assess(input, config, "data_protection"),
    );
  }

  detectViolations(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    return this.runValidated("detect_violations", input, config, () =>
      this.riskAnalyzer.detectViolations(input, config),
    );
  }

  assessRisks(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    return this.runValidated("assess_risks", input, config, () =>
      this.riskAnalyzer.assessRisks(input, config),
    );
  }

  recommendCompliance(
    input: ComplianceAnalysisInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport(
          "recommend_compliance",
          validation.errors,
          Date.now() - started,
        );
      }

      if (this.complianceRecords.length === 0) {
        const seed = this.regulatoryEngine.manageCountryRequirements(input, config);
        this.storeRecord(seed);
      }

      const eligible = this.complianceRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverFalselyCertifyCompliance === true &&
          r.certificationClaim === "none",
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_compliance",
          ["No validated compliance records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendRceLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} compliance recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_compliance",
        engineRecord,
        complianceRecords: this.complianceRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendRceLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_compliance", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunRceDiagnosticsInput,
    config: RegionalComplianceEngineConfiguration,
  ): RceRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `rce-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: REGIONAL_COMPLIANCE_ENGINE_ID,
        engineVersion: "PILLOW-RCE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...RCE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: RCE_METADATA_VERSION,
      } satisfies RegionalComplianceEngineRecord);

    appendRceLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.complianceRecords.length} · violations=${this.violationCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      complianceRecords: this.complianceRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
