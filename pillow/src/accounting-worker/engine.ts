import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAccountingWorkerConfiguration,
  type AccountingWorkerConfiguration,
} from "./configuration.js";
import type { AccountingWorkerDependencies } from "./integrations.js";
import { AccountingWorkerController } from "./accounting-worker-controller.js";
import { resetAccwLogsForTesting } from "./accw-logging.js";
import { AccountingWorkerManager } from "./accounting-manager.js";
import { resetAccwSequenceForTesting } from "./ledger-store.js";
import { ACCOUNTING_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  AccountingWorkerCockpitSnapshot,
  AccountingWorkerState,
  AccwInput,
  Q903ConsumableContract,
} from "./types.js";

export interface AccountingWorkerOptions {
  configuration?: Partial<AccountingWorkerConfiguration>;
  dependencies?: AccountingWorkerDependencies;
}

/**
 * Authoritative Q9-02 Accounting Worker — real, append-only ledger orchestration only.
 *
 * The Accounting Worker records income and expenses, maintains asset and liability
 * registers, posts balanced transfers and general ledger entries, and produces
 * Accounting Reports consumable by Q9-03 and later. It integrates with the Q9-01
 * Capital Factory Core via dependency injection only — it never reimplements Q9-01
 * orchestration, never forecasts finances, never approves investments, and never
 * replaces the Budget Planning Worker.
 */
export class AccountingWorker {
  private initializedAt: string | null = null;
  private readonly controller: AccountingWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: AccountingWorkerOptions = {},
  ) {
    const manager = new AccountingWorkerManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new AccountingWorkerController(
      manager,
      buildAccountingWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      ACCOUNTING_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Accounting Worker")) {
      throw new Error(`${ACCOUNTING_WORKER_SYSTEM_PATH} missing — Q9-02 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: AccountingWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): AccountingWorkerState {
    if (!this.initializedAt) {
      throw new Error("Accounting Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-ACCW-001",
      missionId: "Q9-02",
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
        totalEntries: engineRecord?.totalEntries ?? 0,
        totalAccounts: engineRecord?.totalAccounts ?? 0,
        lastLedgerBalanced: engineRecord?.lastLedgerBalanced ?? null,
        lastBusinessId: engineRecord?.lastBusinessId ?? null,
        notes: [
          "Accounting Worker maintains a real, append-only ledger from observed inputs only: it does not forecast finances, approve investments, replace the Budget Planning Worker, override Pillow or Grand King, or implement Q9-03 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  recordIncome(input: AccwInput = {}) {
    return this.controller.recordIncome(input);
  }

  recordExpense(input: AccwInput = {}) {
    return this.controller.recordExpense(input);
  }

  maintainAsset(input: AccwInput = {}) {
    return this.controller.maintainAsset(input);
  }

  recordAsset(input: AccwInput = {}) {
    return this.controller.maintainAsset(input);
  }

  maintainLiability(input: AccwInput = {}) {
    return this.controller.maintainLiability(input);
  }

  recordLiability(input: AccwInput = {}) {
    return this.controller.maintainLiability(input);
  }

  recordTransfer(input: AccwInput = {}) {
    return this.controller.recordTransfer(input);
  }

  postJournalEntry(input: AccwInput = {}) {
    return this.controller.postJournalEntry(input);
  }

  maintainGeneralLedger(input: AccwInput = {}) {
    return this.controller.maintainGeneralLedger(input);
  }

  generateAccountingSummary(input: AccwInput = {}) {
    return this.controller.generateAccountingSummary(input);
  }

  produceAccountingReport(input: AccwInput = {}) {
    return this.controller.produceAccountingReport(input);
  }

  produceReport(input: AccwInput = {}) {
    return this.controller.produceAccountingReport(input);
  }

  submitReport(input: AccwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getAccounts() {
    return this.controller.getManager().getAccounts();
  }

  getEntries() {
    return this.controller.getManager().getEntries();
  }

  getAssets() {
    return this.controller.getManager().getAssets();
  }

  getLiabilities() {
    return this.controller.getManager().getLiabilities();
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

  getQ903ConsumableContract(): Q903ConsumableContract {
    return this.controller.getQ903ConsumableContract();
  }

  validate(input: AccwInput = {}) {
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
      health:
        score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Journal entries posted: ${state.health.totalEntries}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AccountingWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-02",
      status: state.status,
      healthStatus: state.health.status,
      totalEntries: state.health.totalEntries,
      totalAccounts: state.health.totalAccounts,
      lastLedgerBalanced: state.health.lastLedgerBalanced,
      latestCapitalBusinessId: this.getLatestBusinessId(),
      workerId: state.configuration.workerId,
      neverFabricateAccountingRecords: true,
      neverForecastFinances: true,
      neverApproveInvestments: true,
      neverReplaceBudgetPlanningWorker: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ903OrLater: true,
      consumableByQ903: true,
    };
  }
}

export function createAccountingWorker(
  bootstrap: EmpireBootstrapContext,
  options?: AccountingWorkerOptions,
) {
  return new AccountingWorker(bootstrap, options);
}

export function resetAccountingWorkerForTesting() {
  resetAccwLogsForTesting();
  resetAccwSequenceForTesting();
}
