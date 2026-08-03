import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildTaxSupportWorkerConfiguration,
  type TaxSupportWorkerConfiguration,
} from "./configuration.js";
import type { TaxSupportWorkerDependencies } from "./integrations.js";
import { TaxSupportWorkerController } from "./tax-support-worker-controller.js";
import { resetTswLogsForTesting } from "./tsw-logging.js";
import { TaxSupportWorkerManager } from "./tax-manager.js";
import { resetTswSequenceForTesting } from "./tax-store.js";
import { TAX_SUPPORT_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  Q908ConsumableContract,
  TaxSupportWorkerCockpitSnapshot,
  TaxSupportWorkerState,
  TswInput,
} from "./types.js";

export interface TaxSupportWorkerOptions {
  configuration?: Partial<TaxSupportWorkerConfiguration>;
  dependencies?: TaxSupportWorkerDependencies;
}

/**
 * Authoritative Q9-07 Tax Support Worker — prepares tax-support data,
 * records, and reminders from verified financial evidence inside the
 * Capital Factory.
 *
 * Organises verified Accounting Worker / caller-tagged transactions;
 * prepares factual income and expense summaries; detects missing
 * documentation; generates filing-reminder schedules; flags items for
 * professional review; and produces machine-readable Tax Support Reports
 * consumable by Q9-08. Never provides legal or tax advice, never fabricates
 * tax calculations or obligations, never submits filings automatically, and
 * never modifies accounting records.
 */
export class TaxSupportWorker {
  private initializedAt: string | null = null;
  private readonly controller: TaxSupportWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: TaxSupportWorkerOptions = {},
  ) {
    const manager = new TaxSupportWorkerManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new TaxSupportWorkerController(
      manager,
      buildTaxSupportWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(TAX_SUPPORT_WORKER_SYSTEM_PATH);
    if (!doc?.includes("Tax Support Worker")) {
      throw new Error(`${TAX_SUPPORT_WORKER_SYSTEM_PATH} missing — Q9-07 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: TaxSupportWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): TaxSupportWorkerState {
    if (!this.initializedAt) {
      throw new Error("Tax Support Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-TSW-001",
      missionId: "Q9-07",
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
        totalRecords: engineRecord?.totalRecords ?? 0,
        totalReminders: engineRecord?.totalReminders ?? 0,
        totalMissingDocs: engineRecord?.totalMissingDocs ?? 0,
        lastBusinessId: engineRecord?.lastBusinessId ?? null,
        notes: [
          "Tax Support Worker prepares tax-support data from verified financial records only: it never provides legal or tax advice, never fabricates tax calculations or obligations, never submits filings automatically, never replaces accountants, never modifies accounting records, never overrides Pillow or Grand King, or implements Q9-08 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input as TswInput);
  }

  consumeAccountingRecords(input: TswInput = {}) {
    return this.controller.consumeAccountingRecords(input);
  }

  consumeCashflowReports(input: TswInput = {}) {
    return this.controller.consumeCashflowReports(input);
  }

  consumeProfitabilityReports(input: TswInput = {}) {
    return this.controller.consumeProfitabilityReports(input);
  }

  consumeForecastingReports(input: TswInput = {}) {
    return this.controller.consumeForecastingReports(input);
  }

  organiseRecords(input: TswInput = {}) {
    return this.controller.organiseRecords(input);
  }

  prepareIncomeSummary(input: TswInput = {}) {
    return this.controller.prepareIncomeSummary(input);
  }

  prepareExpenseSummary(input: TswInput = {}) {
    return this.controller.prepareExpenseSummary(input);
  }

  detectMissingDocumentation(input: TswInput = {}) {
    return this.controller.detectMissingDocumentation(input);
  }

  generateFilingReminders(input: TswInput = {}) {
    return this.controller.generateFilingReminders(input);
  }

  flagProfessionalReview(input: TswInput = {}) {
    return this.controller.flagProfessionalReview(input);
  }

  produceTaxSupportReport(input: TswInput = {}) {
    return this.controller.produceTaxSupportReport(input);
  }

  produceReport(input: TswInput = {}) {
    return this.controller.produceTaxSupportReport(input);
  }

  submitReport(input: TswInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getRecords() {
    return this.controller.getManager().getStore().getRecords();
  }

  getReminders() {
    return this.controller.getManager().getStore().getReminders();
  }

  getMissingDocumentation() {
    return this.controller.getManager().getStore().getMissing();
  }

  getProfessionalReviewFlags() {
    return this.controller.getManager().getStore().getFlags();
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

  getQ908ConsumableContract(): Q908ConsumableContract {
    return this.controller.getQ908ConsumableContract();
  }

  validate(input: TswInput = {}) {
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
        `Tax-support records tracked: ${state.health.totalRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TaxSupportWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-07",
      status: state.status,
      healthStatus: state.health.status,
      totalRecords: state.health.totalRecords,
      totalReminders: state.health.totalReminders,
      totalMissingDocs: state.health.totalMissingDocs,
      latestCapitalBusinessId: this.getLatestBusinessId(),
      workerId: state.configuration.workerId,
      neverProvideLegalOrTaxAdvice: true,
      neverFabricateTaxCalculationsOrObligations: true,
      neverSubmitFilingsAutomatically: true,
      neverReplaceAccountantsOrTaxProfessionals: true,
      neverModifyAccountingRecords: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ908OrLater: true,
      consumableByQ908: true,
    };
  }
}

export function createTaxSupportWorker(bootstrap: EmpireBootstrapContext, options?: TaxSupportWorkerOptions) {
  return new TaxSupportWorker(bootstrap, options);
}

export function resetTaxSupportWorkerForTesting() {
  resetTswLogsForTesting();
  resetTswSequenceForTesting();
}
