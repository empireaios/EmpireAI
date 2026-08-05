import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildImplementationRecoveryPlannerConfiguration,
  type ImplementationRecoveryPlannerConfiguration,
} from "./configuration.js";
import type { ImplementationRecoveryPlannerDependencies } from "./integrations.js";
import {
  ImplementationRecoveryPlannerManager,
  resetImplementationRecoveryPlannerManagerSequencesForTesting,
} from "./implementation-recovery-planner-manager.js";
import { ImplementationRecoveryPlannerController } from "./implementation-recovery-planner-controller.js";
import { resetIrplnLogsForTesting } from "./irpln-logging.js";
import { IMPLEMENTATION_RECOVERY_PLANNER_SYSTEM_PATH } from "./paths.js";
import { resetIrplnSequenceForTesting } from "./audit-store.js";
import type {
  ImplementationRecoveryPlannerCockpitSnapshot,
  ImplementationRecoveryPlannerState,
  IrplnInput,
} from "./types.js";

export interface ImplementationRecoveryPlannerOptions {
  configuration?: Partial<ImplementationRecoveryPlannerConfiguration>;
  dependencies?: ImplementationRecoveryPlannerDependencies;
}

/**
 * Authoritative Q13-05 Implementation Recovery Planner — recovery planning only; never executes recovery.
 * Consumes getQ1305ConsumableContract from cursorSpecificationGenerator (CSGEN, Q13-04).
 * Exposes Q1306ConsumableContract for Q13-06 without implementing Q13-06 or later.
 */
export class ImplementationRecoveryPlanner {
  private initializedAt: string | null = null;
  private readonly manager: ImplementationRecoveryPlannerManager;
  private readonly controller: ImplementationRecoveryPlannerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ImplementationRecoveryPlannerOptions = {},
  ) {
    this.manager = new ImplementationRecoveryPlannerManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new ImplementationRecoveryPlannerController(
      this.manager,
      buildImplementationRecoveryPlannerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      IMPLEMENTATION_RECOVERY_PLANNER_SYSTEM_PATH,
    );
    if (!doc?.includes("Implementation Recovery Planner")) {
      throw new Error(`${IMPLEMENTATION_RECOVERY_PLANNER_SYSTEM_PATH} missing — Q13-05 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ImplementationRecoveryPlannerDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): ImplementationRecoveryPlannerState {
    if (!this.initializedAt) {
      throw new Error("Implementation Recovery Planner not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const latestPlan = this.controller.getLatestPlan();
    const latestRecoverySpecification = this.controller.getLatestRecoverySpecification();
    return {
      engineVersion: "PILLOW-IRPLN-001",
      missionId: "Q13-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      latestPlan,
      latestRecoverySpecification,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: Math.round((latestReport?.confidenceScore ?? 0) * 100) || 0,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        totalPlans: engineRecord?.totalPlans ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastRecoveryId: engineRecord?.lastRecoveryId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Implementation Recovery Planner: recovery planning only; never executes recovery; never modifies repository.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  detectInterruptedOrIncompleteMission(input: IrplnInput = {}) {
    return this.controller.detectInterruptedOrIncompleteMission(input);
  }

  analyseCurrentRepositoryState(input: IrplnInput = {}) {
    return this.controller.analyseCurrentRepositoryState(input);
  }

  compareAgainstApprovedSpecification(input: IrplnInput = {}) {
    return this.controller.compareAgainstApprovedSpecification(input);
  }

  detectCompletedWork() {
    return this.controller.detectCompletedWork();
  }

  detectPartialWork() {
    return this.controller.detectPartialWork();
  }

  detectMissingImplementation() {
    return this.controller.detectMissingImplementation();
  }

  detectConflictingImplementation() {
    return this.controller.detectConflictingImplementation();
  }

  generateRecoveryStrategy() {
    return this.controller.generateRecoveryStrategy();
  }

  generateRecoveryPlan(input: IrplnInput = {}) {
    return this.controller.generateRecoveryPlan(input);
  }

  generateRecoverySpecification(input: IrplnInput = {}) {
    return this.controller.generateRecoverySpecification(input);
  }

  produceRecoveryReport(input: IrplnInput = {}) {
    return this.controller.produceRecoveryReport(input);
  }

  async produceReport(input: IrplnInput = {}) {
    return this.produceRecoveryReport(input);
  }

  submitReport(input: IrplnInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.manager.getReports();
  }

  getPlans() {
    return this.manager.getPlans();
  }

  getCatalog() {
    return this.manager.getCatalog();
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getRecoveryHistory(limit = 100) {
    return this.manager.getRecoveryHistory(limit);
  }

  getQ1306ConsumableContract() {
    return this.controller.getQ1306ConsumableContract();
  }

  validate(input: IrplnInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getCockpitSnapshot(): ImplementationRecoveryPlannerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q13-05",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalPlans: state.health.totalPlans,
      latestReportId: state.health.lastReportId,
      latestRecoveryId: state.health.lastRecoveryId,
      workerId: state.configuration.workerId,
      neverExecuteRecovery: true,
      neverModifyRepository: true,
      neverImplementQ1306OrLater: true,
      neverOverwriteVerifiedImplementations: true,
      neverBypassGovernance: true,
    };
  }

  validateForSupervisorSync() {
    const diagnostics = this.runDiagnostics();
    return {
      missionId: "Q13-05" as const,
      readinessScore: diagnostics.readinessScore,
      q1305PrerequisitePresent: diagnostics.q1305PrerequisitePresent,
      reports: diagnostics.reports,
      plans: diagnostics.plans,
    };
  }
}

export function createImplementationRecoveryPlanner(
  bootstrap: EmpireBootstrapContext,
  options?: ImplementationRecoveryPlannerOptions,
) {
  return new ImplementationRecoveryPlanner(bootstrap, options);
}

export function resetImplementationRecoveryPlannerForTesting() {
  resetIrplnSequenceForTesting();
  resetIrplnLogsForTesting();
  resetImplementationRecoveryPlannerManagerSequencesForTesting();
}
