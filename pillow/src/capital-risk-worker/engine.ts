import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCapitalRiskWorkerConfiguration,
  type CapitalRiskWorkerConfiguration,
} from "./configuration.js";
import type { CapitalRiskWorkerDependencies } from "./integrations.js";
import { CapitalRiskWorkerController } from "./capital-risk-worker-controller.js";
import { resetCaprwLogsForTesting } from "./caprw-logging.js";
import { CapitalRiskWorkerManager } from "./risk-manager.js";
import { resetCaprwSequenceForTesting } from "./risk-store.js";
import { CAPITAL_RISK_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  CapitalRiskWorkerCockpitSnapshot,
  CapitalRiskWorkerState,
  CaprwInput,
  Q911ConsumableContract,
} from "./types.js";

export interface CapitalRiskWorkerOptions {
  configuration?: Partial<CapitalRiskWorkerConfiguration>;
  dependencies?: CapitalRiskWorkerDependencies;
}

/**
 * Authoritative Q9-10 Capital Risk Worker — detects capital risks from verified upstream
 * financial snapshots inside the Capital Factory. Never approves financial decisions,
 * never executes investments, never moves capital, and never fabricates risks or evidence.
 */
export class CapitalRiskWorker {
  private initializedAt: string | null = null;
  private readonly controller: CapitalRiskWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CapitalRiskWorkerOptions = {},
  ) {
    const manager = new CapitalRiskWorkerManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new CapitalRiskWorkerController(
      manager,
      buildCapitalRiskWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      CAPITAL_RISK_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Capital Risk Worker")) {
      throw new Error(`${CAPITAL_RISK_WORKER_SYSTEM_PATH} missing — Q9-10 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CapitalRiskWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): CapitalRiskWorkerState {
    if (!this.initializedAt) {
      throw new Error("Capital Risk Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CAPRW-001",
      missionId: "Q9-10",
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
        totalRisks: engineRecord?.totalRisks ?? 0,
        totalReports: engineRecord?.totalReports ?? 0,
        totalDashboards: engineRecord?.totalDashboards ?? 0,
        lastBusinessId: engineRecord?.lastBusinessId ?? null,
        notes: [
          "Capital Risk Worker detects capital risks from verified snapshots: it never approves financial decisions, never executes investments, never moves capital, never fabricates risks or evidence, never automatically executes mitigation, and never implements Q9-11 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input as CaprwInput);
  }

  consumeAccountingRecords(input: CaprwInput = {}) {
    return this.controller.consumeAccountingRecords(input);
  }

  consumeCashflowReports(input: CaprwInput = {}) {
    return this.controller.consumeCashflowReports(input);
  }

  consumeBudgetReports(input: CaprwInput = {}) {
    return this.controller.consumeBudgetReports(input);
  }

  consumeProfitabilityReports(input: CaprwInput = {}) {
    return this.controller.consumeProfitabilityReports(input);
  }

  consumeForecastingReports(input: CaprwInput = {}) {
    return this.controller.consumeForecastingReports(input);
  }

  consumeTaxSupportReports(input: CaprwInput = {}) {
    return this.controller.consumeTaxSupportReports(input);
  }

  consumeInvestmentPlanningReports(input: CaprwInput = {}) {
    return this.controller.consumeInvestmentPlanningReports(input);
  }

  consumeFinancialReportingReports(input: CaprwInput = {}) {
    return this.controller.consumeFinancialReportingReports(input);
  }

  detectRisks(input: CaprwInput = {}) {
    return this.controller.detectRisks(input);
  }

  prioritiseRisks(input: CaprwInput = {}) {
    return this.controller.prioritiseRisks(input);
  }

  generateExecutiveRiskDashboard(input: CaprwInput = {}) {
    return this.controller.generateExecutiveRiskDashboard(input);
  }

  produceCapitalRiskReport(input: CaprwInput = {}) {
    return this.controller.produceCapitalRiskReport(input);
  }

  produceReport(input: CaprwInput = {}) {
    return this.controller.produceCapitalRiskReport(input);
  }

  submitReport(input: CaprwInput = {}) {
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

  getQ911ConsumableContract(): Q911ConsumableContract {
    return this.controller.getQ911ConsumableContract();
  }

  validate(input: CaprwInput = {}) {
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
        `Capital risk reports tracked: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CapitalRiskWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-10",
      status: state.status,
      healthStatus: state.health.status,
      totalRisks: state.health.totalRisks,
      totalReports: state.health.totalReports,
      totalDashboards: state.health.totalDashboards,
      latestCapitalBusinessId: this.getLatestBusinessId(),
      workerId: state.configuration.workerId,
      neverApproveFinancialDecisions: true,
      neverExecuteInvestments: true,
      neverMoveCapital: true,
      neverFabricateRisksOrEvidence: true,
      neverAutomaticallyExecuteMitigation: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ911OrLater: true,
      consumableByQ911: true,
    };
  }
}

export function createCapitalRiskWorker(
  bootstrap: EmpireBootstrapContext,
  options?: CapitalRiskWorkerOptions,
) {
  return new CapitalRiskWorker(bootstrap, options);
}

export function resetCapitalRiskWorkerForTesting() {
  resetCaprwLogsForTesting();
  resetCaprwSequenceForTesting();
}
