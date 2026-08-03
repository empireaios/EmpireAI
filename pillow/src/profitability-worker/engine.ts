import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildProfitabilityWorkerConfiguration, type ProfitabilityWorkerConfiguration } from "./configuration.js";
import type { ProfitabilityWorkerDependencies } from "./integrations.js";
import { ProfitabilityWorkerController } from "./profitability-worker-controller.js";
import { resetPrfwLogsForTesting } from "./prfw-logging.js";
import { ProfitabilityWorkerManager } from "./profitability-manager.js";
import { resetPrfwSequenceForTesting } from "./profitability-store.js";
import { PROFITABILITY_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  AnalysisScope,
  PrfwInput,
  ProfitabilityWorkerCockpitSnapshot,
  ProfitabilityWorkerState,
  Q906ConsumableContract,
} from "./types.js";

export interface ProfitabilityWorkerOptions {
  configuration?: Partial<ProfitabilityWorkerConfiguration>;
  dependencies?: ProfitabilityWorkerDependencies;
}

/**
 * Authoritative Q9-05 Profitability Worker — real gross/operating/net profit
 * calculation, shared-cost allocation, multi-dimensional profitability
 * analysis, and deterministic Profitability reporting inside the Capital
 * Factory.
 *
 * The Profitability Worker consumes verified, already-categorised
 * `FinancialLineItem` records (plus verified Accounting/Cashflow/Budget
 * Planning Worker records for traceability/context) to compute real gross
 * profit, operating profit, and net profit; allocates real shared
 * operational cost pools proportionally by net-revenue weight; analyses
 * profitability by business, product, and project; identifies evidence-
 * based profit and loss drivers; ranks scopes by net profit; and produces
 * machine-readable Profitability Reports consumable by Q9-06 (Forecasting
 * Worker) and later. It integrates with the Q9-01 Capital Factory Core,
 * Q9-02 Accounting Worker, Q9-03 Cashflow Worker, and Q9-04 Budget Planning
 * Worker exclusively through dependency injection — it never reimplements
 * their orchestration, never fabricates revenue/cost/fee/refund/
 * profitability figures, never forecasts future profitability, never
 * approves spending, never executes financial transactions, never replaces
 * the Forecasting Worker, and never modifies accounting records.
 */
export class ProfitabilityWorker {
  private initializedAt: string | null = null;
  private readonly controller: ProfitabilityWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ProfitabilityWorkerOptions = {},
  ) {
    const manager = new ProfitabilityWorkerManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ProfitabilityWorkerController(
      manager,
      buildProfitabilityWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(PROFITABILITY_WORKER_SYSTEM_PATH);
    if (!doc?.includes("Profitability Worker")) {
      throw new Error(`${PROFITABILITY_WORKER_SYSTEM_PATH} missing — Q9-05 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ProfitabilityWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ProfitabilityWorkerState {
    if (!this.initializedAt) {
      throw new Error("Profitability Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PRFW-001",
      missionId: "Q9-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalAnalyses: engineRecord?.totalAnalyses ?? 0,
        totalRankings: engineRecord?.totalRankings ?? 0,
        lastScope: engineRecord?.lastScope ?? null,
        lastBusinessId: engineRecord?.lastBusinessId ?? null,
        notes: [
          "Profitability Worker calculates real gross/operating/net profit from verified, already-categorised financial line items only: it does not forecast future profitability, approve spending, execute financial transactions, replace the Forecasting Worker, modify accounting records, override Pillow or Grand King, or implement Q9-06 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeAccountingRecords(input: PrfwInput = {}) {
    return this.controller.consumeAccountingRecords(input);
  }

  consumeCashflowReports(input: PrfwInput = {}) {
    return this.controller.consumeCashflowReports(input);
  }

  consumeBudgetReports(input: PrfwInput = {}) {
    return this.controller.consumeBudgetReports(input);
  }

  calculateGrossProfit(input: PrfwInput = {}) {
    return this.controller.calculateGrossProfit(input);
  }

  calculateOperatingProfit(input: PrfwInput = {}) {
    return this.controller.calculateOperatingProfit(input);
  }

  calculateNetProfit(input: PrfwInput = {}) {
    return this.controller.calculateNetProfit(input);
  }

  allocateSharedOperationalCosts(input: PrfwInput = {}) {
    return this.controller.allocateSharedOperationalCosts(input);
  }

  analyseProfitabilityByBusiness(input: PrfwInput = {}) {
    return this.controller.analyseProfitabilityByBusiness(input);
  }

  analyseProfitabilityByProduct(input: PrfwInput = {}) {
    return this.controller.analyseProfitabilityByProduct(input);
  }

  analyseProfitabilityByProject(input: PrfwInput = {}) {
    return this.controller.analyseProfitabilityByProject(input);
  }

  identifyProfitDrivers(input: PrfwInput = {}) {
    return this.controller.identifyProfitDrivers(input);
  }

  identifyLossDrivers(input: PrfwInput = {}) {
    return this.controller.identifyLossDrivers(input);
  }

  rankProfitability(input: PrfwInput = {}) {
    return this.controller.rankProfitability(input);
  }

  produceProfitabilityReport(input: PrfwInput = {}) {
    return this.controller.produceProfitabilityReport(input);
  }

  produceReport(input: PrfwInput = {}) {
    return this.controller.produceProfitabilityReport(input);
  }

  submitReport(input: PrfwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getAnalyses(scope?: AnalysisScope) {
    return this.controller.getManager().getAnalyses(scope);
  }

  getRankings() {
    return this.controller.getManager().getRankings();
  }

  getDrivers() {
    return {
      profitDrivers: this.controller.getManager().getProfitDrivers(),
      lossDrivers: this.controller.getManager().getLossDrivers(),
    };
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestBusinessId() {
    return this.controller.getManager().getLatestBusinessId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  getQ906ConsumableContract(): Q906ConsumableContract {
    return this.controller.getQ906ConsumableContract();
  }

  validate(input: PrfwInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Profitability analyses tracked: ${state.health.totalAnalyses}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ProfitabilityWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-05",
      status: state.status,
      healthStatus: state.health.status,
      totalAnalyses: state.health.totalAnalyses,
      totalRankings: state.health.totalRankings,
      lastScope: state.health.lastScope,
      latestCapitalBusinessId: this.getLatestBusinessId(),
      workerId: state.configuration.workerId,
      neverFabricateRevenueCostFeeRefundOrProfitabilityFigures: true,
      neverForecastFutureProfitability: true,
      neverApproveSpending: true,
      neverExecuteFinancialTransactions: true,
      neverReplaceForecastingWorker: true,
      neverModifyAccountingRecords: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ906OrLater: true,
      consumableByQ906: true,
    };
  }
}

export function createProfitabilityWorker(bootstrap: EmpireBootstrapContext, options?: ProfitabilityWorkerOptions) {
  return new ProfitabilityWorker(bootstrap, options);
}

export function resetProfitabilityWorkerForTesting() {
  resetPrfwLogsForTesting();
  resetPrfwSequenceForTesting();
}
