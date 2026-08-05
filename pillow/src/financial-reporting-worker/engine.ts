import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildFinancialReportingWorkerConfiguration,
  type FinancialReportingWorkerConfiguration,
} from "./configuration.js";
import type { FinancialReportingWorkerDependencies } from "./integrations.js";
import { FinancialReportingWorkerController } from "./financial-reporting-worker-controller.js";
import { resetFrwLogsForTesting } from "./frw-logging.js";
import { FinancialReportingWorkerManager } from "./reporting-manager.js";
import { resetFrwSequenceForTesting } from "./reporting-store.js";
import { FINANCIAL_REPORTING_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  FinancialReportingWorkerCockpitSnapshot,
  FinancialReportingWorkerState,
  FrwInput,
  Q910ConsumableContract,
} from "./types.js";

export interface FinancialReportingWorkerOptions {
  configuration?: Partial<FinancialReportingWorkerConfiguration>;
  dependencies?: FinancialReportingWorkerDependencies;
}

/**
 * Authoritative Q9-09 Financial Reporting Worker — consolidates verified upstream
 * financial snapshots into executive dashboards and Financial Reports inside the
 * Capital Factory. Never executes financial transactions, never approves financial
 * decisions, never modifies accounting records, and never fabricates figures.
 */
export class FinancialReportingWorker {
  private initializedAt: string | null = null;
  private readonly controller: FinancialReportingWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: FinancialReportingWorkerOptions = {},
  ) {
    const manager = new FinancialReportingWorkerManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new FinancialReportingWorkerController(
      manager,
      buildFinancialReportingWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      FINANCIAL_REPORTING_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Financial Reporting Worker")) {
      throw new Error(`${FINANCIAL_REPORTING_WORKER_SYSTEM_PATH} missing — Q9-09 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: FinancialReportingWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): FinancialReportingWorkerState {
    if (!this.initializedAt) {
      throw new Error("Financial Reporting Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-FRW-001",
      missionId: "Q9-09",
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
        totalReports: engineRecord?.totalReports ?? 0,
        totalDashboards: engineRecord?.totalDashboards ?? 0,
        lastBusinessId: engineRecord?.lastBusinessId ?? null,
        notes: [
          "Financial Reporting Worker consolidates verified financial snapshots into executive dashboards and Financial Reports: it never executes financial transactions, never approves financial decisions, never modifies accounting records, never fabricates figures, never overrides Pillow or Grand King, or implements Q9-10 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input as FrwInput);
  }

  consumeAccountingRecords(input: FrwInput = {}) {
    return this.controller.consumeAccountingRecords(input);
  }

  consumeCashflowReports(input: FrwInput = {}) {
    return this.controller.consumeCashflowReports(input);
  }

  consumeBudgetReports(input: FrwInput = {}) {
    return this.controller.consumeBudgetReports(input);
  }

  consumeProfitabilityReports(input: FrwInput = {}) {
    return this.controller.consumeProfitabilityReports(input);
  }

  consumeForecastingReports(input: FrwInput = {}) {
    return this.controller.consumeForecastingReports(input);
  }

  consumeTaxSupportReports(input: FrwInput = {}) {
    return this.controller.consumeTaxSupportReports(input);
  }

  consumeInvestmentPlanningReports(input: FrwInput = {}) {
    return this.controller.consumeInvestmentPlanningReports(input);
  }

  generateExecutiveDashboard(input: FrwInput = {}) {
    return this.controller.generateExecutiveDashboard(input);
  }

  generateCapitalSummary(input: FrwInput = {}) {
    return this.controller.generateCapitalSummary(input);
  }

  produceFinancialReport(input: FrwInput = {}) {
    return this.controller.produceFinancialReport(input);
  }

  produceReport(input: FrwInput = {}) {
    return this.controller.produceFinancialReport(input);
  }

  submitReport(input: FrwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getLatestReport() {
    return this.controller.getLatestReport();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getDashboards() {
    return this.controller.getManager().getStore().getDashboards();
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

  getQ910ConsumableContract(): Q910ConsumableContract {
    return this.controller.getQ910ConsumableContract();
  }

  validate(input: FrwInput = {}) {
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
        `Financial reports tracked: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): FinancialReportingWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-09",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalDashboards: state.health.totalDashboards,
      latestCapitalBusinessId: this.getLatestBusinessId(),
      workerId: state.configuration.workerId,
      neverExecuteFinancialTransactions: true,
      neverApproveFinancialDecisions: true,
      neverModifyAccountingRecords: true,
      neverFabricateFinancialFigures: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ910OrLater: true,
      consumableByQ910: true,
    };
  }
}

export function createFinancialReportingWorker(
  bootstrap: EmpireBootstrapContext,
  options?: FinancialReportingWorkerOptions,
) {
  return new FinancialReportingWorker(bootstrap, options);
}

export function resetFinancialReportingWorkerForTesting() {
  resetFrwLogsForTesting();
  resetFrwSequenceForTesting();
}
