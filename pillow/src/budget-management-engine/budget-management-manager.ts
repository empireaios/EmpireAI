/** R3-14 — Budget Management Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { FinancialForecastEngine } from "../financial-forecast-engine/engine.js";
import { BUDGET_MANAGEMENT_ENGINE_ID, BMG_METADATA_VERSION } from "./paths.js";
import { appendBmgLog } from "./bmg-logging.js";
import { BudgetRegistry } from "./budget-registry.js";
import { BudgetDataSource } from "./budget-data-source.js";
import { BudgetPlanningEngine } from "./budget-planning-engine.js";
import { BudgetAllocationEngine } from "./budget-allocation-engine.js";
import { BudgetTrackingEngine } from "./budget-tracking-engine.js";
import { BudgetVarianceAnalyzer } from "./budget-variance-analyzer.js";
import { BudgetRecommendationEngine } from "./budget-recommendation-engine.js";
import { BudgetMetadataGenerator } from "./budget-metadata-generator.js";
import { BudgetValidator } from "./budget-validator.js";
import { BudgetRetryManager } from "./budget-retry-manager.js";
import type { BudgetManagementEngineConfiguration } from "./configuration.js";
import type {
  AllocateBudgetInput,
  BudgetManagementEngineRecord,
  BudgetManagementRunReport,
  BudgetOverrun,
  BudgetRecommendation,
  BudgetRecord,
  BudgetVariance,
  CompareActualVsBudgetInput,
  ConnectBudgetManagementEngineInput,
  CreateBudgetInput,
  DetectBudgetOverrunsInput,
  DetectBudgetVariancesInput,
  GenerateBudgetRecommendationsInput,
  TrackBudgetUtilizationInput,
} from "./types.js";

export class BudgetManagementManager {
  private engineRecord: BudgetManagementEngineRecord | null = null;
  private readonly registry = new BudgetRegistry();
  private readonly validator = new BudgetValidator();
  private readonly metadataGenerator = new BudgetMetadataGenerator();
  private readonly planningEngine = new BudgetPlanningEngine();
  private readonly allocationEngine = new BudgetAllocationEngine();
  private readonly trackingEngine = new BudgetTrackingEngine();
  private readonly varianceAnalyzer = new BudgetVarianceAnalyzer();
  private readonly recommendationEngine = new BudgetRecommendationEngine();
  private readonly retryManager = new BudgetRetryManager();
  private readonly dataSource: BudgetDataSource;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly cashFlowMonitor: CashFlowMonitorEngine | null,
    private readonly financialForecastEngine: FinancialForecastEngine | null,
  ) {
    this.dataSource = new BudgetDataSource(
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      cashFlowMonitor,
      financialForecastEngine,
    );
  }

  getEngineRecord(): BudgetManagementEngineRecord | null {
    return this.engineRecord;
  }

  getBudgetRecords() {
    return this.registry.list();
  }

  private isConnected(record: { currentOperationalState?: string } | null | undefined): boolean {
    const state = record?.currentOperationalState;
    return state === "active" || state === "connected";
  }

  private probeConnections() {
    const reConnected = this.isConnected(this.revenueEngine?.getEngineRecord?.());
    const exConnected = this.isConnected(this.expenseEngine?.getEngineRecord?.());
    const pcConnected = this.isConnected(this.profitCalculationEngine?.getEngineRecord?.());
    const cfConnected = this.isConnected(this.cashFlowMonitor?.getMonitorRecord?.());
    const fctConnected = this.isConnected(this.financialForecastEngine?.getEngineRecord?.());
    return { reConnected, exConnected, pcConnected, cfConnected, fctConnected };
  }

  registerWithFramework(
    config: BudgetManagementEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: BudgetManagementRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: BUDGET_MANAGEMENT_ENGINE_ID,
        moduleVersion: BMG_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-14",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://budget-management-engine",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["budget.created", "budget.overrun", "budget.variance", "budget.failed"],
          maxEventsPerMinute: 120,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: false,
          requestsPerMinute: 120,
          burstLimit: 20,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "financial_module_registration",
          "financial_module_activation",
          "financial_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendBmgLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered budget management engine with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `bmg-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: BMG_METADATA_VERSION,
      },
    };
  }

  connectBudgetManagementEngine(
    _input: ConnectBudgetManagementEngineInput,
    config: BudgetManagementEngineConfiguration,
  ): BudgetManagementRunReport {
    const started = Date.now();
    const { reConnected, exConnected, pcConnected, cfConnected, fctConnected } =
      this.probeConnections();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(BUDGET_MANAGEMENT_ENGINE_ID);
    }

    const allConnected = reConnected && exConnected && cfConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      profitCalculationEngineConnected: pcConnected,
      cashFlowMonitorConnected: cfConnected,
      financialForecastEngineConnected: fctConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!cfConnected) validation.warnings.push("Cash Flow Monitor not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      budgetRecords: [],
      variances: [],
      overruns: [],
      recommendations: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private resolveTargetRecord(budgetRecordId?: string): BudgetRecord | null {
    return budgetRecordId
      ? this.registry.get(budgetRecordId)
      : this.registry.latest();
  }

  private runBudgetAction(
    action: BudgetManagementRunReport["action"],
    fn: () => {
      records: BudgetRecord[];
      variances: BudgetVariance[];
      overruns: BudgetOverrun[];
      recommendations: BudgetRecommendation[];
      error: string | null;
      warnings: string[];
    },
    config: BudgetManagementEngineConfiguration,
    eventTopic?: string,
  ): BudgetManagementRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Budget management engine not connected");

    const result = fn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    if (this.framework && result.records.length > 0 && eventTopic) {
      for (const record of result.records) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: BUDGET_MANAGEMENT_ENGINE_ID,
          topic: eventTopic,
          payloadRef: record.budgetRecordId,
        });
      }
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      budgetRecords: result.records,
      variances: result.variances,
      overruns: result.overruns,
      recommendations: result.recommendations,
      validation,
      durationMs: Date.now() - started,
    });
  }

  createBudget(
    input: CreateBudgetInput,
    config: BudgetManagementEngineConfiguration,
  ): BudgetManagementRunReport {
    const period = input.budgetPeriod ?? config.defaultBudgetPeriod;
    const category = input.budgetCategory ?? config.defaultBudgetCategory;
    const dedupeKey = `budget:${period}:${category}`;

    return this.runBudgetAction(
      "create_budget",
      () => {
        if (this.registry.hasDedupeKey(dedupeKey)) {
          return {
            records: [],
            variances: [],
            overruns: [],
            recommendations: [],
            error: "Duplicate budget for period and category",
            warnings: [],
          };
        }

        const defValidation = this.validator.validateBudgetDefinition(
          period,
          category,
          input.budgetAllocation,
          config,
        );
        if (defValidation.decision === "fail") {
          return {
            records: [],
            variances: [],
            overruns: [],
            recommendations: [],
            error: defValidation.errors.join("; "),
            warnings: defValidation.warnings,
          };
        }

        const snapshot = this.dataSource.snapshot();
        const actual = this.dataSource.getActualForCategory(category, snapshot);
        const record = this.metadataGenerator.buildBudgetRecord({
          budgetPeriod: period,
          budgetCategory: category,
          budgetAllocation: input.budgetAllocation,
          actualExpenditure: actual,
          validationStatus: "passed",
        });

        const recordValidation = this.validator.validateBudgetRecord(record, config);
        if (recordValidation.decision === "fail") {
          return {
            records: [],
            variances: [],
            overruns: [],
            recommendations: [],
            error: recordValidation.errors.join("; "),
            warnings: [...snapshot.warnings, ...recordValidation.warnings],
          };
        }

        this.registry.store(record, dedupeKey);
        appendBmgLog({
          event: "budget_creation",
          level: "info",
          details: `Budget ${record.budgetRecordId} period=${period} category=${category} allocation=${input.budgetAllocation}`,
        });

        return {
          records: [record],
          variances: [],
          overruns: [],
          recommendations: [],
          error: null,
          warnings: [...snapshot.warnings, ...recordValidation.warnings],
        };
      },
      config,
      "budget.created",
    );
  }

  allocateBudget(
    input: AllocateBudgetInput,
    config: BudgetManagementEngineConfiguration,
  ): BudgetManagementRunReport {
    return this.runBudgetAction(
      "allocate_budget",
      () => {
        const existing = this.registry.get(input.budgetRecordId);
        if (!existing) {
          return {
            records: [],
            variances: [],
            overruns: [],
            recommendations: [],
            error: "Budget record not found",
            warnings: [],
          };
        }

        const allocResult = this.allocationEngine.allocate(
          existing,
          input.additionalAllocation,
          config,
        );
        if (allocResult.error) {
          return {
            records: [],
            variances: [],
            overruns: [],
            recommendations: [],
            error: allocResult.error,
            warnings: allocResult.warnings,
          };
        }

        const updated = this.metadataGenerator.buildBudgetRecord({
          budgetPeriod: existing.budgetPeriod,
          budgetCategory: existing.budgetCategory,
          budgetAllocation: allocResult.allocation,
          actualExpenditure: existing.actualExpenditure,
          validationStatus: existing.validationStatus,
          budgetStatus: existing.budgetStatus,
        });
        updated.budgetRecordId = existing.budgetRecordId;

        const recordValidation = this.validator.validateBudgetRecord(updated, config);
        this.registry.update(updated);

        appendBmgLog({
          event: "budget_allocation",
          level: "info",
          details: `Allocated +${input.additionalAllocation} to ${updated.budgetRecordId}`,
        });

        return {
          records: [updated],
          variances: [],
          overruns: [],
          recommendations: [],
          error: null,
          warnings: [...allocResult.warnings, ...recordValidation.warnings],
        };
      },
      config,
      "budget.created",
    );
  }

  trackBudgetUtilization(
    input: TrackBudgetUtilizationInput,
    config: BudgetManagementEngineConfiguration,
  ): BudgetManagementRunReport {
    return this.runBudgetAction(
      "track_utilization",
      () => {
        const target = this.resolveTargetRecord(input.budgetRecordId);
        if (!target) {
          return {
            records: [],
            variances: [],
            overruns: [],
            recommendations: [],
            error: "No budget record available for utilization tracking",
            warnings: [],
          };
        }

        const snapshot = this.dataSource.snapshot();
        const actual = this.dataSource.getActualForCategory(target.budgetCategory, snapshot);
        const tracked = this.trackingEngine.trackUtilization(target, snapshot, actual);
        tracked.budgetRecordId = target.budgetRecordId;
        this.registry.update(tracked);

        appendBmgLog({
          event: "budget_utilization",
          level: "info",
          details: `Utilization ${tracked.budgetUtilizationPercentage}% for ${tracked.budgetRecordId}`,
        });

        return {
          records: [tracked],
          variances: [],
          overruns: [],
          recommendations: [],
          error: null,
          warnings: snapshot.warnings,
        };
      },
      config,
    );
  }

  compareActualVsBudget(
    input: CompareActualVsBudgetInput,
    config: BudgetManagementEngineConfiguration,
  ): BudgetManagementRunReport {
    return this.runBudgetAction(
      "compare_actual",
      () => {
        const target = this.resolveTargetRecord(input.budgetRecordId);
        if (!target) {
          return {
            records: [],
            variances: [],
            overruns: [],
            recommendations: [],
            error: "No budget record available for comparison",
            warnings: [],
          };
        }

        const snapshot = this.dataSource.snapshot();
        const actual = this.dataSource.getActualForCategory(target.budgetCategory, snapshot);
        const comparison = this.trackingEngine.compareActualVsBudget(target, snapshot, actual);
        const updated = this.trackingEngine.trackUtilization(target, snapshot, actual);
        updated.budgetRecordId = target.budgetRecordId;
        this.registry.update(updated);

        const warnings = [
          ...snapshot.warnings,
          `Actual ${comparison.actual} vs budgeted ${comparison.budgeted} (variance ${comparison.variancePercent}%)`,
        ];

        return {
          records: [updated],
          variances: [],
          overruns: [],
          recommendations: [],
          error: null,
          warnings,
        };
      },
      config,
    );
  }

  detectBudgetOverruns(
    input: DetectBudgetOverrunsInput,
    config: BudgetManagementEngineConfiguration,
  ): BudgetManagementRunReport {
    return this.runBudgetAction(
      "detect_overruns",
      () => {
        const target = this.resolveTargetRecord(input.budgetRecordId);
        if (!target) {
          return {
            records: [],
            variances: [],
            overruns: [],
            recommendations: [],
            error: "No budget record available for overrun detection",
            warnings: [],
          };
        }

        const snapshot = this.dataSource.snapshot();
        const actual = this.dataSource.getActualForCategory(target.budgetCategory, snapshot);
        const tracked = this.trackingEngine.trackUtilization(target, snapshot, actual);
        tracked.budgetRecordId = target.budgetRecordId;
        this.registry.update(tracked);

        const overruns = this.varianceAnalyzer.detectOverruns(tracked, config);

        appendBmgLog({
          event: "budget_overrun",
          level: overruns.length > 0 ? "warn" : "info",
          details: `Detected ${overruns.length} overrun(s)`,
        });

        return {
          records: [tracked],
          variances: [],
          overruns,
          recommendations: [],
          error: null,
          warnings: snapshot.warnings,
        };
      },
      config,
      "budget.overrun",
    );
  }

  detectBudgetVariances(
    input: DetectBudgetVariancesInput,
    config: BudgetManagementEngineConfiguration,
  ): BudgetManagementRunReport {
    return this.runBudgetAction(
      "detect_variances",
      () => {
        const target = this.resolveTargetRecord(input.budgetRecordId);
        if (!target) {
          return {
            records: [],
            variances: [],
            overruns: [],
            recommendations: [],
            error: "No budget record available for variance detection",
            warnings: [],
          };
        }

        const snapshot = this.dataSource.snapshot();
        const actual = this.dataSource.getActualForCategory(target.budgetCategory, snapshot);
        const tracked = this.trackingEngine.trackUtilization(target, snapshot, actual);
        tracked.budgetRecordId = target.budgetRecordId;
        this.registry.update(tracked);

        const variances = this.varianceAnalyzer.detectVariances(tracked, config);

        appendBmgLog({
          event: "budget_variance",
          level: variances.length > 0 ? "warn" : "info",
          details: `Detected ${variances.length} variance(s)`,
        });

        return {
          records: [tracked],
          variances,
          overruns: [],
          recommendations: [],
          error: null,
          warnings: snapshot.warnings,
        };
      },
      config,
      "budget.variance",
    );
  }

  generateBudgetRecommendations(
    input: GenerateBudgetRecommendationsInput,
    config: BudgetManagementEngineConfiguration,
  ): BudgetManagementRunReport {
    return this.runBudgetAction(
      "generate_recommendations",
      () => {
        const target = this.resolveTargetRecord(input.budgetRecordId);
        if (!target) {
          return {
            records: [],
            variances: [],
            overruns: [],
            recommendations: [],
            error: "No budget record available for recommendations",
            warnings: [],
          };
        }

        const snapshot = this.dataSource.snapshot();
        const actual = this.dataSource.getActualForCategory(target.budgetCategory, snapshot);
        const tracked = this.trackingEngine.trackUtilization(target, snapshot, actual);
        tracked.budgetRecordId = target.budgetRecordId;
        this.registry.update(tracked);

        const recommendations = this.recommendationEngine.generate(tracked, snapshot, config);

        appendBmgLog({
          event: "budget_recommendation",
          level: "info",
          details: `Generated ${recommendations.length} recommendation(s)`,
        });

        return {
          records: [tracked],
          variances: [],
          overruns: [],
          recommendations,
          error: null,
          warnings: snapshot.warnings,
        };
      },
      config,
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
