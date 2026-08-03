/** X2-08 — Portfolio Balance Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CrossBusinessKnowledgeEngine } from "../cross-business-knowledge-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { ExecutivePortfolioDashboard } from "../executive-portfolio-dashboard/engine.js";
import type { PortfolioRiskEngine } from "../portfolio-risk-engine/engine.js";
import {
  PBE_CAPABILITIES,
  PBE_METADATA_VERSION,
  PORTFOLIO_BALANCE_ENGINE_ID,
} from "./paths.js";
import { appendPbeLog } from "./pbe-logging.js";
import { DiversificationAnalysisEngine } from "./diversification-analysis-engine.js";
import { ConcentrationAnalysisEngine } from "./concentration-analysis-engine.js";
import { ExposureAnalysisEngine } from "./exposure-analysis-engine.js";
import { PortfolioOptimizationEngine } from "./portfolio-optimization-engine.js";
import { BalanceRecommendationEngine } from "./balance-recommendation-engine.js";
import { PortfolioBalanceMetadataGenerator } from "./portfolio-balance-metadata-generator.js";
import { PortfolioBalanceValidator } from "./portfolio-balance-validator.js";
import type { PortfolioBalanceEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeConcentrationInput,
  AnalyzeExposureInput,
  BalanceEngineRecord,
  BalanceRunReport,
  ConnectPortfolioBalanceInput,
  DetectImbalanceInput,
  MeasureDiversificationInput,
  OptimizePortfolioBalanceInput,
  PortfolioBalanceRecord,
  RecommendBalanceInput,
  RunBalanceDiagnosticsInput,
} from "./types.js";

export type PortfolioBalanceEngineDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  crossBusinessKnowledgeEngine: CrossBusinessKnowledgeEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  executivePortfolioDashboard: ExecutivePortfolioDashboard | null;
  portfolioRiskEngine: PortfolioRiskEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class PortfolioBalanceManager {
  private engineRecord: BalanceEngineRecord | null = null;
  private balanceRecords: PortfolioBalanceRecord[] = [];
  private latestScores = {
    diversificationScore: 0,
    industryConcentrationScore: 0,
    revenueConcentrationScore: 0,
    capitalConcentrationScore: 0,
    geographicExposureScore: 0,
  };
  private readonly diversification = new DiversificationAnalysisEngine();
  private readonly concentration = new ConcentrationAnalysisEngine();
  private readonly exposure = new ExposureAnalysisEngine();
  private readonly optimization = new PortfolioOptimizationEngine();
  private readonly recommendations = new BalanceRecommendationEngine();
  private readonly validator = new PortfolioBalanceValidator();
  private readonly metadataGenerator = new PortfolioBalanceMetadataGenerator();

  constructor(private readonly deps: PortfolioBalanceEngineDependencies) {}

  getEngineRecord(): BalanceEngineRecord | null {
    return this.engineRecord;
  }

  getBalanceRecords(): PortfolioBalanceRecord[] {
    return [...this.balanceRecords];
  }

  latestDiversificationScore(): number {
    return (
      this.balanceRecords[this.balanceRecords.length - 1]?.diversificationScore ??
      this.latestScores.diversificationScore
    );
  }

  imbalanceCount(): number {
    return this.balanceRecords.filter((r) => r.imbalanceDetected).length;
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): BalanceEngineRecord["dependencyPresence"] {
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
    };
  }

  private requireConnected(): BalanceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Portfolio Balance Engine not connected — call connectPortfolioBalanceEngine first",
      );
    }
    return this.engineRecord;
  }

  private failReport(
    action: BalanceRunReport["action"],
    errors: string[],
    durationMs: number,
  ): BalanceRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "pbe-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: PORTFOLIO_BALANCE_ENGINE_ID,
        engineVersion: "PILLOW-PBE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...PBE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: PBE_METADATA_VERSION,
      } satisfies BalanceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      balanceRecords: [],
      recommendations: [],
      validation: {
        validationReportId: `pbe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: PBE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  private collectSignals() {
    const epfState = safe(() => this.deps.enterprisePortfolioFramework?.getState() ?? null, null);
    const cbkState = safe(() => this.deps.crossBusinessKnowledgeEngine?.getState() ?? null, null);
    const companies = safe(() => this.deps.multiCompanyRegistry?.getCompanyRecords() ?? [], []);
    const performance = safe(
      () => this.deps.portfolioPerformanceEngine?.getPerformanceRecords() ?? [],
      [],
    );
    const knowledge = safe(
      () => this.deps.crossBusinessKnowledgeEngine?.getKnowledgeRecords() ?? [],
      [],
    );
    const allocations = safe(
      () => this.deps.capitalDistributionEngine?.getAllocationRecords() ?? [],
      [],
    );

    const categoryMap = new Map<string, number>();
    for (const c of companies) {
      categoryMap.set(c.companyCategory, (categoryMap.get(c.companyCategory) ?? 0) + 1);
    }
    const totalCompanies = companies.length || 1;
    const categoryShares = [...categoryMap.values()].map((n) => (n / totalCompanies) * 100);

    const perfScores = performance.map((p) => p.overallPerformanceScore);
    const spread =
      perfScores.length > 1 ? Math.max(...perfScores) - Math.min(...perfScores) : 0;
    const allocationWeights = allocations.map((a) => a.approvedAllocation);

    return {
      epfState,
      cbkState,
      companies,
      performance,
      knowledge,
      allocations,
      categoryShares,
      categoryCount: categoryMap.size,
      perfScores,
      spread,
      allocationWeights,
    };
  }

  registerWithFramework(
    config: PortfolioBalanceEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: BalanceRunReport["validation"] } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: PORTFOLIO_BALANCE_ENGINE_ID,
        moduleVersion: PBE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-08",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "balance.measured",
            "balance.imbalance",
            "balance.optimized",
            "balance.recommended",
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
        PORTFOLIO_BALANCE_ENGINE_ID,
      );
    }

    appendPbeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Portfolio Balance Engine with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `pbe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PBE_METADATA_VERSION,
      },
    };
  }

  connectPortfolioBalanceEngine(
    _input: ConnectPortfolioBalanceInput,
    config: PortfolioBalanceEngineConfiguration,
  ): BalanceRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const connectedCount = Object.values(presence).filter(Boolean).length;
    const allPresent = connectedCount === 7;

    this.engineRecord = {
      engineRecordId: `pbe-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PORTFOLIO_BALANCE_ENGINE_ID,
      engineVersion: "PILLOW-PBE-001",
      currentOperationalState: "connected",
      healthStatus: allPresent ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...PBE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: PBE_METADATA_VERSION,
    };

    appendPbeLog({
      event: "engine_connected",
      level: "info",
      details: "Portfolio Balance Engine connected",
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
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      balanceRecords: [],
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

  measureDiversification(
    input: MeasureDiversificationInput,
    config: PortfolioBalanceEngineConfiguration,
  ): BalanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateMeasure(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "measure_diversification",
          engineRecord,
          balanceRecords: [],
          recommendations: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      const signals = this.collectSignals();
      if (signals.companies.length === 0) {
        validation.decision = "partial";
        validation.warnings.push("Missing company data — diversification partially populated");
      }

      if (config.diversificationRulesEnabled) {
        this.latestScores.diversificationScore = this.diversification.measure({
          companyCount: signals.companies.length,
          categoryCount: signals.categoryCount,
          performanceSpread: signals.spread,
          knowledgeShared: signals.cbkState?.health.sharedKnowledgeRecords ?? 0,
        });
      }

      engineRecord.currentOperationalState = "active";
      return this.metadataGenerator.buildRunReport({
        action: "measure_diversification",
        engineRecord,
        balanceRecords: this.balanceRecords,
        recommendations: [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "measure_diversification",
        [error instanceof Error ? error.message : "Balance calculation failed"],
        Date.now() - started,
      );
    }
  }

  analyzeConcentration(
    input: AnalyzeConcentrationInput,
    config: PortfolioBalanceEngineConfiguration,
  ): BalanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "analyze_concentration",
          ["Concentration analysis requires validated=true"],
          Date.now() - started,
        );
      }
      const signals = this.collectSignals();
      if (config.concentrationThresholdsEnabled) {
        this.latestScores.industryConcentrationScore =
          this.concentration.analyzeIndustry(signals.categoryShares);
        this.latestScores.revenueConcentrationScore = this.concentration.analyzeRevenue(
          signals.perfScores,
        );
        this.latestScores.capitalConcentrationScore = this.concentration.analyzeCapital(
          signals.allocationWeights,
        );
        this.concentration.summarize(this.latestScores);
      }
      return this.metadataGenerator.buildRunReport({
        action: "analyze_concentration",
        engineRecord,
        balanceRecords: this.balanceRecords,
        recommendations: [],
        validation: {
          validationReportId: `pbe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: signals.companies.length === 0 ? "partial" : "pass",
          errors: [],
          warnings:
            signals.companies.length === 0 ? ["Missing portfolio data for concentration"] : [],
          durationMs: Date.now() - started,
          metadataVersion: PBE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "analyze_concentration",
        [error instanceof Error ? error.message : "Concentration analysis failed"],
        Date.now() - started,
      );
    }
  }

  analyzeExposure(
    input: AnalyzeExposureInput,
    _config: PortfolioBalanceEngineConfiguration,
  ): BalanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "analyze_exposure",
          ["Exposure analysis requires validated=true"],
          Date.now() - started,
        );
      }
      const signals = this.collectSignals();
      this.latestScores.geographicExposureScore = this.exposure.measureGeographicExposure({
        companyCount: signals.companies.length,
        categoryCount: signals.categoryCount,
        activeModules: signals.epfState?.health.activeModules ?? 0,
      });
      return this.metadataGenerator.buildRunReport({
        action: "analyze_exposure",
        engineRecord,
        balanceRecords: this.balanceRecords,
        recommendations: [],
        validation: {
          validationReportId: `pbe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: PBE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "analyze_exposure",
        [error instanceof Error ? error.message : "Exposure analysis failed"],
        Date.now() - started,
      );
    }
  }

  detectImbalance(
    input: DetectImbalanceInput,
    config: PortfolioBalanceEngineConfiguration,
  ): BalanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "detect_imbalance",
          ["Imbalance detection requires validated=true"],
          Date.now() - started,
        );
      }
      if (this.latestScores.diversificationScore === 0) {
        this.measureDiversification({ validated: true }, config);
        this.analyzeConcentration({ validated: true }, config);
        this.analyzeExposure({ validated: true }, config);
      }
      const detection = this.optimization.detectImbalance({
        ...this.latestScores,
        minDiversificationScore: config.minDiversificationScore,
        maxIndustry: config.maxIndustryConcentrationPercent,
        maxRevenue: config.maxRevenueConcentrationPercent,
        maxCapital: config.maxCapitalConcentrationPercent,
        imbalanceAlertThreshold: config.imbalanceAlertThreshold,
      });
      const record = this.optimization.buildRecord({
        portfolioReference: "enterprise-portfolio",
        ...this.latestScores,
        imbalanceDetected: detection.imbalanceDetected,
        overexposureDetected: detection.overexposureDetected,
        actions: detection.actions,
      });
      const recordValidation = this.validator.validateBalanceRecord(record);
      if (recordValidation.decision !== "fail") {
        this.balanceRecords.push(record);
      }
      return this.metadataGenerator.buildRunReport({
        action: "detect_imbalance",
        engineRecord,
        balanceRecords: [record],
        recommendations: [],
        validation: recordValidation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_imbalance",
        [error instanceof Error ? error.message : "Imbalance detection failed"],
        Date.now() - started,
      );
    }
  }

  optimizePortfolioBalance(
    input: OptimizePortfolioBalanceInput,
    config: PortfolioBalanceEngineConfiguration,
  ): BalanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "optimize",
          ["Portfolio optimization requires validated=true"],
          Date.now() - started,
        );
      }
      if (!config.optimizationRulesEnabled) {
        return this.failReport(
          "optimize",
          ["Optimization rules disabled"],
          Date.now() - started,
        );
      }
      // Safety: never auto-rebalance — produce advisory record only
      void config.neverAutoRebalanceBeyondApprovalPolicy;
      const detect = this.detectImbalance({ validated: true }, config);
      return this.metadataGenerator.buildRunReport({
        action: "optimize",
        engineRecord,
        balanceRecords: detect.balanceRecords,
        recommendations: [],
        validation: {
          ...detect.validation,
          warnings: [
            ...detect.validation.warnings,
            "Optimization advisory only — automatic rebalancing not applied",
          ],
          decision: detect.validation.decision === "fail" ? "fail" : "pass",
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "optimize",
        [error instanceof Error ? error.message : "Optimization failed"],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: RecommendBalanceInput,
    config: PortfolioBalanceEngineConfiguration,
  ): BalanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "recommend",
          ["Balancing recommendations require validated=true"],
          Date.now() - started,
        );
      }
      if (this.balanceRecords.length === 0) {
        this.optimizePortfolioBalance({ validated: true }, config);
      }
      const recs = this.recommendations.generate(this.balanceRecords);
      return this.metadataGenerator.buildRunReport({
        action: "recommend",
        engineRecord,
        balanceRecords: this.balanceRecords,
        recommendations: recs,
        validation: {
          validationReportId: `pbe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: PBE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "recommend",
        [error instanceof Error ? error.message : "Recommendation generation failed"],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    input: RunBalanceDiagnosticsInput,
    _config: PortfolioBalanceEngineConfiguration,
  ): BalanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const errors: string[] = [];
      const warnings: string[] = [];
      if (this.balanceRecords.length === 0) {
        errors.push("Missing portfolio data — no balance records");
      }
      if (
        input.portfolioReference &&
        !this.balanceRecords.some((r) => r.portfolioReference === input.portfolioReference)
      ) {
        warnings.push("No balance records for requested portfolio reference");
      }
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        balanceRecords: this.balanceRecords,
        recommendations: [],
        validation: {
          validationReportId: `pbe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
          errors,
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: PBE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "diagnostics",
        [error instanceof Error ? error.message : "Diagnostics failed"],
        Date.now() - started,
      );
    }
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.balanceRecords = [];
    this.latestScores = {
      diversificationScore: 0,
      industryConcentrationScore: 0,
      revenueConcentrationScore: 0,
      capitalConcentrationScore: 0,
      geographicExposureScore: 0,
    };
  }
}
