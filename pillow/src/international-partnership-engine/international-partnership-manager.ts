/** X4-12 — International Partnership Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CountryIntelligenceEngine } from "../country-intelligence-engine/engine.js";
import type { LocalizationEngine } from "../localization-engine/engine.js";
import type { LanguageIntelligenceEngine } from "../language-intelligence/engine.js";
import type { CurrencyIntelligenceEngine } from "../currency-intelligence/engine.js";
import type { RegionalComplianceEngine } from "../regional-compliance-engine/engine.js";
import type { GlobalTaxIntelligenceEngine } from "../global-tax-intelligence/engine.js";
import type { InternationalLogisticsEngine } from "../international-logistics-engine/engine.js";
import type { GlobalMarketIntelligenceEngine } from "../global-market-intelligence/engine.js";
import type { ExecutiveGlobalDashboardEngine } from "../executive-global-dashboard/engine.js";
import type { GlobalBrandManagementEngine } from "../global-brand-management/engine.js";
import {
  IPE_CAPABILITIES,
  IPE_METADATA_VERSION,
  INTERNATIONAL_PARTNERSHIP_ENGINE_ID,
} from "./paths.js";
import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";
import { appendIpeLog } from "./ipe-logging.js";
import { PartnerRegistryEngine } from "./partner-registry-engine.js";
import { PartnerEvaluationEngine } from "./partner-evaluation-engine.js";
import { PartnerPerformanceEngine } from "./partner-performance-engine.js";
import { PartnershipAnalyticsEngine } from "./partnership-analytics-engine.js";
import { PartnershipRecommendationEngine } from "./partnership-recommendation-engine.js";
import { PartnershipMetadataGenerator } from "./partnership-metadata-generator.js";
import { PartnershipValidator } from "./partnership-validator.js";
import type {
  ConnectInternationalPartnershipEngineInput,
  InternationalPartnershipEngineRecord,
  IpeRunReport,
  PartnershipAnalysisInput,
  PartnershipRecommendation,
  PartnershipRecord,
  PartnershipValidationReport,
  RunIpeDiagnosticsInput,
} from "./types.js";

export type InternationalPartnershipEngineDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
  countryIntelligenceEngine?: CountryIntelligenceEngine | null;
  localizationEngine?: LocalizationEngine | null;
  languageIntelligence?: LanguageIntelligenceEngine | null;
  currencyIntelligence?: CurrencyIntelligenceEngine | null;
  regionalComplianceEngine?: RegionalComplianceEngine | null;
  globalTaxIntelligence?: GlobalTaxIntelligenceEngine | null;
  internationalLogisticsEngine?: InternationalLogisticsEngine | null;
  globalMarketIntelligence?: GlobalMarketIntelligenceEngine | null;
  executiveGlobalDashboard?: ExecutiveGlobalDashboardEngine | null;
  globalBrandManagement?: GlobalBrandManagementEngine | null;
};

export class InternationalPartnershipManager {
  private engineRecord: InternationalPartnershipEngineRecord | null = null;
  private partnershipRecords: PartnershipRecord[] = [];
  private recommendations: PartnershipRecommendation[] = [];

  private readonly registryEngine = new PartnerRegistryEngine();
  private readonly evaluationEngine = new PartnerEvaluationEngine();
  private readonly performanceEngine = new PartnerPerformanceEngine();
  private readonly analyticsEngine = new PartnershipAnalyticsEngine();
  private readonly recommendationEngine = new PartnershipRecommendationEngine();
  private readonly metadataGenerator = new PartnershipMetadataGenerator();
  private readonly validator = new PartnershipValidator();

  constructor(private readonly deps: InternationalPartnershipEngineDependencies = {}) {}

  getEngineRecord(): InternationalPartnershipEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getPartnershipRecords(): PartnershipRecord[] {
    return this.partnershipRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): PartnershipRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  riskCount(): number {
    return this.analyticsEngine.riskCount(this.partnershipRecords);
  }

  opportunityCount(): number {
    return this.analyticsEngine.opportunityCount(this.partnershipRecords);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.partnershipRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): InternationalPartnershipEngineRecord["dependencyPresence"] {
    return {
      globalExpansionFramework: Boolean(this.deps.globalExpansionFramework),
      countryIntelligenceEngine: Boolean(this.deps.countryIntelligenceEngine),
      localizationEngine: Boolean(this.deps.localizationEngine),
      languageIntelligence: Boolean(this.deps.languageIntelligence),
      currencyIntelligence: Boolean(this.deps.currencyIntelligence),
      regionalComplianceEngine: Boolean(this.deps.regionalComplianceEngine),
      globalTaxIntelligence: Boolean(this.deps.globalTaxIntelligence),
      internationalLogisticsEngine: Boolean(this.deps.internationalLogisticsEngine),
      globalMarketIntelligence: Boolean(this.deps.globalMarketIntelligence),
      executiveGlobalDashboard: Boolean(this.deps.executiveGlobalDashboard),
      globalBrandManagement: Boolean(this.deps.globalBrandManagement),
    };
  }

  private requireConnected(): InternationalPartnershipEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "International Partnership Engine not connected — call connectInternationalPartnershipEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: PartnershipRecord): void {
    const key = `${record.partnerReference}::${record.country}::${record.partnershipCategory}`;
    const idx = this.partnershipRecords.findIndex(
      (r) => `${r.partnerReference}::${r.country}::${r.partnershipCategory}` === key,
    );
    if (idx >= 0) this.partnershipRecords[idx] = record;
    else this.partnershipRecords.push(record);
  }

  failReport(
    action: IpeRunReport["action"],
    errors: string[],
    durationMs: number,
  ): IpeRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "ipe-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: INTERNATIONAL_PARTNERSHIP_ENGINE_ID,
        engineVersion: "PILLOW-IPE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...IPE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: IPE_METADATA_VERSION,
      } satisfies InternationalPartnershipEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `ipe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: IPE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: InternationalPartnershipEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: PartnershipValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: INTERNATIONAL_PARTNERSHIP_ENGINE_ID,
        moduleVersion: IPE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-12",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "partnership.strategic",
            "partnership.regional_network",
            "partnership.prospective",
            "partnership.performance",
            "partnership.reliability",
            "partnership.value",
            "partnership.risk",
            "partnership.opportunity",
            "partnership.recommended",
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
        INTERNATIONAL_PARTNERSHIP_ENGINE_ID,
      );
    }

    appendIpeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered International Partnership Engine with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `ipe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: IPE_METADATA_VERSION,
      },
    };
  }

  connectInternationalPartnershipEngine(
    _input: ConnectInternationalPartnershipEngineInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady = Object.values(presence).every(Boolean);

    this.engineRecord = {
      engineRecordId: `ipe-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: INTERNATIONAL_PARTNERSHIP_ENGINE_ID,
      engineVersion: "PILLOW-IPE-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...IPE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: IPE_METADATA_VERSION,
    };

    appendIpeLog({
      event: "partner_registration",
      level: "info",
      details:
        "International Partnership Engine connected — structural signals only; never approve strategic partnerships without validation",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural partnership signals only — no live partner APIs; never approve strategic partnerships without validation",
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
    action: IpeRunReport["action"],
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
    producer: () => PartnershipRecord,
  ): IpeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      if (
        record.unvalidatedApprovalClaim !== "none" ||
        !record.neverApproveStrategicPartnershipsWithoutValidation
      ) {
        return this.failReport(
          action,
          ["Never approve strategic partnerships without validation"],
          Date.now() - started,
        );
      }
      if (
        record.approvalStatus === "approved_validated" &&
        input.validated !== true
      ) {
        return this.failReport(
          action,
          ["Strategic partnership approval requires validated=true"],
          Date.now() - started,
        );
      }
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendIpeLog({
        event: action,
        level: "info",
        details: `${record.partnerReference}/${record.country}/${record.partnershipCategory} approval=${record.approvalStatus}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        partnershipRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendIpeLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  manageStrategicPartnerships(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    return this.runValidated("manage_strategic_partnerships", input, config, () =>
      this.registryEngine.manageStrategicPartnerships(input, config),
    );
  }

  manageRegionalPartnerNetworks(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    return this.runValidated("manage_regional_partner_networks", input, config, () =>
      this.registryEngine.manageRegionalPartnerNetworks(input, config),
    );
  }

  evaluateProspectivePartners(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    return this.runValidated("evaluate_prospective_partners", input, config, () =>
      this.evaluationEngine.evaluateProspectivePartners(input, config),
    );
  }

  monitorPartnerPerformance(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    return this.runValidated("monitor_partner_performance", input, config, () =>
      this.performanceEngine.monitorPartnerPerformance(input, config),
    );
  }

  monitorPartnerReliability(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    return this.runValidated("monitor_partner_reliability", input, config, () =>
      this.performanceEngine.monitorPartnerReliability(input, config),
    );
  }

  monitorPartnershipValue(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    return this.runValidated("monitor_partnership_value", input, config, () =>
      this.analyticsEngine.monitorPartnershipValue(input, config),
    );
  }

  detectPartnershipRisks(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    return this.runValidated("detect_partnership_risks", input, config, () =>
      this.analyticsEngine.detectPartnershipRisks(input, config),
    );
  }

  detectPartnershipOpportunities(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    return this.runValidated("detect_partnership_opportunities", input, config, () =>
      this.analyticsEngine.detectPartnershipOpportunities(input, config),
    );
  }

  recommendPartnership(
    input: PartnershipAnalysisInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport("recommend_partnership", validation.errors, Date.now() - started);
      }

      if (this.partnershipRecords.length === 0) {
        const seed = this.registryEngine.manageStrategicPartnerships(input, config);
        this.storeRecord(seed);
      }

      const eligible = this.partnershipRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverApproveStrategicPartnershipsWithoutValidation === true &&
          r.unvalidatedApprovalClaim === "none",
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_partnership",
          ["No validated partnership records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendIpeLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} partnership recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_partnership",
        engineRecord,
        partnershipRecords: this.partnershipRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendIpeLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_partnership", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunIpeDiagnosticsInput,
    config: InternationalPartnershipEngineConfiguration,
  ): IpeRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `ipe-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: INTERNATIONAL_PARTNERSHIP_ENGINE_ID,
        engineVersion: "PILLOW-IPE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...IPE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: IPE_METADATA_VERSION,
      } satisfies InternationalPartnershipEngineRecord);

    appendIpeLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.partnershipRecords.length} · risks=${this.riskCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      partnershipRecords: this.partnershipRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
