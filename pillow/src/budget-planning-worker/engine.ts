import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildBudgetPlanningWorkerConfiguration, type BudgetPlanningWorkerConfiguration } from "./configuration.js";
import type { BudgetPlanningWorkerDependencies } from "./integrations.js";
import { BudgetPlanningWorkerController } from "./budget-planning-worker-controller.js";
import { resetBpwLogsForTesting } from "./bpw-logging.js";
import { BudgetPlanningWorkerManager } from "./budget-manager.js";
import { resetBpwSequenceForTesting } from "./budget-store.js";
import { BUDGET_PLANNING_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  BpwInput,
  BudgetPlanningWorkerCockpitSnapshot,
  BudgetPlanningWorkerState,
  Q905ConsumableContract,
} from "./types.js";

export interface BudgetPlanningWorkerOptions {
  configuration?: Partial<BudgetPlanningWorkerConfiguration>;
  dependencies?: BudgetPlanningWorkerDependencies;
}

/**
 * Authoritative Q9-04 Budget Planning Worker — real budget creation,
 * utilisation tracking, and deterministic Budget Planning reporting inside
 * the Capital Factory.
 *
 * The Budget Planning Worker creates project, business, advertising,
 * infrastructure, department, and marketing budgets from explicit planned
 * amounts; tracks budget utilisation, overspending, underutilisation, and
 * depletion risk purely from injected/verified actual-expenditure evidence
 * (never fabricated); compares actual spend against planned budgets;
 * recommends evidence-based adjustments; and produces machine-readable
 * Budget Planning Reports consumable by Q9-05 (Profitability Worker) and
 * later. It integrates with the Q9-01 Capital Factory Core, Q9-02
 * Accounting Worker, and Q9-03 Cashflow Worker exclusively through
 * dependency injection — it never reimplements their orchestration, never
 * approves expenditure, never executes payments, never forecasts revenue,
 * never replaces the Profitability Worker, and never modifies accounting
 * records.
 */
export class BudgetPlanningWorker {
  private initializedAt: string | null = null;
  private readonly controller: BudgetPlanningWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: BudgetPlanningWorkerOptions = {},
  ) {
    const manager = new BudgetPlanningWorkerManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new BudgetPlanningWorkerController(
      manager,
      buildBudgetPlanningWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(BUDGET_PLANNING_WORKER_SYSTEM_PATH);
    if (!doc?.includes("Budget Planning Worker")) {
      throw new Error(`${BUDGET_PLANNING_WORKER_SYSTEM_PATH} missing — Q9-04 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: BudgetPlanningWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): BudgetPlanningWorkerState {
    if (!this.initializedAt) {
      throw new Error("Budget Planning Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-BPW-001",
      missionId: "Q9-04",
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
        totalBudgets: engineRecord?.totalBudgets ?? 0,
        totalVariances: engineRecord?.totalVariances ?? 0,
        lastApprovalStatus: engineRecord?.lastApprovalStatus ?? null,
        lastBusinessId: engineRecord?.lastBusinessId ?? null,
        notes: [
          "Budget Planning Worker creates and tracks budgets from real planned/actual amounts only: it does not approve expenditure, execute payments, forecast revenue, replace the Profitability Worker, modify accounting records, override Pillow or Grand King, or implement Q9-05 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createProjectBudget(input: BpwInput = {}) {
    return this.controller.createProjectBudget(input);
  }

  createBusinessBudget(input: BpwInput = {}) {
    return this.controller.createBusinessBudget(input);
  }

  createAdvertisingBudget(input: BpwInput = {}) {
    return this.controller.createAdvertisingBudget(input);
  }

  createInfrastructureBudget(input: BpwInput = {}) {
    return this.controller.createInfrastructureBudget(input);
  }

  createBudget(input: BpwInput = {}) {
    return this.controller.createBudget(input);
  }

  trackBudgetUtilisation(input: BpwInput = {}) {
    return this.controller.trackBudgetUtilisation(input);
  }

  detectBudgetOverruns(input: BpwInput = {}) {
    return this.controller.detectBudgetOverruns(input);
  }

  detectUnderutilisedBudgets(input: BpwInput = {}) {
    return this.controller.detectUnderutilisedBudgets(input);
  }

  compareActualVsBudget(input: BpwInput = {}) {
    return this.controller.compareActualVsBudget(input);
  }

  recommendBudgetAdjustments(input: BpwInput = {}) {
    return this.controller.recommendBudgetAdjustments(input);
  }

  produceBudgetPlanningReport(input: BpwInput = {}) {
    return this.controller.produceBudgetPlanningReport(input);
  }

  produceReport(input: BpwInput = {}) {
    return this.controller.produceBudgetPlanningReport(input);
  }

  submitReport(input: BpwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getBudgets() {
    return this.controller.getManager().getBudgets();
  }

  getVariances() {
    return this.controller.getManager().getVariances();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
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

  getQ905ConsumableContract(): Q905ConsumableContract {
    return this.controller.getQ905ConsumableContract();
  }

  validate(input: BpwInput = {}) {
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
        `Budgets tracked: ${state.health.totalBudgets}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BudgetPlanningWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-04",
      status: state.status,
      healthStatus: state.health.status,
      totalBudgets: state.health.totalBudgets,
      totalVariances: state.health.totalVariances,
      lastApprovalStatus: state.health.lastApprovalStatus,
      latestCapitalBusinessId: this.getLatestBusinessId(),
      workerId: state.configuration.workerId,
      neverFabricateBudgetValuesOrSpendingData: true,
      neverApproveExpenditure: true,
      neverExecutePayments: true,
      neverForecastRevenue: true,
      neverReplaceProfitabilityWorker: true,
      neverModifyAccountingRecords: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ905OrLater: true,
      consumableByQ905: true,
    };
  }
}

export function createBudgetPlanningWorker(bootstrap: EmpireBootstrapContext, options?: BudgetPlanningWorkerOptions) {
  return new BudgetPlanningWorker(bootstrap, options);
}

export function resetBudgetPlanningWorkerForTesting() {
  resetBpwLogsForTesting();
  resetBpwSequenceForTesting();
}
