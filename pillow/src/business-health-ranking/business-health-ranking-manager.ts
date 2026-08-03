/** X2-09 — Business Health Ranking Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CrossBusinessKnowledgeEngine } from "../cross-business-knowledge-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { ExecutivePortfolioDashboard } from "../executive-portfolio-dashboard/engine.js";
import type { PortfolioRiskEngine } from "../portfolio-risk-engine/engine.js";
import type { PortfolioBalanceEngine } from "../portfolio-balance-engine/engine.js";
import {
  BHR_CAPABILITIES,
  BHR_METADATA_VERSION,
  BUSINESS_HEALTH_RANKING_ID,
} from "./paths.js";
import { appendBhrLog } from "./bhr-logging.js";
import { BusinessHealthEngine } from "./business-health-engine.js";
import { EnterpriseRankingEngine } from "./enterprise-ranking-engine.js";
import { PriorityRecommendationEngine } from "./priority-recommendation-engine.js";
import { EnterpriseAnalyticsEngine } from "./enterprise-analytics-engine.js";
import { BusinessHealthMetadataGenerator } from "./business-health-metadata-generator.js";
import { BusinessHealthValidator } from "./business-health-validator.js";
import type { BusinessHealthRankingConfiguration } from "./configuration.js";
import type {
  BusinessHealthRecord,
  BusinessHealthRunReport,
  ConnectBusinessHealthRankingInput,
  DetectDecliningInput,
  DetectHighPerformingInput,
  GeneratePrioritiesInput,
  MeasureBusinessHealthInput,
  RankCompaniesInput,
  RankingEngineRecord,
  RunRankingDiagnosticsInput,
} from "./types.js";

export type BusinessHealthRankingDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  crossBusinessKnowledgeEngine: CrossBusinessKnowledgeEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  executivePortfolioDashboard: ExecutivePortfolioDashboard | null;
  portfolioRiskEngine: PortfolioRiskEngine | null;
  portfolioBalanceEngine: PortfolioBalanceEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class BusinessHealthRankingManager {
  private engineRecord: RankingEngineRecord | null = null;
  private healthRecords: BusinessHealthRecord[] = [];
  private readonly healthEngine = new BusinessHealthEngine();
  private readonly rankingEngine = new EnterpriseRankingEngine();
  private readonly priorities = new PriorityRecommendationEngine();
  private readonly analytics = new EnterpriseAnalyticsEngine();
  private readonly validator = new BusinessHealthValidator();
  private readonly metadataGenerator = new BusinessHealthMetadataGenerator();

  constructor(private readonly deps: BusinessHealthRankingDependencies) {}

  getEngineRecord(): RankingEngineRecord | null {
    return this.engineRecord;
  }

  getHealthRecords(): BusinessHealthRecord[] {
    return [...this.healthRecords];
  }

  decliningCount(): number {
    return this.healthRecords.filter((r) => r.decliningDetected).length;
  }

  highPerformingCount(): number {
    return this.healthRecords.filter((r) => r.highPerformingDetected).length;
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.healthRecords = [];
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): RankingEngineRecord["dependencyPresence"] {
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
      crossBusinessKnowledgeEngine: this.deps.crossBusinessKnowledgeEngine
        ? this.probe(() => this.deps.crossBusinessKnowledgeEngine!.getState())
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
    };
  }

  private requireConnected(): RankingEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Business Health Ranking not connected — call connectBusinessHealthRanking first",
      );
    }
    return this.engineRecord;
  }

  private failReport(
    action: BusinessHealthRunReport["action"],
    errors: string[],
    durationMs: number,
  ): BusinessHealthRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "bhr-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: BUSINESS_HEALTH_RANKING_ID,
        engineVersion: "PILLOW-BHR-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...BHR_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: BHR_METADATA_VERSION,
      } satisfies RankingEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      healthRecords: [],
      recommendations: [],
      validation: {
        validationReportId: `bhr-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: BHR_METADATA_VERSION,
      },
      durationMs,
    });
  }

  private collectSignals() {
    const companies = safe(() => this.deps.multiCompanyRegistry?.getCompanyRecords() ?? [], []);
    const performance = safe(
      () => this.deps.portfolioPerformanceEngine?.getPerformanceRecords() ?? [],
      [],
    );
    const risks = safe(() => this.deps.portfolioRiskEngine?.getRiskRecords() ?? [], []);
    return { companies, performance, risks };
  }

  registerWithFramework(
    config: BusinessHealthRankingConfiguration,
  ): { frameworkModuleId: string | null; validation: BusinessHealthRunReport["validation"] } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: BUSINESS_HEALTH_RANKING_ID,
        moduleVersion: BHR_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-09",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "health.measured",
            "health.ranked",
            "health.declining",
            "health.priority",
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
        BUSINESS_HEALTH_RANKING_ID,
      );
    }

    appendBhrLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Business Health Ranking with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `bhr-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: BHR_METADATA_VERSION,
      },
    };
  }

  connectBusinessHealthRanking(
    _input: ConnectBusinessHealthRankingInput,
    config: BusinessHealthRankingConfiguration,
  ): BusinessHealthRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const connectedCount = Object.values(presence).filter(Boolean).length;
    const allPresent = connectedCount === 8;

    this.engineRecord = {
      engineRecordId: `bhr-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BUSINESS_HEALTH_RANKING_ID,
      engineVersion: "PILLOW-BHR-001",
      currentOperationalState: "connected",
      healthStatus: allPresent ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...BHR_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: BHR_METADATA_VERSION,
    };

    appendBhrLog({
      event: "engine_connected",
      level: "info",
      details: "Business Health Ranking connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...(presence.enterprisePortfolioFramework ? [] : ["EPF unavailable"]),
      ...(presence.multiCompanyRegistry ? [] : ["Multi-Company Registry unavailable"]),
      ...(presence.portfolioPerformanceEngine ? [] : ["Portfolio Performance unavailable"]),
      ...(presence.crossBusinessKnowledgeEngine ? [] : ["Cross-Business Knowledge unavailable"]),
      ...(presence.capitalDistributionEngine ? [] : ["Capital Distribution unavailable"]),
      ...(presence.executivePortfolioDashboard ? [] : ["Executive Portfolio Dashboard unavailable"]),
      ...(presence.portfolioRiskEngine ? [] : ["Portfolio Risk Engine unavailable"]),
      ...(presence.portfolioBalanceEngine ? [] : ["Portfolio Balance Engine unavailable"]),
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      healthRecords: [],
      recommendations: [],
      validation: {
        ...framework.validation,
        warnings,
        decision:
          framework.validation.decision === "fail"
            ? "fail"
            : !allPresent
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  measureBusinessHealth(
    input: MeasureBusinessHealthInput,
    config: BusinessHealthRankingConfiguration,
  ): BusinessHealthRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateMeasure(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "measure_health",
          engineRecord,
          healthRecords: [],
          recommendations: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      const signals = this.collectSignals();
      let refs = signals.companies.map((c) => c.companyId);
      if (input.companyReference) {
        refs = refs.filter((r) => r === input.companyReference);
        if (refs.length === 0) refs = [input.companyReference];
      }

      if (refs.length === 0) {
        validation.decision = "partial";
        validation.warnings.push("Missing company metrics — no companies to measure");
      }

      const measured = this.healthEngine.measure({
        companyReferences: refs,
        performanceRecords: signals.performance,
        riskRecords: signals.risks,
        config,
      });

      if (signals.performance.length === 0) {
        validation.decision = "partial";
        validation.warnings.push("Missing financial/performance data — defaults applied");
      }

      this.healthRecords = measured;
      engineRecord.currentOperationalState = "active";

      appendBhrLog({
        event: "health_calculation",
        level: "info",
        details: `Measured health for ${measured.length} companies`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "measure_health",
        engineRecord,
        healthRecords: this.healthRecords,
        recommendations: [],
        validation: { ...validation, durationMs: Date.now() - started },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "measure_health",
        [error instanceof Error ? error.message : "Health calculation failed"],
        Date.now() - started,
      );
    }
  }

  rankCompanies(
    input: RankCompaniesInput,
    config: BusinessHealthRankingConfiguration,
  ): BusinessHealthRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRank(input, config);
      if (validation.decision === "fail") {
        return this.failReport("rank_companies", validation.errors, Date.now() - started);
      }

      if (this.healthRecords.length === 0) {
        this.measureBusinessHealth({ validated: true }, config);
      }

      if (!config.rankingRulesEnabled) {
        validation.warnings.push("Ranking rules disabled — records unranked");
        return this.metadataGenerator.buildRunReport({
          action: "rank_companies",
          engineRecord,
          healthRecords: this.healthRecords,
          recommendations: [],
          validation: { ...validation, decision: "partial", durationMs: Date.now() - started },
          durationMs: Date.now() - started,
        });
      }

      this.healthRecords = this.rankingEngine.rank(this.healthRecords);
      const summary = this.analytics.summarize(this.healthRecords);

      appendBhrLog({
        event: "business_ranking",
        level: "info",
        details: `Ranked ${this.healthRecords.length} companies · avg composite ${summary.averageComposite}`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "rank_companies",
        engineRecord,
        healthRecords: this.healthRecords,
        recommendations: [],
        validation: {
          validationReportId: `bhr-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: this.healthRecords.length === 0 ? "partial" : "pass",
          errors: [],
          warnings:
            this.healthRecords.length === 0 ? ["No health records available for ranking"] : [],
          durationMs: Date.now() - started,
          metadataVersion: BHR_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "rank_companies",
        [error instanceof Error ? error.message : "Ranking failed"],
        Date.now() - started,
      );
    }
  }

  detectDeclining(
    input: DetectDecliningInput,
    config: BusinessHealthRankingConfiguration,
  ): BusinessHealthRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "detect_declining",
          ["Declining detection requires validated=true"],
          Date.now() - started,
        );
      }
      if (this.healthRecords.length === 0) {
        this.rankCompanies({ validated: true }, config);
      }
      const declining = this.healthRecords.filter((r) => r.decliningDetected);
      appendBhrLog({
        event: "declining_detection",
        level: "info",
        details: `Detected ${declining.length} declining businesses`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_declining",
        engineRecord,
        healthRecords: declining,
        recommendations: [],
        validation: {
          validationReportId: `bhr-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: BHR_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_declining",
        [error instanceof Error ? error.message : "Declining detection failed"],
        Date.now() - started,
      );
    }
  }

  detectHighPerforming(
    input: DetectHighPerformingInput,
    config: BusinessHealthRankingConfiguration,
  ): BusinessHealthRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "detect_high_performing",
          ["High-performer detection requires validated=true"],
          Date.now() - started,
        );
      }
      if (this.healthRecords.length === 0) {
        this.rankCompanies({ validated: true }, config);
      }
      const high = this.healthRecords.filter((r) => r.highPerformingDetected);
      appendBhrLog({
        event: "high_performing_detection",
        level: "info",
        details: `Detected ${high.length} high-performing businesses`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_high_performing",
        engineRecord,
        healthRecords: high,
        recommendations: [],
        validation: {
          validationReportId: `bhr-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: BHR_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_high_performing",
        [error instanceof Error ? error.message : "High-performer detection failed"],
        Date.now() - started,
      );
    }
  }

  generatePriorities(
    input: GeneratePrioritiesInput,
    config: BusinessHealthRankingConfiguration,
  ): BusinessHealthRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "generate_priorities",
          ["Priority generation requires validated=true"],
          Date.now() - started,
        );
      }
      if (this.healthRecords.length === 0) {
        this.rankCompanies({ validated: true }, config);
      }
      const recommendations = this.priorities.generate(this.healthRecords);
      appendBhrLog({
        event: "priority_generation",
        level: "info",
        details: `Generated ${recommendations.length} management priorities`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "generate_priorities",
        engineRecord,
        healthRecords: this.healthRecords,
        recommendations,
        validation: {
          validationReportId: `bhr-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: BHR_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_priorities",
        [error instanceof Error ? error.message : "Recommendation failures"],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    input: RunRankingDiagnosticsInput,
    config: BusinessHealthRankingConfiguration,
  ): BusinessHealthRunReport {
    const started = Date.now();
    try {
      if (!this.engineRecord) {
        this.connectBusinessHealthRanking({}, config);
      }
      const measure = this.measureBusinessHealth(
        { companyReference: input.companyReference, validated: true },
        config,
      );
      if (measure.validation.decision === "fail") return measure;
      const ranked = this.rankCompanies({ validated: true }, config);
      if (ranked.validation.decision === "fail") return ranked;
      const priorities = this.generatePriorities({ validated: true }, config);
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord: this.requireConnected(),
        healthRecords: this.healthRecords,
        recommendations: priorities.recommendations,
        validation: {
          validationReportId: `bhr-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision:
            priorities.validation.decision === "fail"
              ? "fail"
              : this.healthRecords.some((r) => r.validationStatus === "partial")
                ? "partial"
                : "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: BHR_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "diagnostics",
        [error instanceof Error ? error.message : "Partial ranking failures"],
        Date.now() - started,
      );
    }
  }
}
