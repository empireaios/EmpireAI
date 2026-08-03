/** X2-03 — Portfolio Performance Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import {
  PPE_CAPABILITIES,
  PPE_METADATA_VERSION,
  PORTFOLIO_PERFORMANCE_ENGINE_ID,
} from "./paths.js";
import { appendPpeLog } from "./ppe-logging.js";
import { CompanyPerformanceEngine } from "./company-performance-engine.js";
import { KpiCalculationEngine } from "./kpi-calculation-engine.js";
import { PortfolioAnalyticsEngine } from "./portfolio-analytics-engine.js";
import { CompanyComparisonEngine } from "./company-comparison-engine.js";
import { PerformanceRecommendationEngine } from "./performance-recommendation-engine.js";
import { PortfolioPerformanceValidator } from "./portfolio-performance-validator.js";
import { PortfolioPerformanceMetadataGenerator } from "./portfolio-performance-metadata-generator.js";
import type { PortfolioPerformanceEngineConfiguration } from "./configuration.js";
import type {
  AnalyzePortfolioInput,
  CalculatePortfolioKpisInput,
  CompareCompaniesInput,
  ConnectPortfolioPerformanceInput,
  MeasureCompanyPerformanceInput,
  PerformanceEngineRecord,
  PerformanceRunReport,
  RecommendPerformanceInput,
  RunPerformanceDiagnosticsInput,
} from "./types.js";

export type PortfolioPerformanceEngineDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
};

export class PortfolioPerformanceManager {
  private engineRecord: PerformanceEngineRecord | null = null;
  private latestKpis: ReturnType<KpiCalculationEngine["calculate"]> | null = null;
  private readonly companyPerformance = new CompanyPerformanceEngine();
  private readonly kpiEngine = new KpiCalculationEngine();
  private readonly analytics = new PortfolioAnalyticsEngine();
  private readonly comparison = new CompanyComparisonEngine();
  private readonly recommendations = new PerformanceRecommendationEngine();
  private readonly validator = new PortfolioPerformanceValidator();
  private readonly metadataGenerator = new PortfolioPerformanceMetadataGenerator();

  constructor(private readonly deps: PortfolioPerformanceEngineDependencies) {}

  getEngineRecord(): PerformanceEngineRecord | null {
    return this.engineRecord;
  }

  getPerformanceRecords() {
    return this.companyPerformance.list();
  }

  averagePerformanceScore(): number {
    return this.companyPerformance.averageScore();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): PerformanceEngineRecord["dependencyPresence"] {
    return {
      enterprisePortfolioFramework: this.deps.enterprisePortfolioFramework
        ? this.probe(() => this.deps.enterprisePortfolioFramework!.getState())
        : false,
      multiCompanyRegistry: this.deps.multiCompanyRegistry
        ? this.probe(() => this.deps.multiCompanyRegistry!.getState())
        : false,
    };
  }

  private requireConnected(): PerformanceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Portfolio Performance Engine not connected — call connectPortfolioPerformanceEngine first",
      );
    }
    return this.engineRecord;
  }

  private failReport(
    action: PerformanceRunReport["action"],
    errors: string[],
    durationMs: number,
  ): PerformanceRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "ppe-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: PORTFOLIO_PERFORMANCE_ENGINE_ID,
        engineVersion: "PILLOW-PPE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...PPE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: PPE_METADATA_VERSION,
      } satisfies PerformanceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      performanceRecords: [],
      validation: {
        validationReportId: `ppe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: PPE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(
    config: PortfolioPerformanceEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: PerformanceRunReport["validation"] } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: PORTFOLIO_PERFORMANCE_ENGINE_ID,
        moduleVersion: PPE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-03",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "performance.measured",
            "performance.compared",
            "performance.kpi",
            "performance.recommended",
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
        PORTFOLIO_PERFORMANCE_ENGINE_ID,
      );
    }

    appendPpeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Portfolio Performance Engine with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `ppe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PPE_METADATA_VERSION,
      },
    };
  }

  connectPortfolioPerformanceEngine(
    _input: ConnectPortfolioPerformanceInput,
    config: PortfolioPerformanceEngineConfiguration,
  ): PerformanceRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();

    this.engineRecord = {
      engineRecordId: `ppe-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PORTFOLIO_PERFORMANCE_ENGINE_ID,
      engineVersion: "PILLOW-PPE-001",
      currentOperationalState: "connected",
      healthStatus:
        presence.enterprisePortfolioFramework && presence.multiCompanyRegistry
          ? "healthy"
          : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...PPE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: PPE_METADATA_VERSION,
    };

    appendPpeLog({
      event: "engine_connected",
      level: "info",
      details: "Portfolio Performance Engine connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...(presence.enterprisePortfolioFramework
        ? []
        : ["Enterprise Portfolio Framework dependency unavailable"]),
      ...(presence.multiCompanyRegistry
        ? []
        : ["Multi-Company Registry dependency unavailable"]),
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      performanceRecords: this.companyPerformance.list(),
      validation: {
        ...framework.validation,
        warnings,
        decision:
          framework.validation.decision === "fail"
            ? "fail"
            : !presence.enterprisePortfolioFramework || !presence.multiCompanyRegistry
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  measureCompanyPerformance(
    input: MeasureCompanyPerformanceInput,
    config: PortfolioPerformanceEngineConfiguration,
  ): PerformanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateMeasure(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "measure_company",
          engineRecord,
          performanceRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      if (this.deps.multiCompanyRegistry) {
        const known = this.deps.multiCompanyRegistry
          .getCompanyRecords()
          .some((c) => c.companyId === input.companyReference);
        if (!known) {
          validation.warnings.push(
            "Company reference not present in Multi-Company Registry — structural measure accepted",
          );
        }
      }

      const metrics = this.validator.normalizeMetrics(input.metrics);
      const record = this.companyPerformance.measure(input.companyReference.trim(), metrics);
      const recordValidation = this.validator.validateRecord(record);
      if (recordValidation.decision === "fail") {
        validation.decision = "fail";
        validation.errors.push(...recordValidation.errors);
      } else if (validation.warnings.length > 0) {
        validation.decision = "partial";
      }

      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      return this.metadataGenerator.buildRunReport({
        action: "measure_company",
        engineRecord,
        performanceRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "measure_company",
        [error instanceof Error ? error.message : "Measurement failed"],
        Date.now() - started,
      );
    }
  }

  compareCompanies(
    input: CompareCompaniesInput,
    config: PortfolioPerformanceEngineConfiguration,
  ): PerformanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCompare(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "compare_companies",
          engineRecord,
          performanceRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      let records = this.companyPerformance.list();
      if (input.companyReferences?.length) {
        records = records.filter((r) =>
          input.companyReferences!.includes(r.companyReference),
        );
      }
      if (records.length === 0) {
        validation.decision = "fail";
        validation.errors.push("No performance records available for comparison");
        return this.metadataGenerator.buildRunReport({
          action: "compare_companies",
          engineRecord,
          performanceRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      const ranked = this.comparison.compare(records);
      this.companyPerformance.applyRankings(ranked);

      return this.metadataGenerator.buildRunReport({
        action: "compare_companies",
        engineRecord,
        performanceRecords: ranked,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "compare_companies",
        [error instanceof Error ? error.message : "Comparison failed"],
        Date.now() - started,
      );
    }
  }

  calculatePortfolioKpis(
    input: CalculatePortfolioKpisInput,
    config: PortfolioPerformanceEngineConfiguration,
  ): PerformanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const errors: string[] = [];
      const warnings: string[] = [];
      if (input.validated !== true) errors.push("KPI calculation requires validated=true");
      if (!config.kpiCalculationRulesEnabled) warnings.push("KPI calculation rules disabled");

      const records = this.companyPerformance.list();
      if (records.length === 0) errors.push("Missing KPI data — no companies measured");

      if (errors.length > 0) {
        return this.metadataGenerator.buildRunReport({
          action: "calculate_kpis",
          engineRecord,
          performanceRecords: records,
          validation: {
            validationReportId: `ppe-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail",
            errors,
            warnings,
            durationMs: Date.now() - started,
            metadataVersion: PPE_METADATA_VERSION,
          },
          durationMs: Date.now() - started,
        });
      }

      this.latestKpis = this.kpiEngine.calculate(records);
      return this.metadataGenerator.buildRunReport({
        action: "calculate_kpis",
        engineRecord,
        performanceRecords: records,
        kpiSnapshot: this.latestKpis,
        validation: {
          validationReportId: `ppe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: warnings.length > 0 ? "partial" : "pass",
          errors: [],
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: PPE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "calculate_kpis",
        [error instanceof Error ? error.message : "KPI calculation failed"],
        Date.now() - started,
      );
    }
  }

  analyzePortfolio(
    input: AnalyzePortfolioInput,
    _config: PortfolioPerformanceEngineConfiguration,
  ): PerformanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "analyze_portfolio",
          ["Portfolio analytics requires validated=true"],
          Date.now() - started,
        );
      }

      const records = this.companyPerformance.list();
      const kpis = this.latestKpis ?? this.kpiEngine.calculate(records);
      this.latestKpis = kpis;
      const analyzed = this.analytics.analyze(records, kpis);

      return this.metadataGenerator.buildRunReport({
        action: "analyze_portfolio",
        engineRecord,
        performanceRecords: analyzed.records,
        kpiSnapshot: kpis,
        validation: {
          validationReportId: `ppe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: records.length === 0 ? "partial" : "pass",
          errors: [],
          warnings: analyzed.insights,
          durationMs: Date.now() - started,
          metadataVersion: PPE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "analyze_portfolio",
        [error instanceof Error ? error.message : "Analytics failed"],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: RecommendPerformanceInput,
    _config: PortfolioPerformanceEngineConfiguration,
  ): PerformanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = this.companyPerformance.list();
      const recommendations = this.recommendations.recommend(
        records,
        this.latestKpis,
        input.companyReference,
      );
      return this.metadataGenerator.buildRunReport({
        action: "recommend",
        engineRecord,
        performanceRecords: input.companyReference
          ? records.filter((r) => r.companyReference === input.companyReference)
          : records,
        kpiSnapshot: this.latestKpis,
        recommendations,
        validation: {
          validationReportId: `ppe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: PPE_METADATA_VERSION,
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
    input: RunPerformanceDiagnosticsInput,
    _config: PortfolioPerformanceEngineConfiguration,
  ): PerformanceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = input.companyReference
        ? [this.companyPerformance.get(input.companyReference)].filter(Boolean)
        : this.companyPerformance.list();
      const errors: string[] = [];
      const warnings: string[] = [];

      if (records.length === 0) {
        errors.push(
          input.companyReference
            ? "Performance record not found"
            : "No performance records measured",
        );
      }

      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        performanceRecords: records as ReturnType<CompanyPerformanceEngine["list"]>,
        kpiSnapshot: this.latestKpis,
        validation: {
          validationReportId: `ppe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
          errors,
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: PPE_METADATA_VERSION,
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
    this.latestKpis = null;
    this.companyPerformance.resetForTesting();
  }
}
