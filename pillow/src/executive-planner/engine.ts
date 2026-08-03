import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildExecutivePlannerConfiguration,
  type ExecutivePlannerConfiguration,
} from "./configuration.js";
import { ExecutivePlannerController } from "./executive-planner-controller.js";
import { ExecutivePlannerManager } from "./executive-planner-manager.js";
import { resetEpLogsForTesting } from "./ep-logging.js";
import { EXECUTIVE_PLANNER_SYSTEM_PATH } from "./paths.js";
import type {
  ExecutivePlannerCockpitSnapshot,
  ExecutivePlannerInput,
  ExecutivePlannerState,
} from "./types.js";

export interface ExecutivePlannerOptions {
  configuration?: Partial<ExecutivePlannerConfiguration>;
}

export class ExecutivePlanner {
  private initializedAt: string | null = null;
  private readonly controller: ExecutivePlannerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ExecutivePlannerOptions = {},
  ) {
    this.controller = new ExecutivePlannerController(
      new ExecutivePlannerManager(),
      buildExecutivePlannerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EXECUTIVE_PLANNER_SYSTEM_PATH);
    if (!doc?.includes("Executive Planner")) {
      throw new Error(`${EXECUTIVE_PLANNER_SYSTEM_PATH} missing — Q0-01 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ExecutivePlannerState {
    if (!this.initializedAt) throw new Error("Executive Planner not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getPlans().length;
    return {
      engineVersion: "PILLOW-EP-001",
      missionId: "Q0-01",
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
        totalPlans: count,
        notes: [
          "Planning only: does not execute work, assign workers, invoke tools, or approve actions.",
        ],
      },
    };
  }

  connectExecutivePlanner(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  submitObjective(input: ExecutivePlannerInput) {
    return this.controller.submitObjective(input);
  }

  analyzeObjective(input: ExecutivePlannerInput) {
    return this.controller.analyzeObjective(input);
  }

  produceExecutionPlan(input: ExecutivePlannerInput) {
    return this.controller.produceExecutionPlan(input);
  }

  identifyWorkforceCategories(input: ExecutivePlannerInput) {
    return this.controller.identifyWorkforceCategories(input);
  }

  validatePlan(input: ExecutivePlannerInput = { objective: "" }) {
    return this.controller.validatePlan(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getPlans() {
    return this.controller.getManager().getPlans();
  }

  getLatestPlan() {
    return this.controller.getManager().getLatestPlan();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
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
        `Plans: ${state.health.totalPlans}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExecutivePlannerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-01",
      status: state.status,
      healthStatus: state.health.status,
      totalPlans: state.health.totalPlans,
      latestPlanId: this.getLatestPlan()?.planId ?? null,
      neverAssignWorkers: true,
      neverExecuteWork: true,
    };
  }
}

export function createExecutivePlanner(
  bootstrap: EmpireBootstrapContext,
  options?: ExecutivePlannerOptions,
) {
  return new ExecutivePlanner(bootstrap, options);
}

export function resetExecutivePlannerForTesting() {
  resetEpLogsForTesting();
}
