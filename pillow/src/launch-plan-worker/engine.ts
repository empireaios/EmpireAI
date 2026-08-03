import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLaunchPlanWorkerConfiguration,
  type LaunchPlanWorkerConfiguration,
} from "./configuration.js";
import type { LaunchPlanWorkerDependencies } from "./integrations.js";
import { LaunchPlanWorkerController } from "./launch-plan-worker-controller.js";
import { resetLpwLogsForTesting } from "./lpw-logging.js";
import { LAUNCH_PLAN_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetPlanSequenceForTesting } from "./plan-builder.js";
import { PlanManager } from "./plan-manager.js";
import type {
  LaunchPlanWorkerCockpitSnapshot,
  LaunchPlanWorkerInput,
  LaunchPlanWorkerState,
} from "./types.js";

export interface LaunchPlanWorkerOptions {
  configuration?: Partial<LaunchPlanWorkerConfiguration>;
  dependencies?: LaunchPlanWorkerDependencies;
}

/** Authoritative Q2-07 Launch Plan Worker — planning only. */
export class LaunchPlanWorker {
  private initializedAt: string | null = null;
  private readonly controller: LaunchPlanWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: LaunchPlanWorkerOptions = {},
  ) {
    const manager = new PlanManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new LaunchPlanWorkerController(
      manager,
      buildLaunchPlanWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      LAUNCH_PLAN_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Launch Plan Worker")) {
      throw new Error(
        `${LAUNCH_PLAN_WORKER_SYSTEM_PATH} missing — Q2-07 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: LaunchPlanWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): LaunchPlanWorkerState {
    if (!this.initializedAt) {
      throw new Error("Launch Plan Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-LPW-001",
      missionId: "Q2-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalLaunchPlans: engineRecord?.totalLaunchPlans ?? 0,
        lastLaunchPlanId: engineRecord?.lastLaunchPlanId ?? null,
        notes: [
          "Planning-only: does not execute launch tasks, assign workers, create assets, connect accounts, launch businesses, approve launches, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectLaunchPlanWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveBusinessBlueprint(input: LaunchPlanWorkerInput = {}) {
    return this.controller.receiveBlueprint(input);
  }

  identifyLaunchStages(input: LaunchPlanWorkerInput = {}) {
    return this.controller.identifyStages(input);
  }

  defineLaunchMilestones(input: LaunchPlanWorkerInput = {}) {
    return this.controller.defineMilestones(input);
  }

  defineLaunchTasks(input: LaunchPlanWorkerInput = {}) {
    return this.controller.defineTasks(input);
  }

  defineLaunchDependencies(input: LaunchPlanWorkerInput = {}) {
    return this.controller.defineDependencies(input);
  }

  defineLaunchCheckpoints(input: LaunchPlanWorkerInput = {}) {
    return this.controller.defineCheckpoints(input);
  }

  defineLaunchBlockers(input: LaunchPlanWorkerInput = {}) {
    return this.controller.defineBlockers(input);
  }

  produceLaunchPlan(input: LaunchPlanWorkerInput = {}) {
    return this.controller.produceLaunchPlan(input);
  }

  submitLaunchPlan(input: LaunchPlanWorkerInput = {}) {
    return this.controller.submitLaunchPlan(input);
  }

  listLaunchPlans() {
    return this.controller.list();
  }

  validateLaunchPlanWorker(input: LaunchPlanWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getLaunchPlans() {
    return this.controller.getManager().getLaunchPlans();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestLaunchPlanId() {
    return this.controller.getManager().getLatestLaunchPlanId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
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
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Launch plans: ${state.health.totalLaunchPlans}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LaunchPlanWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q2-07",
      status: state.status,
      healthStatus: state.health.status,
      totalLaunchPlans: state.health.totalLaunchPlans,
      latestLaunchPlanId: this.getLatestLaunchPlanId(),
      workerId: state.configuration.workerId,
      neverExecuteLaunchTasks: true,
      neverAssignWorkersDirectly: true,
      neverCreateBusinessAssets: true,
      neverConnectExternalAccounts: true,
      neverLaunchBusiness: true,
      neverApproveLaunch: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createLaunchPlanWorker(
  bootstrap: EmpireBootstrapContext,
  options?: LaunchPlanWorkerOptions,
) {
  return new LaunchPlanWorker(bootstrap, options);
}

export function resetLaunchPlanWorkerForTesting() {
  resetLpwLogsForTesting();
  resetPlanSequenceForTesting();
}
