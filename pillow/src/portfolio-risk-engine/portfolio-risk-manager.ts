/** X2-07 — Portfolio Risk Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CrossBusinessKnowledgeEngine } from "../cross-business-knowledge-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { ExecutivePortfolioDashboard } from "../executive-portfolio-dashboard/engine.js";
import {
  PORTFOLIO_RISK_ENGINE_ID,
  PRE_CAPABILITIES,
  PRE_METADATA_VERSION,
} from "./paths.js";
import { appendPreLog } from "./pre-logging.js";
import { EnterpriseRiskEngine } from "./enterprise-risk-engine.js";
import { FinancialRiskAnalyzer } from "./financial-risk-analyzer.js";
import { OperationalRiskAnalyzer } from "./operational-risk-analyzer.js";
import { RiskScoringEngine } from "./risk-scoring-engine.js";
import { RiskRecommendationEngine } from "./risk-recommendation-engine.js";
import { RiskMetadataGenerator } from "./risk-metadata-generator.js";
import { RiskValidator } from "./risk-validator.js";
import type { PortfolioRiskEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeFinancialRiskInput,
  AnalyzeOperationalRiskInput,
  ConnectPortfolioRiskInput,
  DetectEmergingRisksInput,
  MonitorRisksInput,
  PortfolioRiskRecord,
  PortfolioRiskScoreSummary,
  RecommendRiskMitigationInput,
  RiskEngineRecord,
  RiskRunReport,
  RunRiskDiagnosticsInput,
  ScorePortfolioRiskInput,
} from "./types.js";

export type PortfolioRiskEngineDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  crossBusinessKnowledgeEngine: CrossBusinessKnowledgeEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  executivePortfolioDashboard: ExecutivePortfolioDashboard | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class PortfolioRiskManager {
  private engineRecord: RiskEngineRecord | null = null;
  private riskRecords: PortfolioRiskRecord[] = [];
  private scoreSummary: PortfolioRiskScoreSummary | null = null;
  private readonly enterprise = new EnterpriseRiskEngine();
  private readonly financial = new FinancialRiskAnalyzer();
  private readonly operational = new OperationalRiskAnalyzer();
  private readonly scoring = new RiskScoringEngine();
  private readonly recommendations = new RiskRecommendationEngine();
  private readonly validator = new RiskValidator();
  private readonly metadataGenerator = new RiskMetadataGenerator();

  constructor(private readonly deps: PortfolioRiskEngineDependencies) {}

  getEngineRecord(): RiskEngineRecord | null {
    return this.engineRecord;
  }

  getRiskRecords(): PortfolioRiskRecord[] {
    return [...this.riskRecords];
  }

  getScoreSummary(): PortfolioRiskScoreSummary | null {
    return this.scoreSummary;
  }

  criticalRiskCount(): number {
    return this.riskRecords.filter((r) => r.riskSeverity === "critical").length;
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): RiskEngineRecord["dependencyPresence"] {
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
    };
  }

  private requireConnected(): RiskEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Portfolio Risk Engine not connected — call connectPortfolioRiskEngine first",
      );
    }
    return this.engineRecord;
  }

  private failReport(
    action: RiskRunReport["action"],
    errors: string[],
    durationMs: number,
  ): RiskRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "pre-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: PORTFOLIO_RISK_ENGINE_ID,
        engineVersion: "PILLOW-PRE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...PRE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: PRE_METADATA_VERSION,
      } satisfies RiskEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      riskRecords: [],
      recommendations: [],
      scoreSummary: null,
      validation: {
        validationReportId: `pre-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: PRE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  private collectSignals(companyReference?: string) {
    const epfState = safe(() => this.deps.enterprisePortfolioFramework?.getState() ?? null, null);
    const mcrState = safe(() => this.deps.multiCompanyRegistry?.getState() ?? null, null);
    const ppeState = safe(() => this.deps.portfolioPerformanceEngine?.getState() ?? null, null);
    const cbkState = safe(() => this.deps.crossBusinessKnowledgeEngine?.getState() ?? null, null);
    const cdeState = safe(() => this.deps.capitalDistributionEngine?.getState() ?? null, null);
    const epdState = safe(() => this.deps.executivePortfolioDashboard?.getState() ?? null, null);

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

    const scopedCompanies = companyReference
      ? companies.filter((c) => c.companyId === companyReference)
      : companies;
    const scopedPerf = companyReference
      ? performance.filter((p) => p.companyReference === companyReference)
      : performance;

    const avgPerf =
      scopedPerf.length > 0
        ? Math.round(
            scopedPerf.reduce((s, r) => s + r.overallPerformanceScore, 0) / scopedPerf.length,
          )
        : 0;

    const companyCount = scopedCompanies.length || companies.length;
    const supplierHint =
      companyCount <= 1 ? 70 : companyCount <= 2 ? 55 : Math.max(20, 80 - companyCount * 8);
    const customerHint =
      avgPerf > 0 && avgPerf < 45
        ? 72
        : scopedPerf.length === 1
          ? 65
          : Math.max(20, 60 - scopedPerf.length * 5);

    return {
      epfState,
      mcrState,
      ppeState,
      cbkState,
      cdeState,
      epdState,
      companies: scopedCompanies,
      allCompanies: companies,
      performance: scopedPerf,
      knowledge,
      allocations,
      avgPerf,
      supplierHint,
      customerHint,
      companyReference: companyReference ?? null,
    };
  }

  private mergeRecords(incoming: PortfolioRiskRecord[]): void {
    const validated: PortfolioRiskRecord[] = [];
    for (const record of incoming) {
      const v = this.validator.validateRiskRecord(record);
      if (v.decision === "fail") continue;
      if (record.riskSeverity === "critical" && record.suppressedCritical) continue;
      validated.push(record);
    }
    const keys = new Set(validated.map((r) => `${r.riskCategory}:${r.companyReference}:${r.riskRecordId}`));
    this.riskRecords = [
      ...this.riskRecords.filter(
        (r) => !validated.some((v) => v.riskCategory === r.riskCategory && v.companyReference === r.companyReference),
      ),
      ...validated,
    ];
    void keys;
  }

  registerWithFramework(
    config: PortfolioRiskEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: RiskRunReport["validation"] } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: PORTFOLIO_RISK_ENGINE_ID,
        moduleVersion: PRE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-07",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "risk.monitored",
            "risk.scored",
            "risk.emerging",
            "risk.recommended",
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
      this.deps.enterprisePortfolioFramework.activatePortfolioModule(PORTFOLIO_RISK_ENGINE_ID);
    }

    appendPreLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Portfolio Risk Engine with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `pre-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PRE_METADATA_VERSION,
      },
    };
  }

  connectPortfolioRiskEngine(
    _input: ConnectPortfolioRiskInput,
    config: PortfolioRiskEngineConfiguration,
  ): RiskRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const connectedCount = Object.values(presence).filter(Boolean).length;
    const allPresent = connectedCount === 6;

    this.engineRecord = {
      engineRecordId: `pre-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PORTFOLIO_RISK_ENGINE_ID,
      engineVersion: "PILLOW-PRE-001",
      currentOperationalState: "connected",
      healthStatus: allPresent ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...PRE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: PRE_METADATA_VERSION,
    };

    appendPreLog({
      event: "engine_connected",
      level: "info",
      details: "Portfolio Risk Engine connected",
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
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      riskRecords: [],
      recommendations: [],
      scoreSummary: null,
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

  monitorRisks(
    input: MonitorRisksInput,
    config: PortfolioRiskEngineConfiguration,
  ): RiskRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateMonitor(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "monitor",
          engineRecord,
          riskRecords: [],
          recommendations: [],
          scoreSummary: this.scoreSummary,
          validation,
          durationMs: Date.now() - started,
        });
      }

      if (!config.riskMonitoringRulesEnabled) {
        validation.decision = "partial";
        validation.warnings.push("Risk monitoring rules disabled");
      }

      const signals = this.collectSignals(input.companyReference);
      if (signals.allCompanies.length === 0 && signals.performance.length === 0) {
        validation.decision = "partial";
        validation.warnings.push("Missing enterprise data — risk monitoring partially populated");
      }

      const enterpriseRecords = this.enterprise.monitor({
        companyReference: signals.companyReference,
        registeredModules: signals.epfState?.registeredModules.length ?? 0,
        activeModules: signals.epfState?.health.activeModules ?? 0,
        companyCount: signals.allCompanies.length,
        dashboardHealthScore:
          signals.epdState?.latestSnapshot?.enterpriseHealthSummary.overallHealthScore ??
          signals.epdState?.health.healthScore ??
          0,
        supplierConcentrationHint: signals.supplierHint,
        customerConcentrationHint: signals.customerHint,
      });

      this.mergeRecords(enterpriseRecords);
      if (config.riskScoringRulesEnabled) {
        this.scoreSummary = this.scoring.aggregate(this.riskRecords);
      }

      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      return this.metadataGenerator.buildRunReport({
        action: "monitor",
        engineRecord,
        riskRecords: this.riskRecords,
        recommendations: [],
        scoreSummary: this.scoreSummary,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "monitor",
        [error instanceof Error ? error.message : "Risk monitoring failed"],
        Date.now() - started,
      );
    }
  }

  analyzeFinancialRisk(
    input: AnalyzeFinancialRiskInput,
    config: PortfolioRiskEngineConfiguration,
  ): RiskRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "analyze_financial",
          ["Financial risk analysis requires validated=true"],
          Date.now() - started,
        );
      }
      const signals = this.collectSignals(input.companyReference);
      const records = this.financial.analyze({
        companyReference: signals.companyReference,
        availablePoolUnits: signals.cdeState?.health.availablePoolUnits ?? 0,
        highRiskCapitalSignals: signals.cdeState?.health.highRiskSignals ?? 0,
        averagePerformanceScore: signals.avgPerf,
        allocationCount: signals.allocations.length,
      });
      this.mergeRecords(records);
      if (config.riskScoringRulesEnabled) {
        this.scoreSummary = this.scoring.aggregate(this.riskRecords);
      }
      return this.metadataGenerator.buildRunReport({
        action: "analyze_financial",
        engineRecord,
        riskRecords: this.riskRecords.filter((r) => r.riskCategory === "financial"),
        recommendations: [],
        scoreSummary: this.scoreSummary,
        validation: {
          validationReportId: `pre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: records.length === 0 ? "partial" : "pass",
          errors: [],
          warnings: records.length === 0 ? ["Financial risk calculation limited"] : [],
          durationMs: Date.now() - started,
          metadataVersion: PRE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "analyze_financial",
        [error instanceof Error ? error.message : "Financial risk analysis failed"],
        Date.now() - started,
      );
    }
  }

  analyzeOperationalRisk(
    input: AnalyzeOperationalRiskInput,
    config: PortfolioRiskEngineConfiguration,
  ): RiskRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "analyze_operational",
          ["Operational risk analysis requires validated=true"],
          Date.now() - started,
        );
      }
      const signals = this.collectSignals(input.companyReference);
      const pending = signals.allCompanies.filter((c) => c.operationalStatus === "pending").length;
      const active = signals.allCompanies.filter((c) => c.operationalStatus === "active").length;
      const records = this.operational.analyze({
        companyReference: signals.companyReference,
        activeCompanies: active,
        pendingCompanies: pending,
        knowledgeAssets: signals.knowledge.length,
        sharedKnowledge: signals.cbkState?.health.sharedKnowledgeRecords ?? 0,
        frameworkHealthScore: signals.epfState?.health.healthScore ?? 0,
      });
      this.mergeRecords(records);
      if (config.riskScoringRulesEnabled) {
        this.scoreSummary = this.scoring.aggregate(this.riskRecords);
      }
      return this.metadataGenerator.buildRunReport({
        action: "analyze_operational",
        engineRecord,
        riskRecords: this.riskRecords.filter((r) => r.riskCategory === "operational"),
        recommendations: [],
        scoreSummary: this.scoreSummary,
        validation: {
          validationReportId: `pre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: PRE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "analyze_operational",
        [error instanceof Error ? error.message : "Operational risk analysis failed"],
        Date.now() - started,
      );
    }
  }

  scorePortfolioRisk(
    input: ScorePortfolioRiskInput,
    config: PortfolioRiskEngineConfiguration,
  ): RiskRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "score",
          ["Portfolio risk scoring requires validated=true"],
          Date.now() - started,
        );
      }
      if (this.riskRecords.length === 0) {
        this.monitorRisks({ validated: true }, config);
        this.analyzeFinancialRisk({ validated: true }, config);
        this.analyzeOperationalRisk({ validated: true }, config);
      }
      this.scoreSummary = this.scoring.aggregate(this.riskRecords);
      return this.metadataGenerator.buildRunReport({
        action: "score",
        engineRecord,
        riskRecords: this.riskRecords,
        recommendations: [],
        scoreSummary: this.scoreSummary,
        validation: {
          validationReportId: `pre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: this.riskRecords.length === 0 ? "partial" : "pass",
          errors: [],
          warnings:
            this.riskRecords.length === 0 ? ["No risk records available for scoring"] : [],
          durationMs: Date.now() - started,
          metadataVersion: PRE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "score",
        [error instanceof Error ? error.message : "Risk scoring failed"],
        Date.now() - started,
      );
    }
  }

  detectEmergingRisks(
    input: DetectEmergingRisksInput,
    config: PortfolioRiskEngineConfiguration,
  ): RiskRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "detect_emerging",
          ["Emerging risk detection requires validated=true"],
          Date.now() - started,
        );
      }
      if (this.riskRecords.length === 0) {
        this.monitorRisks({ validated: true }, config);
      }
      const emerging = this.riskRecords.filter((r) => r.emerging);
      appendPreLog({
        event: "risk_alerts",
        level: emerging.length > 0 ? "warn" : "info",
        details: `Detected ${emerging.length} emerging risk(s)`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_emerging",
        engineRecord,
        riskRecords: emerging,
        recommendations: [],
        scoreSummary: this.scoreSummary,
        validation: {
          validationReportId: `pre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: PRE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_emerging",
        [error instanceof Error ? error.message : "Emerging risk detection failed"],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: RecommendRiskMitigationInput,
    config: PortfolioRiskEngineConfiguration,
  ): RiskRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "recommend",
          ["Risk recommendations require validated=true"],
          Date.now() - started,
        );
      }
      if (this.riskRecords.length === 0) {
        this.scorePortfolioRisk({ validated: true }, config);
      }
      if (!this.scoreSummary && config.riskScoringRulesEnabled) {
        this.scoreSummary = this.scoring.aggregate(this.riskRecords);
      }
      const recs = this.recommendations.generate(this.riskRecords, this.scoreSummary);
      return this.metadataGenerator.buildRunReport({
        action: "recommend",
        engineRecord,
        riskRecords: this.riskRecords,
        recommendations: recs,
        scoreSummary: this.scoreSummary,
        validation: {
          validationReportId: `pre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: PRE_METADATA_VERSION,
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
    input: RunRiskDiagnosticsInput,
    _config: PortfolioRiskEngineConfiguration,
  ): RiskRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const errors: string[] = [];
      const warnings: string[] = [];
      if (this.riskRecords.length === 0) {
        errors.push("Missing enterprise data — no risk records");
      }
      if (input.companyReference) {
        const match = this.riskRecords.some(
          (r) => r.companyReference === input.companyReference,
        );
        if (!match) warnings.push("No risk records for requested company reference");
      }
      const critical = this.criticalRiskCount();
      if (critical > 0) {
        appendPreLog({
          event: "risk_alerts",
          level: "warn",
          details: `${critical} critical risk(s) present — never suppressed`,
        });
      }
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        riskRecords: this.riskRecords,
        recommendations: [],
        scoreSummary: this.scoreSummary,
        validation: {
          validationReportId: `pre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
          errors,
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: PRE_METADATA_VERSION,
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
    this.riskRecords = [];
    this.scoreSummary = null;
  }
}
