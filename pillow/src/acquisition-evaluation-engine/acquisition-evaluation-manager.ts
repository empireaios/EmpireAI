/** X2-15 — Acquisition Evaluation Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { PortfolioRiskEngine } from "../portfolio-risk-engine/engine.js";
import type { BusinessHealthRanking } from "../business-health-ranking/engine.js";
import type { SharedSupplierIntelligence } from "../shared-supplier-intelligence/engine.js";
import type { PortfolioForecastEngine } from "../portfolio-forecast-engine/engine.js";
import {
  AEE_CAPABILITIES,
  AEE_METADATA_VERSION,
  ACQUISITION_EVALUATION_ENGINE_ID,
} from "./paths.js";
import { appendAeeLog } from "./aee-logging.js";
import { AcquisitionDiscoveryEngine } from "./acquisition-discovery-engine.js";
import { StrategicFitAnalyzer } from "./strategic-fit-analyzer.js";
import { FinancialEvaluationEngine } from "./financial-evaluation-engine.js";
import { RiskEvaluationEngine } from "./risk-evaluation-engine.js";
import { AcquisitionRecommendationEngine } from "./acquisition-recommendation-engine.js";
import { AcquisitionValidator } from "./acquisition-validator.js";
import { AcquisitionMetadataGenerator } from "./acquisition-metadata-generator.js";
import type { AcquisitionEvaluationEngineConfiguration } from "./configuration.js";
import type {
  AcquisitionEvaluationEngineRecord,
  AcquisitionRecord,
  AcquisitionRunReport,
  ConnectAcquisitionEvaluationEngineInput,
  DiscoverAcquisitionCandidatesInput,
  EvaluateAcquisitionInput,
  GenerateAcquisitionRecommendationsInput,
  RankAcquisitionOpportunitiesInput,
  RunAcquisitionDiagnosticsInput,
} from "./types.js";

export type AcquisitionEvaluationEngineDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  portfolioRiskEngine: PortfolioRiskEngine | null;
  businessHealthRanking: BusinessHealthRanking | null;
  sharedSupplierIntelligence: SharedSupplierIntelligence | null;
  portfolioForecastEngine: PortfolioForecastEngine | null;
};

export class AcquisitionEvaluationManager {
  private engineRecord: AcquisitionEvaluationEngineRecord | null = null;
  private records = new Map<string, AcquisitionRecord>();
  private readonly discovery = new AcquisitionDiscoveryEngine();
  private readonly strategicFit = new StrategicFitAnalyzer();
  private readonly financial = new FinancialEvaluationEngine();
  private readonly risk = new RiskEvaluationEngine();
  private readonly recommendations = new AcquisitionRecommendationEngine();
  private readonly validator = new AcquisitionValidator();
  private readonly metadataGenerator = new AcquisitionMetadataGenerator();

  constructor(private readonly deps: AcquisitionEvaluationEngineDependencies) {}

  getEngineRecord(): AcquisitionEvaluationEngineRecord | null {
    return this.engineRecord;
  }

  getAcquisitionRecords(): AcquisitionRecord[] {
    return [...this.records.values()];
  }

  pursueCount(): number {
    return this.getAcquisitionRecords().filter((r) => r.recommendation === "pursue").length;
  }

  averageStrategicFit(): number {
    const list = this.getAcquisitionRecords();
    if (!list.length) return 0;
    return Math.round(
      list.reduce((sum, r) => sum + r.strategicFitScore, 0) / list.length,
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.records.clear();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): AcquisitionEvaluationEngineRecord["dependencyPresence"] {
    return {
      enterprisePortfolioFramework: this.deps.enterprisePortfolioFramework
        ? this.probe(() => this.deps.enterprisePortfolioFramework!.getState())
        : false,
      portfolioPerformanceEngine: this.deps.portfolioPerformanceEngine
        ? this.probe(() => this.deps.portfolioPerformanceEngine!.getState())
        : false,
      capitalDistributionEngine: this.deps.capitalDistributionEngine
        ? this.probe(() => this.deps.capitalDistributionEngine!.getState())
        : false,
      portfolioRiskEngine: this.deps.portfolioRiskEngine
        ? this.probe(() => this.deps.portfolioRiskEngine!.getState())
        : false,
      businessHealthRanking: this.deps.businessHealthRanking
        ? this.probe(() => this.deps.businessHealthRanking!.getState())
        : false,
      sharedSupplierIntelligence: this.deps.sharedSupplierIntelligence
        ? this.probe(() => this.deps.sharedSupplierIntelligence!.getState())
        : false,
      portfolioForecastEngine: this.deps.portfolioForecastEngine
        ? this.probe(() => this.deps.portfolioForecastEngine!.getState())
        : false,
    };
  }

  private requireConnected(): AcquisitionEvaluationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Acquisition Evaluation Engine not connected — call connectAcquisitionEvaluationEngine first",
      );
    }
    return this.engineRecord;
  }

  private store(record: AcquisitionRecord): AcquisitionRecord {
    this.records.set(record.candidateBusiness, { ...record });
    return { ...record };
  }

  private failReport(
    action: AcquisitionRunReport["action"],
    errors: string[],
    durationMs: number,
  ): AcquisitionRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "aee-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: ACQUISITION_EVALUATION_ENGINE_ID,
        engineVersion: "PILLOW-AEE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...AEE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: AEE_METADATA_VERSION,
      } satisfies AcquisitionEvaluationEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `aee-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: AEE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: AcquisitionEvaluationEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: AcquisitionRunReport["validation"];
  } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: ACQUISITION_EVALUATION_ENGINE_ID,
        moduleVersion: AEE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-15",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "acquisition.discovered",
            "acquisition.evaluated",
            "acquisition.ranked",
            "acquisition.recommended",
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
        ACQUISITION_EVALUATION_ENGINE_ID,
      );
    }

    appendAeeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Acquisition Evaluation Engine with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `aee-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: AEE_METADATA_VERSION,
      },
    };
  }

  connectAcquisitionEvaluationEngine(
    _input: ConnectAcquisitionEvaluationEngineInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
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
      engineRecordId: `aee-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ACQUISITION_EVALUATION_ENGINE_ID,
      engineVersion: "PILLOW-AEE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent ? (connectedCount >= 5 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...AEE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: AEE_METADATA_VERSION,
    };

    appendAeeLog({
      event: "engine_connected",
      level: "info",
      details: "Acquisition Evaluation Engine connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Acquisition recommendations require validated information only",
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

  discoverCandidates(
    input: DiscoverAcquisitionCandidatesInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateDiscover(input, config);
      if (validation.decision === "fail") {
        return this.failReport("discover_candidates", validation.errors, Date.now() - started);
      }

      const discovered = this.discovery.discover({
        industryHints: input.industryHints,
        candidateBusinesses: input.candidateBusinesses,
        config,
      });
      const stored = discovered.map((r) =>
        this.store({
          ...r,
          validationStatus: "passed",
        }),
      );

      appendAeeLog({
        event: "candidate_discovery",
        level: "info",
        details: `Discovered ${stored.length} acquisition candidates`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "discover_candidates",
        engineRecord,
        acquisitionRecords: stored,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "discover_candidates",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  private evaluateCore(
    action: AcquisitionRunReport["action"],
    input: EvaluateAcquisitionInput,
    config: AcquisitionEvaluationEngineConfiguration,
    mode:
      | "full"
      | "strategic"
      | "financial"
      | "operational"
      | "risk"
      | "value",
  ): AcquisitionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateEvaluate(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const existing = this.records.get(input.candidateBusiness.trim());
      const industry = input.industry ?? existing?.industry ?? "general";

      const strategicFitScore =
        mode === "full" || mode === "strategic"
          ? this.strategicFit.evaluate({
              industry,
              strategicFitHint: input.strategicFitHint ?? existing?.strategicFitScore,
              config,
            })
          : (existing?.strategicFitScore ?? 50);

      const financialResult =
        mode === "full" || mode === "financial" || mode === "value"
          ? this.financial.evaluate({
              financialHint: input.financialHint ?? existing?.financialScore,
              estimatedValueHint:
                input.estimatedValueHint ?? existing?.estimatedAcquisitionValue,
              config,
            })
          : {
              financialScore: existing?.financialScore ?? 50,
              estimatedAcquisitionValue: existing?.estimatedAcquisitionValue ?? 0,
            };

      const operationalMaturityScore =
        mode === "full" || mode === "operational"
          ? this.risk.evaluateOperationalMaturity({
              operationalMaturityHint:
                input.operationalMaturityHint ?? existing?.operationalMaturityScore,
              financialScore: financialResult.financialScore,
            })
          : (existing?.operationalMaturityScore ?? 50);

      const riskScore =
        mode === "full" || mode === "risk"
          ? this.risk.evaluateRisk({
              riskHint: input.riskHint ?? existing?.riskScore,
              financialScore: financialResult.financialScore,
              strategicFitScore,
              config,
            })
          : (existing?.riskScore ?? 50);

      const record = this.store({
        acquisitionEvaluationId:
          existing?.acquisitionEvaluationId ?? `aee-ae-${Date.now()}`,
        timestamp: new Date().toISOString(),
        candidateBusiness: input.candidateBusiness.trim(),
        industry,
        strategicFitScore,
        financialScore: financialResult.financialScore,
        riskScore,
        operationalMaturityScore,
        estimatedAcquisitionValue: financialResult.estimatedAcquisitionValue,
        recommendation: existing?.recommendation ?? "manual_review",
        validationStatus: "passed",
        metadataVersion: AEE_METADATA_VERSION,
        rankedPosition: existing?.rankedPosition ?? null,
        validatedInformationOnly: true,
        structuralSignalOnly: true,
        sensitiveEnterpriseData: false,
      });

      const event =
        mode === "strategic"
          ? "strategic_evaluation"
          : mode === "financial" || mode === "value"
            ? "financial_evaluation"
            : mode === "risk"
              ? "risk_evaluation"
              : "opportunity_evaluation";

      appendAeeLog({
        event,
        level: "info",
        details: `${action} candidate=${record.candidateBusiness} fit=${record.strategicFitScore} financial=${record.financialScore} risk=${record.riskScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        acquisitionRecords: [record],
        validation,
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

  evaluateOpportunity(
    input: EvaluateAcquisitionInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
    return this.evaluateCore("evaluate_opportunity", input, config, "full");
  }

  evaluateStrategicFit(
    input: EvaluateAcquisitionInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
    return this.evaluateCore("evaluate_strategic_fit", input, config, "strategic");
  }

  evaluateFinancial(
    input: EvaluateAcquisitionInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
    return this.evaluateCore("evaluate_financial", input, config, "financial");
  }

  evaluateOperationalMaturity(
    input: EvaluateAcquisitionInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
    return this.evaluateCore("evaluate_operational_maturity", input, config, "operational");
  }

  evaluateRisks(
    input: EvaluateAcquisitionInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
    return this.evaluateCore("evaluate_risks", input, config, "risk");
  }

  estimateValue(
    input: EvaluateAcquisitionInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
    return this.evaluateCore("estimate_value", input, config, "value");
  }

  rankOpportunities(
    input: RankAcquisitionOpportunitiesInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "rank_opportunities",
          ["Opportunity ranking requires validated=true"],
          Date.now() - started,
        );
      }

      const ranked = [...this.getAcquisitionRecords()]
        .map((r) => ({
          record: r,
          composite:
            r.strategicFitScore * 0.35 +
            r.financialScore * 0.3 +
            r.operationalMaturityScore * 0.2 +
            (100 - r.riskScore) * 0.15,
        }))
        .sort((a, b) => b.composite - a.composite)
        .map((entry, index) =>
          this.store({
            ...entry.record,
            rankedPosition: index + 1,
            timestamp: new Date().toISOString(),
          }),
        );

      appendAeeLog({
        event: "opportunity_ranking",
        level: "info",
        details: `Ranked ${ranked.length} acquisition opportunities`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "rank_opportunities",
        engineRecord,
        acquisitionRecords: ranked,
        validation: {
          validationReportId: `aee-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: ranked.length ? "pass" : "partial",
          errors: [],
          warnings: ranked.length ? [] : ["No acquisition records to rank"],
          durationMs: Date.now() - started,
          metadataVersion: AEE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "rank_opportunities",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: GenerateAcquisitionRecommendationsInput,
    config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRecommendations(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "generate_recommendations",
          validation.errors,
          Date.now() - started,
        );
      }

      const recommendations = this.recommendations.recommend({
        records: this.getAcquisitionRecords(),
        config,
        candidateBusiness: input.candidateBusiness,
      });
      const updated = this.recommendations
        .applyRecommendations(this.getAcquisitionRecords(), recommendations)
        .map((r) => this.store(r));

      appendAeeLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${recommendations.length} acquisition recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "generate_recommendations",
        engineRecord,
        acquisitionRecords: updated,
        recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_recommendations",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    _input: RunAcquisitionDiagnosticsInput,
    _config: AcquisitionEvaluationEngineConfiguration,
  ): AcquisitionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = this.getAcquisitionRecords();
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        acquisitionRecords: records,
        validation: {
          validationReportId: `aee-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: records.length ? [] : ["No acquisition evaluations yet"],
          durationMs: Date.now() - started,
          metadataVersion: AEE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "diagnostics",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }
}
