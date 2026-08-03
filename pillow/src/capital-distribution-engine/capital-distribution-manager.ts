/** X2-05 — Capital Distribution Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CrossBusinessKnowledgeEngine } from "../cross-business-knowledge-engine/engine.js";
import {
  CDE_CAPABILITIES,
  CDE_METADATA_VERSION,
  CAPITAL_DISTRIBUTION_ENGINE_ID,
} from "./paths.js";
import { appendCdeLog } from "./cde-logging.js";
import { CapitalAllocationEngine } from "./capital-allocation-engine.js";
import { InvestmentEvaluationEngine } from "./investment-evaluation-engine.js";
import { RoiAnalysisEngine } from "./roi-analysis-engine.js";
import { CapitalRiskAnalyzer } from "./capital-risk-analyzer.js";
import { CapitalRecommendationEngine } from "./capital-recommendation-engine.js";
import { CapitalValidator } from "./capital-validator.js";
import { CapitalMetadataGenerator } from "./capital-metadata-generator.js";
import type { CapitalDistributionEngineConfiguration } from "./configuration.js";
import type {
  AllocateCapitalInput,
  AnalyzeCapitalRiskInput,
  CapitalEngineRecord,
  CapitalRunReport,
  ConnectCapitalDistributionInput,
  EvaluateFundingInput,
  EvaluateOpportunityInput,
  ManageCapitalPoolInput,
  RankCapitalPrioritiesInput,
  RecommendCapitalInput,
  RunCapitalDiagnosticsInput,
} from "./types.js";

export type CapitalDistributionEngineDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  crossBusinessKnowledgeEngine: CrossBusinessKnowledgeEngine | null;
};

export class CapitalDistributionManager {
  private engineRecord: CapitalEngineRecord | null = null;
  private latestRisks: ReturnType<CapitalRiskAnalyzer["analyze"]> = [];
  private readonly allocationEngine = new CapitalAllocationEngine();
  private readonly investmentEval = new InvestmentEvaluationEngine();
  private readonly roiAnalysis = new RoiAnalysisEngine();
  private readonly riskAnalyzer = new CapitalRiskAnalyzer();
  private readonly recommendations = new CapitalRecommendationEngine();
  private readonly validator = new CapitalValidator();
  private readonly metadataGenerator = new CapitalMetadataGenerator();

  constructor(private readonly deps: CapitalDistributionEngineDependencies) {}

  getEngineRecord(): CapitalEngineRecord | null {
    return this.engineRecord;
  }

  getAllocationRecords() {
    return this.allocationEngine.listAllocations();
  }

  getPoolRecords() {
    const pool = this.allocationEngine.getPool();
    return pool ? [pool] : [];
  }

  availablePoolUnits(): number {
    return this.allocationEngine.getPool()?.availableUnits ?? 0;
  }

  highRiskCount(): number {
    return this.latestRisks.filter((r) => r.severity === "high").length;
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): CapitalEngineRecord["dependencyPresence"] {
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
    };
  }

  private requireConnected(): CapitalEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Capital Distribution Engine not connected — call connectCapitalDistributionEngine first",
      );
    }
    return this.engineRecord;
  }

  private performanceScore(companyReference: string): number | undefined {
    if (!this.deps.portfolioPerformanceEngine) return undefined;
    try {
      const record = this.deps.portfolioPerformanceEngine
        .getPerformanceRecords()
        .find((r) => r.companyReference === companyReference);
      return record?.overallPerformanceScore;
    } catch {
      return undefined;
    }
  }

  private failReport(
    action: CapitalRunReport["action"],
    errors: string[],
    durationMs: number,
  ): CapitalRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "cde-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: CAPITAL_DISTRIBUTION_ENGINE_ID,
        engineVersion: "PILLOW-CDE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...CDE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: CDE_METADATA_VERSION,
      } satisfies CapitalEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `cde-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: CDE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(
    config: CapitalDistributionEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: CapitalRunReport["validation"] } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: CAPITAL_DISTRIBUTION_ENGINE_ID,
        moduleVersion: CDE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-05",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "capital.requested",
            "capital.allocated",
            "capital.risk",
            "capital.recommended",
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
        CAPITAL_DISTRIBUTION_ENGINE_ID,
      );
    }

    appendCdeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Capital Distribution Engine with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `cde-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CDE_METADATA_VERSION,
      },
    };
  }

  connectCapitalDistributionEngine(
    _input: ConnectCapitalDistributionInput,
    config: CapitalDistributionEngineConfiguration,
  ): CapitalRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const allPresent =
      presence.enterprisePortfolioFramework &&
      presence.multiCompanyRegistry &&
      presence.portfolioPerformanceEngine &&
      presence.crossBusinessKnowledgeEngine;

    this.allocationEngine.ensurePool(config.defaultPoolUnits);

    this.engineRecord = {
      engineRecordId: `cde-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CAPITAL_DISTRIBUTION_ENGINE_ID,
      engineVersion: "PILLOW-CDE-001",
      currentOperationalState: "connected",
      healthStatus: allPresent ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...CDE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: CDE_METADATA_VERSION,
    };

    appendCdeLog({
      event: "engine_connected",
      level: "info",
      details: "Capital Distribution Engine connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...(presence.enterprisePortfolioFramework ? [] : ["EPF dependency unavailable"]),
      ...(presence.multiCompanyRegistry ? [] : ["Multi-Company Registry unavailable"]),
      ...(presence.portfolioPerformanceEngine
        ? []
        : ["Portfolio Performance Engine unavailable"]),
      ...(presence.crossBusinessKnowledgeEngine
        ? []
        : ["Cross-Business Knowledge Engine unavailable"]),
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      poolRecords: this.getPoolRecords(),
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

  manageCapitalPool(
    input: ManageCapitalPoolInput,
    config: CapitalDistributionEngineConfiguration,
  ): CapitalRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePool(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "manage_pool",
          engineRecord,
          validation,
          durationMs: Date.now() - started,
        });
      }
      const pool = this.allocationEngine.managePool({
        poolReference: input.poolReference,
        availableUnits: input.availableUnits,
        defaultUnits: config.defaultPoolUnits,
      });
      return this.metadataGenerator.buildRunReport({
        action: "manage_pool",
        engineRecord,
        poolRecords: [pool],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "manage_pool",
        [error instanceof Error ? error.message : "Pool management failed"],
        Date.now() - started,
      );
    }
  }

  private buildAllocation(
    input: EvaluateFundingInput | EvaluateOpportunityInput | AllocateCapitalInput,
    config: CapitalDistributionEngineConfiguration,
    action: CapitalRunReport["action"],
  ): CapitalRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateFunding(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action,
          engineRecord,
          validation,
          durationMs: Date.now() - started,
        });
      }

      appendCdeLog({
        event: "capital_request",
        level: "info",
        details: `Request ${input.requestedCapital} units for ${input.companyReference}`,
      });

      const opportunityRef =
        "investmentOpportunityReference" in input && input.investmentOpportunityReference
          ? input.investmentOpportunityReference
          : `structural://opportunity/${input.companyReference}`;

      const expectedRoi = this.roiAnalysis.calculateExpectedRoi({
        requestedCapital: input.requestedCapital,
        expectedRoiHint: input.expectedRoiHint,
        performanceScore: this.performanceScore(input.companyReference),
      });

      const priority = this.investmentEval.evaluatePriority({
        expectedRoi,
        requestedCapital: input.requestedCapital,
        minExpectedRoi: config.minExpectedRoi,
      });

      const provisionalEfficiency = this.roiAnalysis.calculateCapitalEfficiency(
        expectedRoi,
        Math.min(input.requestedCapital, config.maxAutoApproveUnits),
      );

      if (action === "evaluate_funding" || action === "evaluate_opportunity") {
        engineRecord.currentOperationalState = "active";
        return this.metadataGenerator.buildRunReport({
          action,
          engineRecord,
          poolRecords: this.getPoolRecords(),
          allocationRecords: [
            {
              capitalAllocationId: `cde-eval-${Date.now()}`,
              timestamp: new Date().toISOString(),
              companyReference: input.companyReference.trim(),
              investmentOpportunityReference: opportunityRef,
              requestedCapital: Math.round(input.requestedCapital),
              approvedAllocation: 0,
              expectedRoi,
              allocationPriority: priority,
              validationStatus: "passed",
              metadataVersion: CDE_METADATA_VERSION,
              capitalEfficiency: provisionalEfficiency,
              autoApproved: false,
              requiresManualApproval: true,
              structuralSignalOnly: true,
              sensitiveFinancialData: false,
              ranking: null,
            },
          ],
          validation,
          durationMs: Date.now() - started,
        });
      }

      const record = this.allocationEngine.proposeAllocation({
        companyReference: input.companyReference,
        investmentOpportunityReference: opportunityRef,
        requestedCapital: input.requestedCapital,
        expectedRoi,
        capitalEfficiency: provisionalEfficiency,
        allocationPriority: priority,
        config,
      });

      const recordValidation = this.validator.validateRecord(record);
      if (recordValidation.decision === "fail") {
        validation.decision = "fail";
        validation.errors.push(...recordValidation.errors);
      } else if (record.requiresManualApproval) {
        validation.decision = "partial";
        validation.warnings.push(
          "Allocation capped by approval policy — manual approval required beyond auto-approve limit",
        );
      }

      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        poolRecords: this.getPoolRecords(),
        allocationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        action,
        [error instanceof Error ? error.message : "Allocation operation failed"],
        Date.now() - started,
      );
    }
  }

  evaluateFunding(
    input: EvaluateFundingInput,
    config: CapitalDistributionEngineConfiguration,
  ): CapitalRunReport {
    return this.buildAllocation(input, config, "evaluate_funding");
  }

  evaluateOpportunity(
    input: EvaluateOpportunityInput,
    config: CapitalDistributionEngineConfiguration,
  ): CapitalRunReport {
    return this.buildAllocation(input, config, "evaluate_opportunity");
  }

  allocateCapital(
    input: AllocateCapitalInput,
    config: CapitalDistributionEngineConfiguration,
  ): CapitalRunReport {
    return this.buildAllocation(input, config, "allocate");
  }

  analyzeCapitalRisk(
    input: AnalyzeCapitalRiskInput,
    config: CapitalDistributionEngineConfiguration,
  ): CapitalRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "analyze_risk",
          ["Capital risk analysis requires validated=true"],
          Date.now() - started,
        );
      }
      if (!config.riskThresholdsEnabled) {
        return this.metadataGenerator.buildRunReport({
          action: "analyze_risk",
          engineRecord,
          riskSignals: [],
          validation: {
            validationReportId: `cde-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "partial",
            errors: [],
            warnings: ["Risk thresholds disabled by configuration"],
            durationMs: Date.now() - started,
            metadataVersion: CDE_METADATA_VERSION,
          },
          durationMs: Date.now() - started,
        });
      }

      this.latestRisks = this.riskAnalyzer.analyze({
        pool: this.allocationEngine.getPool(),
        allocations: this.allocationEngine.listAllocations(),
        config,
      });

      return this.metadataGenerator.buildRunReport({
        action: "analyze_risk",
        engineRecord,
        poolRecords: this.getPoolRecords(),
        allocationRecords: this.allocationEngine.listAllocations(),
        riskSignals: this.latestRisks,
        validation: {
          validationReportId: `cde-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: this.latestRisks.some((r) => r.severity === "high") ? "partial" : "pass",
          errors: [],
          warnings: this.latestRisks.map((r) => r.rationale),
          durationMs: Date.now() - started,
          metadataVersion: CDE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "analyze_risk",
        [error instanceof Error ? error.message : "Risk analysis failed"],
        Date.now() - started,
      );
    }
  }

  rankCapitalPriorities(
    input: RankCapitalPrioritiesInput,
    _config: CapitalDistributionEngineConfiguration,
  ): CapitalRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "rank_priorities",
          ["Capital priority ranking requires validated=true"],
          Date.now() - started,
        );
      }

      const allocations = this.allocationEngine.listAllocations();
      if (allocations.length === 0) {
        return this.failReport(
          "rank_priorities",
          ["No capital allocation records to rank"],
          Date.now() - started,
        );
      }

      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 } as const;
      const ranked = [...allocations]
        .sort(
          (a, b) =>
            b.expectedRoi * 2 +
            priorityWeight[b.allocationPriority] * 10 -
            (a.expectedRoi * 2 + priorityWeight[a.allocationPriority] * 10),
        )
        .map((record, index) => ({ ...record, ranking: index + 1 }));

      this.allocationEngine.applyRankings(ranked);

      return this.metadataGenerator.buildRunReport({
        action: "rank_priorities",
        engineRecord,
        allocationRecords: ranked,
        validation: {
          validationReportId: `cde-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CDE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "rank_priorities",
        [error instanceof Error ? error.message : "Priority ranking failed"],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: RecommendCapitalInput,
    _config: CapitalDistributionEngineConfiguration,
  ): CapitalRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const recommendations = this.recommendations.recommend({
        allocations: this.allocationEngine.listAllocations(),
        risks: this.latestRisks,
        companyReference: input.companyReference,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend",
        engineRecord,
        poolRecords: this.getPoolRecords(),
        allocationRecords: input.companyReference
          ? this.allocationEngine.getByCompany(input.companyReference)
          : this.allocationEngine.listAllocations(),
        riskSignals: this.latestRisks,
        recommendations,
        validation: {
          validationReportId: `cde-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CDE_METADATA_VERSION,
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
    input: RunCapitalDiagnosticsInput,
    _config: CapitalDistributionEngineConfiguration,
  ): CapitalRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const allocations = input.companyReference
        ? this.allocationEngine.getByCompany(input.companyReference)
        : this.allocationEngine.listAllocations();
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!this.allocationEngine.getPool()) {
        errors.push("Missing financial data — capital pool not initialized");
      }
      if (allocations.length === 0) {
        warnings.push(
          input.companyReference
            ? "No allocations for company reference"
            : "No capital allocations recorded",
        );
      }

      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        poolRecords: this.getPoolRecords(),
        allocationRecords: allocations,
        riskSignals: this.latestRisks,
        validation: {
          validationReportId: `cde-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
          errors,
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: CDE_METADATA_VERSION,
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
    this.latestRisks = [];
    this.allocationEngine.resetForTesting();
  }
}
