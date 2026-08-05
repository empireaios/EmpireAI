import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildInvestmentPlanningWorkerConfiguration,
  type InvestmentPlanningWorkerConfiguration,
} from "./configuration.js";
import type { InvestmentPlanningWorkerDependencies } from "./integrations.js";
import { InvestmentPlanningWorkerController } from "./investment-planning-worker-controller.js";
import { resetIpwLogsForTesting } from "./ipw-logging.js";
import { InvestmentPlanningWorkerManager } from "./investment-manager.js";
import { resetIpwSequenceForTesting } from "./investment-store.js";
import { INVESTMENT_PLANNING_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  InvestmentPlanningWorkerCockpitSnapshot,
  InvestmentPlanningWorkerState,
  IpwInput,
  Q909ConsumableContract,
} from "./types.js";

export interface InvestmentPlanningWorkerOptions {
  configuration?: Partial<InvestmentPlanningWorkerConfiguration>;
  dependencies?: InvestmentPlanningWorkerDependencies;
}

/**
 * Authoritative Q9-08 Investment Planning Worker — evaluates caller-supplied
 * investment opportunities, ranks them deterministically, and produces capital
 * allocation recommendations inside the Capital Factory.
 *
 * Consumes verified upstream reports for traceability and measured available
 * capital context. Never executes investments, never approves investments,
 * never moves or allocates capital, never modifies accounting records, and
 * never fabricates ROI or payback.
 */
export class InvestmentPlanningWorker {
  private initializedAt: string | null = null;
  private readonly controller: InvestmentPlanningWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: InvestmentPlanningWorkerOptions = {},
  ) {
    const manager = new InvestmentPlanningWorkerManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new InvestmentPlanningWorkerController(
      manager,
      buildInvestmentPlanningWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      INVESTMENT_PLANNING_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Investment Planning Worker")) {
      throw new Error(`${INVESTMENT_PLANNING_WORKER_SYSTEM_PATH} missing — Q9-08 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: InvestmentPlanningWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): InvestmentPlanningWorkerState {
    if (!this.initializedAt) {
      throw new Error("Investment Planning Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-IPW-001",
      missionId: "Q9-08",
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
        totalOpportunities: engineRecord?.totalOpportunities ?? 0,
        totalReports: engineRecord?.totalReports ?? 0,
        totalRecommendations: engineRecord?.totalRecommendations ?? 0,
        lastBusinessId: engineRecord?.lastBusinessId ?? null,
        notes: [
          "Investment Planning Worker evaluates caller-supplied opportunities and produces recommendations only: it never executes investments, never approves investments, never moves or allocates capital, never fabricates ROI or payback, never modifies accounting records, never overrides Pillow or Grand King, or implements Q9-09 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input as IpwInput);
  }

  consumeAccountingRecords(input: IpwInput = {}) {
    return this.controller.consumeAccountingRecords(input);
  }

  consumeCashflowReports(input: IpwInput = {}) {
    return this.controller.consumeCashflowReports(input);
  }

  consumeProfitabilityReports(input: IpwInput = {}) {
    return this.controller.consumeProfitabilityReports(input);
  }

  consumeForecastingReports(input: IpwInput = {}) {
    return this.controller.consumeForecastingReports(input);
  }

  consumeTaxSupportReports(input: IpwInput = {}) {
    return this.controller.consumeTaxSupportReports(input);
  }

  consumeBudgetReports(input: IpwInput = {}) {
    return this.controller.consumeBudgetReports(input);
  }

  evaluateOpportunities(input: IpwInput = {}) {
    return this.controller.evaluateOpportunities(input);
  }

  compareAlternatives(input: IpwInput = {}) {
    return this.controller.compareAlternatives(input);
  }

  rankOpportunities(input: IpwInput = {}) {
    return this.controller.rankOpportunities(input);
  }

  assessRisks(input: IpwInput = {}) {
    return this.controller.assessRisks(input);
  }

  produceInvestmentPlanningReport(input: IpwInput = {}) {
    return this.controller.produceInvestmentPlanningReport(input);
  }

  produceReport(input: IpwInput = {}) {
    return this.controller.produceInvestmentPlanningReport(input);
  }

  submitReport(input: IpwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getOpportunities() {
    return this.controller.getManager().getStore().getOpportunities();
  }

  getRankings() {
    return this.controller.getManager().getStore().getRankings();
  }

  getRecommendations() {
    return this.controller.getManager().getStore().getRecommendations();
  }

  getLatestReport() {
    return this.controller.getLatestReport();
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

  getQ909ConsumableContract(): Q909ConsumableContract {
    return this.controller.getQ909ConsumableContract();
  }

  validate(input: IpwInput = {}) {
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
        `Investment opportunities tracked: ${state.health.totalOpportunities}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): InvestmentPlanningWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-08",
      status: state.status,
      healthStatus: state.health.status,
      totalOpportunities: state.health.totalOpportunities,
      totalReports: state.health.totalReports,
      totalRecommendations: state.health.totalRecommendations,
      latestCapitalBusinessId: this.getLatestBusinessId(),
      workerId: state.configuration.workerId,
      neverExecuteInvestments: true,
      neverApproveInvestments: true,
      neverMoveOrAllocateCapital: true,
      neverModifyAccountingRecords: true,
      neverFabricateRoiOrPaybackOrRecommendations: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ909OrLater: true,
      consumableByQ909: true,
    };
  }
}

export function createInvestmentPlanningWorker(
  bootstrap: EmpireBootstrapContext,
  options?: InvestmentPlanningWorkerOptions,
) {
  return new InvestmentPlanningWorker(bootstrap, options);
}

export function resetInvestmentPlanningWorkerForTesting() {
  resetIpwLogsForTesting();
  resetIpwSequenceForTesting();
}
