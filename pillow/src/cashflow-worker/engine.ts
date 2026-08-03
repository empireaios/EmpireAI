import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildCashflowWorkerConfiguration, type CashflowWorkerConfiguration } from "./configuration.js";
import type { CashflowWorkerDependencies } from "./integrations.js";
import { CashflowWorkerController } from "./cashflow-worker-controller.js";
import { resetCfwLogsForTesting } from "./cfw-logging.js";
import { CashflowWorkerManager } from "./cashflow-manager.js";
import { resetCfwSequenceForTesting } from "./cashflow-store.js";
import { CASHFLOW_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  CashflowWorkerCockpitSnapshot,
  CashflowWorkerState,
  CfwInput,
  Q904ConsumableContract,
} from "./types.js";

export interface CashflowWorkerOptions {
  configuration?: Partial<CashflowWorkerConfiguration>;
  dependencies?: CashflowWorkerDependencies;
}

/**
 * Authoritative Q9-03 Cashflow Worker — real cash-inflow/outflow tracking,
 * opening/closing balance maintenance, and deterministic cashflow reporting.
 *
 * The Cashflow Worker consumes exclusively verified Accounting Worker (Q9-02)
 * journal entries — injected directly or fetched via dependency injection —
 * and never fabricates balances or flows. It tracks inflows and outflows,
 * separates internal transfers from enterprise income/expense, maintains
 * opening/closing cash balances, produces daily/weekly/monthly/annual/custom
 * cashflow views at account/business/factory/enterprise scope, surfaces
 * unreconciled movements, compares periods, and produces Cashflow Reports
 * consumable by Q9-04 (Budget Planning Worker) and later. It integrates with
 * the Q9-01 Capital Factory Core and Q9-02 Accounting Worker via dependency
 * injection only — it never reimplements their orchestration, never creates
 * budgets, never forecasts future cashflow, never calculates complete
 * business profitability, never approves spending, and never moves money.
 */
export class CashflowWorker {
  private initializedAt: string | null = null;
  private readonly controller: CashflowWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CashflowWorkerOptions = {},
  ) {
    const manager = new CashflowWorkerManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new CashflowWorkerController(
      manager,
      buildCashflowWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(CASHFLOW_WORKER_SYSTEM_PATH);
    if (!doc?.includes("Cashflow Worker")) {
      throw new Error(`${CASHFLOW_WORKER_SYSTEM_PATH} missing — Q9-03 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CashflowWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): CashflowWorkerState {
    if (!this.initializedAt) {
      throw new Error("Cashflow Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CFW-001",
      missionId: "Q9-03",
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
        totalMovements: engineRecord?.totalMovements ?? 0,
        totalViews: engineRecord?.totalViews ?? 0,
        lastReconciliationStatus: engineRecord?.lastReconciliationStatus ?? null,
        lastBusinessId: engineRecord?.lastBusinessId ?? null,
        notes: [
          "Cashflow Worker tracks real cash inflows/outflows from verified Accounting Worker records only: it does not create budgets, forecast future cashflow, calculate complete business profitability, approve spending, move money, override Pillow or Grand King, or implement Q9-04 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeAccountingRecords(input: CfwInput = {}) {
    return this.controller.consumeAccountingRecords(input);
  }

  trackCashInflows(input: CfwInput = {}) {
    return this.controller.trackCashInflows(input);
  }

  trackCashOutflows(input: CfwInput = {}) {
    return this.controller.trackCashOutflows(input);
  }

  calculateNetCashflow(input: CfwInput = {}) {
    return this.controller.calculateNetCashflow(input);
  }

  maintainOpeningClosingBalances(input: CfwInput = {}) {
    return this.controller.maintainOpeningClosingBalances(input);
  }

  computeBalances(input: CfwInput = {}) {
    return this.controller.maintainOpeningClosingBalances(input);
  }

  produceDailyCashflowView(input: CfwInput = {}) {
    return this.controller.produceDailyCashflowView(input);
  }

  produceWeeklyCashflowView(input: CfwInput = {}) {
    return this.controller.produceWeeklyCashflowView(input);
  }

  produceMonthlyCashflowView(input: CfwInput = {}) {
    return this.controller.produceMonthlyCashflowView(input);
  }

  produceAnnualCashflowView(input: CfwInput = {}) {
    return this.controller.produceAnnualCashflowView(input);
  }

  produceCustomCashflowView(input: CfwInput = {}) {
    return this.controller.produceCustomCashflowView(input);
  }

  produceBusinessCashflowView(input: CfwInput = {}) {
    return this.controller.produceBusinessCashflowView(input);
  }

  produceConsolidatedCashflowView(input: CfwInput = {}) {
    return this.controller.produceConsolidatedCashflowView(input);
  }

  identifyUnreconciledMovements(input: CfwInput = {}) {
    return this.controller.identifyUnreconciledMovements(input);
  }

  comparePeriods(input: CfwInput = {}) {
    return this.controller.comparePeriods(input);
  }

  produceCashflowReport(input: CfwInput = {}) {
    return this.controller.produceCashflowReport(input);
  }

  produceReport(input: CfwInput = {}) {
    return this.controller.produceCashflowReport(input);
  }

  submitReport(input: CfwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getMovements() {
    return this.controller.getManager().getMovements();
  }

  getViews() {
    return this.controller.getManager().getViews();
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

  getQ904ConsumableContract(): Q904ConsumableContract {
    return this.controller.getQ904ConsumableContract();
  }

  validate(input: CfwInput = {}) {
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
        `Cash movements tracked: ${state.health.totalMovements}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CashflowWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-03",
      status: state.status,
      healthStatus: state.health.status,
      totalMovements: state.health.totalMovements,
      totalViews: state.health.totalViews,
      lastReconciliationStatus: state.health.lastReconciliationStatus,
      latestCapitalBusinessId: this.getLatestBusinessId(),
      workerId: state.configuration.workerId,
      neverFabricateBalancesOrFlows: true,
      neverCreateBudgets: true,
      neverForecastFutureCashflow: true,
      neverCalculateCompleteBusinessProfitability: true,
      neverApproveSpending: true,
      neverMoveMoney: true,
      neverModifyVerifiedAccountingRecords: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ904OrLater: true,
      consumableByQ904: true,
    };
  }
}

export function createCashflowWorker(bootstrap: EmpireBootstrapContext, options?: CashflowWorkerOptions) {
  return new CashflowWorker(bootstrap, options);
}

export function resetCashflowWorkerForTesting() {
  resetCfwLogsForTesting();
  resetCfwSequenceForTesting();
}
